import { describe, expect, it } from 'vitest';
import { validateVerticalData, verticalDataSchemas } from './schemas';
import { VERTICAL_KEYS, VERTICALS } from './registry';

describe('schémas générés depuis le registre', () => {
  it('couvre les sept verticales', () => {
    expect(Object.keys(verticalDataSchemas).sort()).toEqual([...VERTICAL_KEYS].sort());
  });

  it('accepte des données valides', () => {
    const r = validateVerticalData('pac', {
      typePac: 'air_eau',
      surfaceM2: 120,
      chauffageActuel: 'fioul',
      proprietaire: true,
      delaiProjet: 'moins_3_mois',
    });
    expect(r.success).toBe(true);
  });

  it('rejette une valeur d’énumération inconnue', () => {
    const r = validateVerticalData('pac', {
      typePac: 'nucleaire',
      surfaceM2: 120,
      chauffageActuel: 'fioul',
      proprietaire: true,
      delaiProjet: 'moins_3_mois',
    });
    expect(r.success).toBe(false);
  });

  it('rejette un champ requis manquant', () => {
    const r = validateVerticalData('pac', { typePac: 'air_eau' });
    expect(r.success).toBe(false);
  });

  it('rejette une surface hors bornes', () => {
    const base = {
      typePac: 'air_eau',
      chauffageActuel: 'fioul',
      proprietaire: true,
      delaiProjet: 'immediat',
    };
    expect(validateVerticalData('pac', { ...base, surfaceM2: 5 }).success).toBe(false);
    expect(validateVerticalData('pac', { ...base, surfaceM2: 99999 }).success).toBe(false);
  });

  /**
   * Le test qui compte : `.strict()` doit empêcher qu'un champ de contact
   * glissé dans un import se retrouve publié dans la vitrine.
   */
  it('rejette tout champ non déclaré (protection anti-fuite)', () => {
    const r = validateVerticalData('pac', {
      typePac: 'air_eau',
      surfaceM2: 120,
      chauffageActuel: 'fioul',
      proprietaire: true,
      delaiProjet: 'immediat',
      telephone: '0612345678',
    });
    expect(r.success).toBe(false);
  });

  it('accepte l’omission des champs optionnels', () => {
    const r = validateVerticalData('plomberie', {
      typeIntervention: 'fuite',
      urgence: true,
      typeLogement: 'maison',
      proprietaire: true,
      delaiProjet: 'immediat',
    });
    expect(r.success).toBe(true);
  });
});

describe('registre', () => {
  it('n’expose aucun champ de saisie libre', () => {
    // Un champ texte finirait par contenir un numéro ou un nom, publié avant
    // achat. La contrainte se vérifie ici plutôt qu'à la relecture.
    for (const v of VERTICAL_KEYS) {
      for (const f of VERTICALS[v].fields) {
        expect(['enum', 'number', 'boolean', 'year', 'surface']).toContain(f.kind);
      }
    }
  });

  it('génère un résumé lisible sans donnée identifiante', () => {
    const summary = VERTICALS.pac.buildSummary({
      typePac: 'air_eau',
      surfaceM2: 120,
      chauffageActuel: 'fioul',
    });
    expect(summary).toBe('PAC Air / Eau — 120 m², remplace Fioul');
  });

  it('donne une couleur et un prix de base à chaque verticale', () => {
    for (const v of VERTICAL_KEYS) {
      expect(VERTICALS[v].color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(VERTICALS[v].defaultPriceCents).toBeGreaterThan(0);
    }
  });

  it('attribue un slug unique à chaque verticale', () => {
    const slugs = VERTICAL_KEYS.map((v) => VERTICALS[v].slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
