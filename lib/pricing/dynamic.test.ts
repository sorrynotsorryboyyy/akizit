import { describe, expect, it } from 'vitest';
import {
  EXCLUSIVITY_MULTIPLIERS,
  FRESHNESS_TIERS,
  PRICE_CEILING_CENTS,
  PRICE_FLOOR_CENTS,
  computeDynamicPrice,
  freshnessFor,
} from './dynamic';
import { computeQualityScore, qualityBand } from './quality';
import { VERTICAL_KEYS, VERTICALS } from '../verticals/registry';
import type { MaxBuyers } from '../leads/exclusivity';

const H = 3_600_000;
const NOW = Date.UTC(2026, 7, 31, 12, 0, 0);

const lead = (o: Partial<Parameters<typeof computeDynamicPrice>[0]> = {}) => ({
  basePriceCents: 4500,
  maxBuyers: 3 as MaxBuyers,
  capturedAtMs: NOW - 2 * H,
  qualityScore: 50,
  ...o,
});

describe('computeDynamicPrice', () => {
  it('rend toujours un montant entier en centimes', () => {
    for (const base of [500, 1200, 3333, 4500, 5000]) {
      for (const maxBuyers of [1, 2, 3] as MaxBuyers[]) {
        for (const age of [1, 48, 100, 300, 900]) {
          for (const q of [10, 40, 65, 90]) {
            const p = computeDynamicPrice(
              lead({ basePriceCents: base, maxBuyers, capturedAtMs: NOW - age * H, qualityScore: q }),
              NOW,
            );
            expect(Number.isInteger(p.priceCents)).toBe(true);
            expect(p.priceCents % 100).toBe(0); // arrondi à l'euro
          }
        }
      }
    }
  });

  it('valorise l’exclusivité', () => {
    const exclusif = computeDynamicPrice(lead({ maxBuyers: 1 }), NOW).priceCents;
    const partage3 = computeDynamicPrice(lead({ maxBuyers: 3 }), NOW).priceCents;
    expect(exclusif).toBeGreaterThan(partage3);
    expect(EXCLUSIVITY_MULTIPLIERS[1]).toBeGreaterThan(EXCLUSIVITY_MULTIPLIERS[3]);
  });

  /** Le prix ne doit jamais remonter avec l'âge. */
  it('décroît de façon monotone avec l’ancienneté', () => {
    let precedent = Infinity;
    for (let age = 0; age <= 1200; age += 6) {
      const p = computeDynamicPrice(lead({ capturedAtMs: NOW - age * H }), NOW);
      expect(p.priceCents).toBeLessThanOrEqual(precedent);
      precedent = p.priceCents;
    }
  });

  it('applique les paliers de fraîcheur aux bonnes frontières', () => {
    expect(freshnessFor(23.9).multiplier).toBe(1.0);
    expect(freshnessFor(24.1).multiplier).toBe(0.9);
    expect(freshnessFor(167).multiplier).toBe(0.8);
    expect(freshnessFor(169).multiplier).toBe(0.7);
    expect(freshnessFor(10_000).multiplier).toBe(0.45);
  });

  it('valorise un dossier premium et décote un dossier faible', () => {
    const premium = computeDynamicPrice(lead({ qualityScore: 95 }), NOW).priceCents;
    const faible = computeDynamicPrice(lead({ qualityScore: 10 }), NOW).priceCents;
    expect(premium).toBeGreaterThan(faible);
  });

  it('borne le prix entre plancher et plafond', () => {
    const bas = computeDynamicPrice(
      lead({ basePriceCents: 100, qualityScore: 0, capturedAtMs: NOW - 5000 * H }),
      NOW,
    );
    expect(bas.priceCents).toBeGreaterThanOrEqual(PRICE_FLOOR_CENTS);

    const haut = computeDynamicPrice(
      lead({ basePriceCents: 50_000, maxBuyers: 1, qualityScore: 100 }),
      NOW,
    );
    expect(haut.priceCents).toBeLessThanOrEqual(PRICE_CEILING_CENTS);
    expect(haut.clamped).toBe(true);
  });

  /** Une horloge de site source décalée ne doit pas produire d'âge négatif. */
  it('traite une date de capture future comme un lead neuf', () => {
    const p = computeDynamicPrice(lead({ capturedAtMs: NOW + 48 * H }), NOW);
    expect(p.ageHours).toBe(0);
    expect(p.freshnessMultiplier).toBe(1.0);
  });

  it('n’arrondit qu’une seule fois, à la fin', () => {
    // 3500 × 1.6 × 0.8 × 1.25 = 5600 exactement.
    const p = computeDynamicPrice(
      lead({
        basePriceCents: 3500,
        maxBuyers: 1,
        capturedAtMs: NOW - 100 * H, // palier 0.8
        qualityScore: 90, // premium → 1.25
      }),
      NOW,
    );
    expect(p.priceCents).toBe(5600);
  });

  it('est déterministe', () => {
    expect(computeDynamicPrice(lead(), NOW)).toEqual(computeDynamicPrice(lead(), NOW));
  });

  it('couvre toute la plage d’âge sans trou', () => {
    for (const age of [0, 23, 24, 71, 72, 167, 168, 335, 336, 719, 720, 5000]) {
      expect(freshnessFor(age)).toBeDefined();
      expect(FRESHNESS_TIERS).toContain(freshnessFor(age));
    }
  });
});

describe('computeQualityScore', () => {
  /** Le test qui protège contre l'oubli d'annotation d'une verticale. */
  it('déclare des signaux pour les sept verticales', () => {
    for (const v of VERTICAL_KEYS) {
      const poids = VERTICALS[v].fields.reduce(
        (n, f) => n + (f.quality?.weight ?? 0),
        0,
      );
      expect(poids, `${v} n'a aucun signal de qualité`).toBeGreaterThan(0);
    }
  });

  it('rend un score entier entre 0 et 100 pour chaque verticale', () => {
    for (const v of VERTICAL_KEYS) {
      const r = computeQualityScore(v, {});
      expect(Number.isInteger(r.score)).toBe(true);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it('note au maximum un dossier idéal', () => {
    const r = computeQualityScore('chauffage', {
      proprietaire: true,
      delaiProjet: 'immediat',
      budgetEstime: 'plus_20k',
      typeProjet: 'remplacement',
      surfaceM2: 250,
    });
    expect(r.score).toBe(100);
    expect(r.band).toBe('premium');
  });

  it('décote un dossier vide et signale les champs manquants', () => {
    const r = computeQualityScore('chauffage', {});
    expect(r.score).toBeLessThan(35);
    expect(r.band).toBe('faible');
    expect(r.missingFields).toContain('proprietaire');
  });

  it('ne produit jamais NaN sur une valeur d’énumération inconnue', () => {
    const r = computeQualityScore('chauffage', {
      proprietaire: true,
      delaiProjet: 'valeur_disparue',
      typeProjet: 'remplacement',
      surfaceM2: 100,
    });
    expect(Number.isNaN(r.score)).toBe(false);
    expect(Number.isInteger(r.score)).toBe(true);
  });

  /** Un site source laxiste peut envoyer une chaîne au lieu d'un nombre. */
  it('ne produit jamais NaN sur un type inattendu', () => {
    const r = computeQualityScore('chauffage', {
      proprietaire: 'oui',
      surfaceM2: '120',
      delaiProjet: 'immediat',
    });
    expect(Number.isNaN(r.score)).toBe(false);
    expect(r.missingFields).toContain('proprietaire');
    expect(r.missingFields).toContain('surfaceM2');
  });

  it('fonctionne sur une verticale sans propriétaire ni délai', () => {
    // Résiliation n'a ni `proprietaire` ni `delaiProjet` : la preuve que le
    // moteur ne présuppose aucune clé de champ.
    const r = computeQualityScore('resiliation', {
      echeanceProche: true,
      montantMensuel: 120,
      motif: 'trop_cher',
      ancienneteContratAnnees: 5,
    });
    expect(r.score).toBe(100);
  });

  it('classe les bandes aux bons seuils', () => {
    expect(qualityBand(100)).toBe('premium');
    expect(qualityBand(80)).toBe('premium');
    expect(qualityBand(79)).toBe('bon');
    expect(qualityBand(60)).toBe('bon');
    expect(qualityBand(59)).toBe('standard');
    expect(qualityBand(35)).toBe('standard');
    expect(qualityBand(34)).toBe('faible');
    expect(qualityBand(0)).toBe('faible');
  });

  it('est déterministe', () => {
    const data = { proprietaire: true, delaiProjet: 'immediat', surfaceM2: 120 };
    expect(computeQualityScore('chauffage', data)).toEqual(
      computeQualityScore('chauffage', data),
    );
  });
});
