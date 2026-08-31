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
 * 0 % : l'éditeur relève de la franchise en base (art. 293 B du CGI). Le jour
 * d'un dépassement de seuil, repasser cette seule constante à 0.2 bascule tout
 * le système — c'est la raison d'être de ce point unique.
 */
export const VAT_RATE = 0;

/** Mention obligatoire sur les factures en franchise en base. */
export const VAT_EXEMPTION_NOTICE = 'TVA non applicable, art. 293 B du CGI';

/** Vrai quand aucune TVA n'est facturée : pilote l'affichage HT/TTC. */
export const VAT_EXEMPT = VAT_RATE === 0;

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
