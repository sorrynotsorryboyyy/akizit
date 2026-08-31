import 'server-only';
import { getLeadsByIds } from '../leads/queries';
import { isStillSellable } from '../leads/exclusivity';
import { computeTotals, type Totals } from './totals';
import { MAX_CART_ITEMS } from './tiers';

/**
 * Devis autoritaire.
 *
 * Le navigateur n'envoie que des identifiants. Les prix sont relus depuis la
 * base, les remises recalculées ici, et c'est ce résultat qui fait foi — un
 * panier falsifié dans le localStorage ne peut donc qu'ajouter ou retirer des
 * leads, jamais changer un tarif.
 */

export type QuoteLine = {
  leadId: string;
  vertical: string;
  ville: string;
  departement: string;
  unitPriceCents: number;
};

export type UnavailableLine = {
  leadId: string;
  reason: 'introuvable' | 'epuise' | 'reserve' | 'deja_achete';
};

export type Quote = {
  lines: QuoteLine[];
  unavailable: UnavailableLine[];
  totals: Totals;
};

export async function buildQuote(
  leadIds: string[],
  options: { proId?: string; ownedLeadIds?: string[]; now?: number } = {},
): Promise<Quote> {
  const now = options.now ?? Date.now();
  const owned = new Set(options.ownedLeadIds ?? []);

  // Déduplication et plafonnement : un panier surdimensionné ferait dépasser
  // la limite de 500 opérations d'une transaction Firestore.
  const uniqueIds = [...new Set(leadIds)].slice(0, MAX_CART_ITEMS);

  const leads = await getLeadsByIds(uniqueIds);
  const byId = new Map(leads.map((l) => [l.id, l]));

  const lines: QuoteLine[] = [];
  const unavailable: UnavailableLine[] = [];

  for (const leadId of uniqueIds) {
    const lead = byId.get(leadId);

    if (!lead) {
      unavailable.push({ leadId, reason: 'introuvable' });
      continue;
    }

    if (owned.has(leadId)) {
      unavailable.push({ leadId, reason: 'deja_achete' });
      continue;
    }

    if (!isStillSellable(lead.soldCount, lead.maxBuyers) || lead.status === 'sold_out') {
      unavailable.push({ leadId, reason: 'epuise' });
      continue;
    }

    // Une réservation expirée est traitée comme libre : c'est ce qui évite
    // qu'un abandon de paiement bloque le stock jusqu'au prochain balayage.
    const reservedByOther =
      lead.status === 'reserved' &&
      lead.reservedBy !== options.proId &&
      (lead.reservedUntilMs ?? 0) > now;

    if (reservedByOther) {
      unavailable.push({ leadId, reason: 'reserve' });
      continue;
    }

    lines.push({
      leadId: lead.id,
      vertical: lead.vertical,
      ville: lead.city,
      departement: lead.departement,
      unitPriceCents: lead.priceCents,
    });
  }

  return {
    lines,
    unavailable,
    totals: computeTotals(
      lines.map((l) => ({ leadId: l.leadId, unitPriceCents: l.unitPriceCents })),
    ),
  };
}
