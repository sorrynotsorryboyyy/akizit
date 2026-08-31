import { COMMUNES } from './communes';
import { jitterCoordinates } from './geo';
import { resolveMaxBuyers, type RequestType } from './exclusivity';
import { VERTICALS, VERTICAL_KEYS, type Vertical } from '../verticals/registry';
import { computeQualityScore } from '../pricing/quality';
import type { FieldDef } from '../verticals/field-types';
import type { LeadDoc, LeadStatus } from './types';

/**
 * Jeu de données de démonstration.
 *
 * Sert tant que Firestore n'est pas branché (phase 2). Le générateur tire ses
 * valeurs du registre des verticales plutôt que d'une liste écrite à la main :
 * si un champ est ajouté à une verticale, les leads de démo le portent
 * automatiquement, et une incohérence entre registre et schéma se voit
 * immédiatement.
 *
 * Le tirage est déterministe (graine fixe) : sans cela, chaque rendu serveur
 * produirait des leads différents de ceux du client et provoquerait une erreur
 * d'hydratation.
 */

/** Générateur congruentiel linéaire — reproductible et sans dépendance. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function intBetween(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** Valeur plausible pour un champ, dérivée de sa définition. */
function valueForField(rand: () => number, field: FieldDef): unknown {
  switch (field.kind) {
    case 'enum':
      return pick(rand, field.options).value;
    case 'boolean':
      return rand() > 0.4;
    case 'year':
      return intBetween(rand, 1950, 2020);
    case 'surface':
      // Bornes resserrées vers des valeurs réalistes plutôt que sur toute
      // l'amplitude autorisée, qui produirait des maisons de 900 m².
      return intBetween(rand, Math.max(field.min, 40), Math.min(field.max, 220));
    case 'number':
      return intBetween(rand, field.min, Math.min(field.max, field.min + 120));
  }
}

function buildData(rand: () => number, vertical: Vertical): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of VERTICALS[vertical].fields) {
    // Les champs optionnels sont parfois absents, comme dans la vraie vie.
    if (!field.required && rand() > 0.65) continue;
    data[field.key] = valueForField(rand, field);
  }
  return data;
}

const DAY_MS = 86_400_000;

export function generateDemoLeads(count = 240, seed = 20260831): LeadDoc[] {
  const rand = makeRandom(seed);
  // Date de référence fixe : `Date.now()` rendrait le jeu non déterministe
  // entre le rendu serveur et le rendu client.
  const now = Date.UTC(2026, 7, 31, 12, 0, 0);
  const leads: LeadDoc[] = [];

  for (let i = 0; i < count; i++) {
    const vertical = pick(rand, VERTICAL_KEYS);
    const commune = pick(rand, COMMUNES);
    const def = VERTICALS[vertical];

    const requestType: RequestType = rand() > 0.55 ? 'devis' : 'telephone';
    const maxBuyers = resolveMaxBuyers(requestType);

    // Un lead « devis » peut déjà avoir trouvé un ou deux acheteurs.
    const soldCount =
      maxBuyers > 1 && rand() > 0.7 ? intBetween(rand, 1, maxBuyers - 1) : 0;

    const id = `demo-${String(i + 1).padStart(4, '0')}`;
    const { lat, lng } = jitterCoordinates(commune, id);
    const data = buildData(rand, vertical);

    // Les leads récents dominent, comme dans un flux réel.
    const ageDays = Math.floor(rand() * rand() * 45);
    const capturedAtMs = now - ageDays * DAY_MS - intBetween(rand, 0, DAY_MS);

    // Prix de base de la verticale, avec une variation de ±15 % arrondie à
    // l'euro : c'est la surcharge lead par lead prévue par la grille.
    const variation = 0.85 + rand() * 0.3;
    const priceCents = Math.round((def.defaultPriceCents * variation) / 100) * 100;

    const status: LeadStatus = soldCount >= maxBuyers ? 'sold_out' : 'available';

    leads.push({
      id,
      vertical,
      source: vertical === 'resiliation' ? 'commentresilier.fr' : 'masolutionchaleur.fr',
      postalCode: commune.postalCode,
      city: commune.city,
      departement: commune.departement,
      region: commune.region,
      lat,
      lng,
      basePriceCents: priceCents,
      qualityScore: computeQualityScore(vertical, data).score,
      requestType,
      maxBuyers,
      soldCount,
      status,
      reservedBy: null,
      reservedUntilMs: null,
      data,
      summary: def.buildSummary(data),
      capturedAtMs,
      createdAtMs: capturedAtMs,
    });
  }

  // Tri du plus récent au plus ancien : c'est l'ordre attendu dans la liste.
  return leads.sort((a, b) => b.capturedAtMs - a.capturedAtMs);
}

/** Instance partagée, pour que toutes les pages voient le même stock. */
let cached: LeadDoc[] | null = null;

export function getDemoLeads(): LeadDoc[] {
  cached ??= generateDemoLeads();
  return cached;
}

export function getDemoLeadById(id: string): LeadDoc | undefined {
  return getDemoLeads().find((l) => l.id === id);
}
