import { describe, expect, it } from 'vitest';
import { parseLeadImport } from './import';

/**
 * Vérification de bout en bout sur un lot réaliste et hétérogène : c'est le
 * cas d'usage réel de l'admin, où un export de site source contient toujours
 * quelques lignes douteuses.
 */
const base = (o: Record<string, unknown> = {}) => ({
  vertical: 'toiture',
  source: 'masolutionchaleur.fr',
  codePostal: '69003',
  ville: 'Lyon',
  requestType: 'telephone',
  capturedAt: '2026-08-30T09:00:00.000Z',
  data: {
    typeIntervention: 'fuite',
    typeCouverture: 'tuiles',
    surfaceM2: 90,
    urgence: true,
    proprietaire: true,
    delaiProjet: 'immediat',
  },
  contact: {
    prenom: 'Marie',
    nom: 'Martin',
    telephone: '0698765432',
    email: 'marie@example.com',
    codePostalExact: '69003',
    villeExacte: 'Lyon',
    consentement: {
      collecteLe: '2026-08-30T09:00:00.000Z',
      urlSource: 'https://masolutionchaleur.fr/toiture',
    },
  },
  ...o,
});

describe('import d’un lot hétérogène', () => {
  const lot = [
    base(),
    base({ data: { ...base().data, telephone: '0611223344' } }), // fuite tentée
    base({ codePostal: 'XYZ' }), // code postal invalide
    base({ vertical: 'peinture' }), // data incompatible avec la verticale
    base({ requestType: 'devis' }),
  ];

  const result = parseLeadImport(lot, { now: Date.UTC(2026, 7, 31) });

  it('n’accepte que les lignes conformes', () => {
    expect(result.valid).toHaveLength(2);
  });

  it('signale précisément les lignes fautives', () => {
    const fautives = [...new Set(result.errors.map((e) => e.index))].sort();
    expect(fautives).toEqual([1, 2, 3]);
  });

  it('applique la règle d’exclusivité selon le type de demande', () => {
    const parType = Object.fromEntries(
      result.valid.map((v) => [v.lead.requestType, v.lead.maxBuyers]),
    );
    expect(parType).toEqual({ telephone: 1, devis: 3 });
  });

  it('ne laisse aucune coordonnée dans les documents de vitrine', () => {
    const vitrine = JSON.stringify(result.valid.map((v) => v.lead));
    expect(vitrine).not.toMatch(/Marie|Martin|0698765432|example\.com/);
  });

  it('place bien les coordonnées normalisées dans les documents privés', () => {
    for (const { contact } of result.valid) {
      expect(contact.telephone).toBe('+33698765432');
      expect(contact.nom).toBe('Martin');
    }
  });
});
