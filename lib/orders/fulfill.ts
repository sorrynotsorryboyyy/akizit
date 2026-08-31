import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebase/admin';
import { isStillSellable } from '../leads/exclusivity';
import { CheckoutError, type EntitlementDoc, type OrderDoc } from './types';
import type { LeadDoc } from '../leads/types';

/**
 * Confirmation d'une commande payée.
 *
 * Une seule transaction écrit : leads vendus, droits d'accès et commande
 * payée. Il n'existe donc aucun instant où le professionnel aurait payé sans
 * détenir le droit d'accès, ni l'inverse.
 *
 * La fonction est IDEMPOTENTE. Stripe garantit « au moins une » livraison de
 * webhook, pas « exactement une » : sans cette propriété, un rejeu créerait
 * des droits en double et fausserait les compteurs.
 */
export async function fulfillOrder(
  orderId: string,
  payment: { paymentIntentId?: string | null; amountCents?: number } = {},
  options: { now?: number } = {},
): Promise<{ alreadyFulfilled: boolean; order: OrderDoc }> {
  const db = adminDb();
  const now = options.now ?? Date.now();

  return db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);

    if (!orderSnap.exists) throw new CheckoutError('COMMANDE_INTROUVABLE');
    const order = orderSnap.data() as OrderDoc;

    // Sortie anticipée : un rejeu de webhook est un succès silencieux.
    if (order.status === 'paid') {
      return { alreadyFulfilled: true, order };
    }
    if (order.status === 'cancelled') throw new CheckoutError('COMMANDE_ANNULEE');

    // Le montant encaissé doit correspondre au montant calculé par le serveur.
    // Un écart signale une manipulation ou un défaut de devis.
    if (
      payment.amountCents !== undefined &&
      payment.amountCents !== order.totalWithVatCents
    ) {
      throw new Error(
        `Montant incohérent : ${payment.amountCents} encaissé pour ${order.totalWithVatCents} attendu.`,
      );
    }

    const leadRefs = order.items.map((i) => db.collection('leads').doc(i.leadId));
    const counterRef = db.collection('counters').doc('invoices');

    const [leadSnaps, counterSnap] = await Promise.all([
      tx.getAll(...leadRefs),
      tx.get(counterRef),
    ]);

    const leads: LeadDoc[] = [];

    for (const snap of leadSnaps) {
      if (!snap.exists) throw new CheckoutError('LEAD_PERDU', snap.id);
      const lead = { id: snap.id, ...snap.data() } as LeadDoc;

      // Le lead doit toujours nous être réservé. Sinon la réservation a
      // expiré et un autre professionnel l'a pris : on refuse, l'appelant
      // procédera au remboursement.
      if (lead.reservedBy !== order.proId || !isStillSellable(lead.soldCount, lead.maxBuyers)) {
        throw new CheckoutError('LEAD_PERDU', snap.id);
      }

      leads.push(lead);
    }

    // Séquence calculée une seule fois : deux calculs séparés du numéro et du
    // compteur finiraient par diverger.
    const counterData = counterSnap.exists
      ? (counterSnap.data() as { year: number; seq: number })
      : null;
    const invoiceYear = new Date(now).getUTCFullYear();
    const invoiceSeq =
      !counterData || counterData.year !== invoiceYear ? 1 : counterData.seq + 1;
    const invoiceNumber = `AKZ-${invoiceYear}-${String(invoiceSeq).padStart(6, '0')}`;

    for (const lead of leads) {
      const soldCount = lead.soldCount + 1;
      const exhausted = !isStillSellable(soldCount, lead.maxBuyers);

      tx.update(db.collection('leads').doc(lead.id), {
        soldCount,
        status: exhausted ? 'sold_out' : 'available',
        reservedBy: null,
        reservedUntilMs: null,
        updatedAtMs: now,
      });

      // L'identifiant est déterministe : un rejeu écrirait le même document
      // au lieu d'en créer un second.
      const entitlement: EntitlementDoc = {
        proId: order.proId,
        leadId: lead.id,
        orderId,
        vertical: lead.vertical,
        pricePaidCents:
          order.items.find((i) => i.leadId === lead.id)?.unitPriceCents ??
          lead.basePriceCents,
        grantedAtMs: now,
      };

      tx.set(
        db.collection('entitlements').doc(`${order.proId}_${lead.id}`),
        entitlement,
      );

      // Les acheteurs sont tracés dans le document privé, hors de la vitrine :
      // exposer la liste des clients renseignerait la concurrence.
      // arrayUnion plutôt qu'un tableau reconstruit : un lead « devis » se
      // vend à trois professionnels, et réécrire le tableau effacerait les
      // acheteurs précédents.
      tx.set(
        db.collection('leadContacts').doc(lead.id),
        { buyerIds: FieldValue.arrayUnion(order.proId) },
        { merge: true },
      );
    }

    tx.set(counterRef, { year: invoiceYear, seq: invoiceSeq }, { merge: true });

    const updated: OrderDoc = {
      ...order,
      status: 'paid',
      paidAtMs: now,
      invoiceNumber,
      providerPaymentIntentId: payment.paymentIntentId ?? null,
      updatedAtMs: now,
    };

    tx.update(orderRef, {
      status: 'paid',
      paidAtMs: now,
      invoiceNumber,
      providerPaymentIntentId: payment.paymentIntentId ?? null,
      updatedAtMs: now,
    });

    // Statistiques du professionnel. Incrément atomique : écrire une valeur
    // absolue remplacerait le cumul de toutes les commandes précédentes.
    tx.set(
      db.collection('pros').doc(order.proId),
      {
        stats: {
          leadsPurchased: FieldValue.increment(order.items.length),
          totalSpentCents: FieldValue.increment(order.totalWithVatCents),
          lastPurchaseAtMs: now,
        },
      },
      { merge: true },
    );

    return { alreadyFulfilled: false, order: updated };
  });
}
