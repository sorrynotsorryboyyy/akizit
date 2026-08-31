import type { FieldDef, QualitySignal } from '../verticals/field-types';
import { VERTICALS, type Vertical } from '../verticals/registry';

/**
 * Score de qualité d'un dossier.
 *
 * Le moteur ne connaît aucune clé de champ : il lit les signaux déclarés dans
 * le registre. Ajouter une verticale reste donc « un fichier de champs + une
 * entrée », sans jamais toucher à ce fichier.
 *
 * Pas de `server-only` : l'admin doit pouvoir prévisualiser un score avant
 * enregistrement, et le module ne fait aucune entrée-sortie.
 */

export type QualityBand = 'premium' | 'bon' | 'standard' | 'faible';

export type QualityBreakdown = {
  /** Entier de 0 à 100. */
  score: number;
  band: QualityBand;
  /** Champs optionnels non renseignés — utile à l'admin et aux sites sources. */
  missingFields: string[];
};

/** Score neutre servi quand une verticale ne déclare aucun signal. */
const NEUTRAL_SCORE = 50;

export function qualityBand(score: number): QualityBand {
  if (score >= 80) return 'premium';
  if (score >= 60) return 'bon';
  if (score >= 35) return 'standard';
  return 'faible';
}

export const QUALITY_BAND_LABELS: Record<QualityBand, string> = {
  premium: 'Dossier premium',
  bon: 'Bon dossier',
  standard: 'Dossier standard',
  faible: 'Dossier incomplet',
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Contribution d'une valeur, entre 0 et 1.
 *
 * Renvoie `null` quand la valeur est inexploitable (absente, ou d'un type
 * inattendu parce qu'un site source a envoyé « 120 » au lieu de 120).
 * L'appelant applique alors `whenMissing` — jamais NaN, qui se propagerait
 * jusqu'au prix.
 */
function contribution(signal: QualitySignal, value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;

  switch (signal.score.kind) {
    case 'map': {
      if (typeof value !== 'string') return null;
      // Valeur d'énumération inconnue (schéma ayant évolué) : 0, pas null —
      // la donnée est présente, elle ne vaut simplement rien.
      return clamp01(signal.score.values[value] ?? 0);
    }

    case 'bool': {
      if (typeof value !== 'boolean') return null;
      return clamp01(value ? signal.score.whenTrue : signal.score.whenFalse);
    }

    case 'range': {
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
      const { at, to } = signal.score;
      // Bornes égales : au-dessus du seuil vaut tout, en dessous rien.
      if (at === to) return value >= at ? 1 : 0;
      // `at > to` inverse volontairement le sens (valeur basse = meilleure).
      return clamp01((value - at) / (to - at));
    }
  }
}

export function computeQualityScore(
  vertical: Vertical,
  data: Record<string, unknown>,
): QualityBreakdown {
  const fields = VERTICALS[vertical].fields as readonly FieldDef[];

  let earned = 0;
  let total = 0;
  const missingFields: string[] = [];

  for (const field of fields) {
    const signal = field.quality;
    if (!signal) continue;

    total += signal.weight;

    const value = contribution(signal, data[field.key]);
    if (value === null) {
      missingFields.push(field.key);
      earned += signal.weight * clamp01(signal.whenMissing ?? 0);
    } else {
      earned += signal.weight * value;
    }
  }

  // Verticale sans aucun signal : score neutre plutôt que 0, sinon un simple
  // oubli d'annotation décoterait tout le stock du métier.
  if (total === 0) {
    return {
      score: NEUTRAL_SCORE,
      band: qualityBand(NEUTRAL_SCORE),
      missingFields: ['(aucun signal de qualité déclaré pour cette verticale)'],
    };
  }

  // Dénominateur = somme des poids DÉCLARÉS, jamais 100 en dur : ajouter un
  // champ ne doit pas faire chuter tous les scores existants.
  const score = Math.round((100 * earned) / total);

  return { score, band: qualityBand(score), missingFields };
}
