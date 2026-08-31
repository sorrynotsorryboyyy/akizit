/**
 * Paliers de remise.
 *
 * Module partagé client/serveur : le navigateur en a besoin pour afficher
 * l'incitation au palier suivant (« ajoutez 1 lead, économisez 8 % »). Mais le
 * montant réellement facturé est TOUJOURS recalculé par le serveur dans
 * ./quote.ts — la valeur calculée ici ne fait jamais foi.
 */

export type DiscountTier = { minItems: number; rate: number };

/** Trié du plus avantageux au moins avantageux : le premier atteint gagne. */
export const DISCOUNT_TIERS: readonly DiscountTier[] = [
  { minItems: 10, rate: 0.1 },
  { minItems: 5, rate: 0.08 },
  { minItems: 3, rate: 0.05 },
];

/** Plafond du panier : une transaction Firestore est limitée à 500 opérations
 *  et l'on écrit environ deux documents par lead. 50 laisse une marge large. */
export const MAX_CART_ITEMS = 50;

export function discountRateFor(itemCount: number): number {
  return DISCOUNT_TIERS.find((t) => itemCount >= t.minItems)?.rate ?? 0;
}

/**
 * Palier suivant et nombre de leads à ajouter pour l'atteindre.
 * Renvoie null quand le meilleur palier est déjà atteint.
 */
export function nextTier(
  itemCount: number,
): { tier: DiscountTier; missing: number } | null {
  const upcoming = [...DISCOUNT_TIERS]
    .sort((a, b) => a.minItems - b.minItems)
    .find((t) => itemCount < t.minItems);

  if (!upcoming) return null;
  return { tier: upcoming, missing: upcoming.minItems - itemCount };
}

export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}
