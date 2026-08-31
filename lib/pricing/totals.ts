import { discountRateFor } from './tiers';

/**
 * Calcul des montants d'une commande.
 *
 * Tout est en centimes entiers : manipuler des euros en flottant produit des
 * écarts d'arrondi qui finissent par un centime de différence entre ce que le
 * client voit, ce que Stripe encaisse et ce que porte la facture.
 */

export type QuoteItem = {
  leadId: string;
  unitPriceCents: number;
};

export type Totals = {
  itemCount: number;
  subtotalCents: number;
  discountRate: number;
  discountCents: number;
  /** Montant hors taxes après remise. */
  totalCents: number;
  vatRate: number;
  vatCents: number;
  totalWithVatCents: number;
};

/**
 * Taux de TVA appliqué.
 *
 * À confirmer selon le statut du vendeur : 20 % en régime normal, 0 % en
 * franchise en base (auto-entrepreneur), avec une mention légale différente
 * sur la facture. Centralisé ici pour n'avoir qu'un seul point à changer.
 */
export const VAT_RATE = 0.2;

export function computeTotals(
  items: readonly QuoteItem[],
  vatRate: number = VAT_RATE,
): Totals {
  const itemCount = items.length;
  const subtotalCents = items.reduce((sum, i) => sum + i.unitPriceCents, 0);
  const discountRate = discountRateFor(itemCount);

  // Arrondi au centime le plus proche, une seule fois, sur la remise.
  const discountCents = Math.round(subtotalCents * discountRate);
  const totalCents = subtotalCents - discountCents;
  const vatCents = Math.round(totalCents * vatRate);

  return {
    itemCount,
    subtotalCents,
    discountRate,
    discountCents,
    totalCents,
    vatRate,
    vatCents,
    totalWithVatCents: totalCents + vatCents,
  };
}
