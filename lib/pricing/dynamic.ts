import { qualityBand, type QualityBand } from './quality';
import type { MaxBuyers } from '../leads/exclusivity';

/**
 * Prix dynamique d'un lead.
 *
 * Quatre facteurs se multiplient : prix de base du métier, exclusivité,
 * fraîcheur, qualité du dossier.
 *
 * Le prix est RECALCULÉ À CHAQUE LECTURE et n'est jamais stocké : la fraîcheur
 * évolue chaque jour, un prix figé en base vieillirait faux. Il n'est gelé
 * qu'au moment de la réservation, dans `OrderItem.unitPriceCents`.
 */

/** Un lead exclusif vaut plus cher : l'acheteur n'a aucun concurrent. */
export const EXCLUSIVITY_MULTIPLIERS: Record<MaxBuyers, number> = {
  1: 1.6,
  2: 1.25,
  3: 1.0,
};

/**
 * Dépréciation par ancienneté.
 *
 * Triée du plus récent au plus ancien ; le premier palier atteint gagne.
 * Objectif : écouler le stock plutôt que le laisser vieillir invendu.
 */
export const FRESHNESS_TIERS: readonly {
  maxAgeHours: number;
  multiplier: number;
  label: string;
}[] = [
  { maxAgeHours: 24, multiplier: 1.0, label: 'Moins de 24 h' },
  { maxAgeHours: 72, multiplier: 0.9, label: 'Moins de 3 jours' },
  { maxAgeHours: 168, multiplier: 0.8, label: 'Moins d’une semaine' },
  { maxAgeHours: 336, multiplier: 0.7, label: 'Moins de 2 semaines' },
  { maxAgeHours: 720, multiplier: 0.6, label: 'Moins d’un mois' },
  { maxAgeHours: Infinity, multiplier: 0.45, label: 'Plus d’un mois' },
];

export const QUALITY_MULTIPLIERS: Record<QualityBand, number> = {
  premium: 1.25,
  bon: 1.1,
  standard: 1.0,
  faible: 0.8,
};

/** Bornes de sécurité : aucun empilement de facteurs n'en sort. */
export const PRICE_FLOOR_CENTS = 500;
export const PRICE_CEILING_CENTS = 50_000;

export type PriceBreakdown = {
  basePriceCents: number;
  exclusivityMultiplier: number;
  freshnessMultiplier: number;
  freshnessLabel: string;
  qualityMultiplier: number;
  qualityBand: QualityBand;
  ageHours: number;
  /** Prix final : centimes entiers, arrondi à l'euro. */
  priceCents: number;
  /** Vrai si le bornage a mordu — à surveiller côté admin. */
  clamped: boolean;
};

export function freshnessFor(ageHours: number) {
  return (
    FRESHNESS_TIERS.find((t) => ageHours < t.maxAgeHours) ??
    FRESHNESS_TIERS[FRESHNESS_TIERS.length - 1]
  );
}

type PricingInput = {
  basePriceCents: number;
  maxBuyers: MaxBuyers;
  capturedAtMs: number;
  qualityScore: number;
};

export function computeDynamicPrice(
  lead: PricingInput,
  now: number,
): PriceBreakdown {
  // Un site source à l'horloge décalée peut dater un lead dans le futur :
  // borner à 0 évite un âge négatif qui fausserait le choix du palier.
  const ageHours = Math.max(0, (now - lead.capturedAtMs) / 3_600_000);

  const exclusivity = EXCLUSIVITY_MULTIPLIERS[lead.maxBuyers] ?? 1;
  const freshness = freshnessFor(ageHours);
  const band = qualityBand(lead.qualityScore);
  const quality = QUALITY_MULTIPLIERS[band];

  // Une seule multiplication, un seul arrondi, à la toute fin : arrondir
  // après chaque facteur produirait une dérive de plusieurs euros sur un
  // panier de dix leads.
  const raw = lead.basePriceCents * exclusivity * freshness.multiplier * quality;
  const rounded = Math.round(raw / 100) * 100;
  const priceCents = Math.min(
    PRICE_CEILING_CENTS,
    Math.max(PRICE_FLOOR_CENTS, rounded),
  );

  return {
    basePriceCents: lead.basePriceCents,
    exclusivityMultiplier: exclusivity,
    freshnessMultiplier: freshness.multiplier,
    freshnessLabel: freshness.label,
    qualityMultiplier: quality,
    qualityBand: band,
    ageHours,
    priceCents,
    clamped: priceCents !== rounded,
  };
}

/** Écart au prix de base, pour justifier le tarif affiché. */
export function priceDeltaPercent(breakdown: PriceBreakdown): number {
  if (breakdown.basePriceCents === 0) return 0;
  return Math.round(
    ((breakdown.priceCents - breakdown.basePriceCents) / breakdown.basePriceCents) *
      100,
  );
}
