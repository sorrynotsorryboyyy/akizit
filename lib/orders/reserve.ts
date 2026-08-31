import 'server-only';
import { adminDb } from '../firebase/admin';
import { computeTotals } from '../pricing/totals';
import { isStillSellable } from '../leads/exclusivity';
import { CheckoutError, RESERVATION_MINUTES, type OrderDoc, type OrderItem } from './types';
import type { LeadDoc } from '../leads/types';

/**
 * Réservation des leads et création de la commande.
 *
 * Tout se joue dans UNE transaction Firestore. Sans elle, deux professionnels
 * payant simultanément le même lead exclusif seraient tous deux débités, et
 * l'un des deux n'aurait rien.
 *
 * La transaction Firestore est optimiste avec relecture : si un autre client
 * modifie l'un des leads entre la lecture et l'écriture, elle rejoue
 * automatiquement, et la seconde tentative lève LEAD_INDISPONIBLE. C'est ce
 * qui rend la survente impossible sans verrou explicite.
 */
export async function createOrderWithReservation(
  proId: string,
  leadIds: string[],
  options: { provider?: 'mock' | 'stripe'; now?: number } = {},
): Promise<OrderDoc> {
  const uniqueIds = [...new Set(leadIds)];
  if (uniqueIds.length === 0) throw new CheckoutError('PANIER_VIDE');

  const db = adminDb();
  const now = options.now ?? Date.now();
  const expiresAt = now + RESERVATION_MINUTES * 60_000;
  const orderRef = db.collection('orders').doc();

  return db.runTransaction(async (tx) => {
    const leadRefs = uniqueIds.map((id) => db.collection('leads').doc(id));
    const entitlementRefs = uniqueIds.map((id) =>
      db.collection('entitlements').doc(`${proId}_${id}`),
    );

    // Firestore impose que TOUTES les lectures précèdent les écritures.
    const [leadSnaps, entitlementSnaps] = await Promise.all([
      tx.getAll(...leadRefs),
      tx.getAll(...entitlementRefs),
    ]);

    const items: OrderItem[] = [];

    for (let i = 0; i < leadSnaps.length; i++) {
      const snap = leadSnaps[i];
      if (!snap.exists) throw new CheckoutError('LEAD_INTROUVABLE', snap.id);

      // Un lead déjà acquis ne doit pas être refacturé.
      if (entitlementSnaps[i].exists) {
        throw new CheckoutError('DEJA_ACHETE', snap.id);
      }

      const lead = { id: snap.id, ...snap.data() } as LeadDoc;

      if (!isStillSellable(lead.soldCount, lead.maxBuyers)) {
        throw new CheckoutError('LEAD_INDISPONIBLE', snap.id);
      }

      // Prenable si libre, si la réservation a expiré, ou si c'est déjà nous
      // qui la détenons — cas du retour au panier après abandon.
      const takeable =
        lead.status === 'available' ||
        (lead.status === 'reserved' &&
          (lead.reservedBy === proId || (lead.reservedUntilMs ?? 0) <= now));

      if (!takeable) throw new CheckoutError('LEAD_INDISPONIBLE', snap.id);

      items.push({
        leadId: lead.id,
        vertical: lead.vertical,
        ville: lead.city,
        departement: lead.departement,
        unitPriceCents: lead.priceCents,
      });
    }

    // Montants calculés à partir des prix relus DANS la transaction : ils ne
    // peuvent pas avoir changé entre le devis et la commande.
    const totals = computeTotals(
      items.map((i) => ({ leadId: i.leadId, unitPriceCents: i.unitPriceCents })),
    );

    for (const ref of leadRefs) {
      tx.update(ref, {
        status: 'reserved',
        reservedBy: proId,
        reservedUntilMs: expiresAt,
        updatedAtMs: now,
      });
    }

    const order: OrderDoc = {
      id: orderRef.id,
      proId,
      status: 'pending',
      items,
      ...totals,
      provider: options.provider ?? 'mock',
      providerSessionId: null,
      providerPaymentIntentId: null,
      reservationExpiresAtMs: expiresAt,
      paidAtMs: null,
      invoiceNumber: null,
      createdAtMs: now,
      updatedAtMs: now,
    };

    tx.set(orderRef, order);
    return order;
  });
}

/**
 * Libération d'une réservation abandonnée.
 *
 * Complète le traitement paresseux (tout lecteur considère une réservation
 * périmée comme libre) : sans ce balayage, le stock ne réapparaîtrait sur la
 * carte qu'à la prochaine tentative d'achat.
 */
export async function releaseExpiredReservations(
  options: { now?: number; limit?: number } = {},
): Promise<{ ordersExpired: number; leadsReleased: number }> {
  const db = adminDb();
  const now = options.now ?? Date.now();

  const staleOrders = await db
    .collection('orders')
    .where('status', '==', 'pending')
    .where('reservationExpiresAtMs', '<', now)
    .limit(options.limit ?? 100)
    .get();

  let leadsReleased = 0;

  for (const orderSnap of staleOrders.docs) {
    const order = orderSnap.data() as OrderDoc;

    await db.runTransaction(async (tx) => {
      const refs = order.items.map((i) => db.collection('leads').doc(i.leadId));
      const snaps = await tx.getAll(...refs);

      for (const snap of snaps) {
        if (!snap.exists) continue;
        const lead = snap.data() as LeadDoc;

        // Ne libérer que ce que CETTE commande retient encore : un autre pro
        // a pu réserver le lead entre-temps.
        if (lead.reservedBy !== order.proId || lead.status !== 'reserved') continue;

        tx.update(snap.ref, {
          status: isStillSellable(lead.soldCount, lead.maxBuyers)
            ? 'available'
            : 'sold_out',
          reservedBy: null,
          reservedUntilMs: null,
          updatedAtMs: now,
        });
        leadsReleased += 1;
      }

      tx.update(orderSnap.ref, { status: 'expired', updatedAtMs: now });
    });
  }

  return { ordersExpired: staleOrders.size, leadsReleased };
}
