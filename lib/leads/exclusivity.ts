/**
 * Règle d'exclusivité.
 *
 * Le nombre d'acheteurs autorisés découle du type de demande exprimé par le
 * prospect, il n'est pas saisi champ par champ :
 *
 *  - « téléphone » : la personne attend un appel, pas trois. Vendre le même
 *    contact à plusieurs artisans le ferait harceler et détruirait la valeur
 *    perçue du lead — donc exclusivité stricte.
 *  - « devis » : demander plusieurs devis est la démarche normale et attendue,
 *    jusqu'à trois destinataires.
 *
 * La résolution se fait côté serveur, à l'import et à la création. Le
 * navigateur ne décide jamais du nombre d'acheteurs.
 */

export type RequestType = 'devis' | 'telephone';
export type MaxBuyers = 1 | 2 | 3;

export const MAX_BUYERS_BY_REQUEST: Record<RequestType, MaxBuyers> = {
  telephone: 1,
  devis: 3,
};

export function resolveMaxBuyers(
  requestType: RequestType,
  override?: MaxBuyers | null,
): MaxBuyers {
  return override ?? MAX_BUYERS_BY_REQUEST[requestType];
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  devis: 'Demande de devis',
  telephone: 'Demande de rappel',
};

/** Un lead reste vendable tant que le plafond n'est pas atteint. */
export function isStillSellable(soldCount: number, maxBuyers: MaxBuyers): boolean {
  return soldCount < maxBuyers;
}

/**
 * Places restantes, affichées comme argument de rareté (« plus qu'1 place »).
 * Toujours borné à 0 : un compteur incohérent ne doit pas produire un négatif
 * dans l'interface.
 */
export function remainingSlots(soldCount: number, maxBuyers: MaxBuyers): number {
  return Math.max(0, maxBuyers - soldCount);
}
