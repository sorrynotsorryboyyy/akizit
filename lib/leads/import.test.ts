import { describe, expect, it } from 'vitest';
import { normalizePhone, parseLeadImport } from './import';

const NOW = Date.UTC(2026, 7, 31, 12, 0, 0);

/** Ligne d'import valide, servant de base aux variations des tests. */
function row(overrides: Record<string, unknown> = {}) {
  return {
    vertical: 'pac',
    source: 'masolutionchaleur.fr',
    codePostal: '44000',
    ville: 'Nantes',
    requestType: 'devis',
    capturedAt: '2026-08-30T09:00:00.000Z',
    data: {
      typePac: 'air_eau',
      surfaceM2: 120,
      chauffageActuel: 'fioul',
      proprietaire: true,
      delaiProjet: 'moins_3_mois',
    },
    contact: {
      prenom: 'Jean',
      nom: 'Dupont',
      telephone: '06 12 34 56 78',
      email: 'Jean.Dupont@Example.com',
      codePostalExact: '44100',
      villeExacte: 'Nantes',
      consentement: {
        collecteLe: '2026-08-30T09:00:00.000Z',
        urlSource: 'https://masolutionchaleur.fr/devis-pac',
      },
    },
    ...overrides,
  };
}

describe('parseLeadImport', () => {
  it('importe une ligne valide', () => {
    const r = parseLeadImport([row()], { now: NOW });
    expect(r.errors).toEqual([]);
    expect(r.valid).toHaveLength(1);
  });

  /** La garantie centrale : la vitrine ne contient aucune donnée de contact. */
  it('sépare strictement la vitrine des coordonnées', () => {
    const { valid } = parseLeadImport([row()], { now: NOW });
    const { lead, contact } = valid[0];

    const serialized = JSON.stringify(lead);
    expect(serialized).not.toContain('Dupont');
    expect(serialized).not.toContain('Jean');
    expect(serialized).not.toContain('612345678');
    expect(serialized).not.toContain('example.com');
    expect(serialized).not.toContain('44100'); // code postal exact

    // À l'inverse, le document privé porte bien tout cela.
    expect(contact.nom).toBe('Dupont');
    expect(contact.telephone).toBe('+33612345678');
    expect(contact.codePostalExact).toBe('44100');
  });

  it('ne publie pas les coordonnées exactes du prospect', () => {
    const { valid } = parseLeadImport([row()], { now: NOW });
    const { lead } = valid[0];
    // Le point publié est un centroïde de commune bruité : il doit rester
    // proche de Nantes sans jamais coïncider avec un point exact.
    expect(lead.lat).toBeGreaterThan(47.1);
    expect(lead.lat).toBeLessThan(47.35);
    expect(lead.lng).toBeGreaterThan(-1.7);
    expect(lead.lng).toBeLessThan(-1.4);
  });

  it('déduit maxBuyers du type de demande', () => {
    const devis = parseLeadImport([row({ requestType: 'devis' })], { now: NOW });
    expect(devis.valid[0].lead.maxBuyers).toBe(3);

    const tel = parseLeadImport([row({ requestType: 'telephone' })], { now: NOW });
    expect(tel.valid[0].lead.maxBuyers).toBe(1);
  });

  it('accepte une surcharge explicite de maxBuyers', () => {
    const r = parseLeadImport([row({ requestType: 'devis', maxBuyers: 2 })], {
      now: NOW,
    });
    expect(r.valid[0].lead.maxBuyers).toBe(2);
  });

  it('applique le prix de base de la verticale par défaut', () => {
    const r = parseLeadImport([row()], { now: NOW });
    expect(r.valid[0].lead.priceCents).toBe(4500);

    const custom = parseLeadImport([row({ priceCents: 6000 })], { now: NOW });
    expect(custom.valid[0].lead.priceCents).toBe(6000);
  });

  it('génère le résumé depuis les données typées', () => {
    const r = parseLeadImport([row()], { now: NOW });
    expect(r.valid[0].lead.summary).toBe('PAC Air / Eau — 120 m², remplace Fioul');
  });

  /** Un lot partiellement invalide ne doit pas tout faire échouer. */
  it('importe les lignes valides et rapporte les autres', () => {
    const r = parseLeadImport(
      [row(), row({ codePostal: 'ABC' }), row({ vertical: 'inconnu' }), row()],
      { now: NOW },
    );
    expect(r.valid).toHaveLength(2);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors.map((e) => e.index).sort()).toEqual(
      expect.arrayContaining([1, 2]),
    );
  });

  it('rejette un champ de contact glissé dans les données métier', () => {
    const r = parseLeadImport(
      [row({ data: { ...row().data, telephone: '0612345678' } })],
      { now: NOW },
    );
    expect(r.valid).toHaveLength(0);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('rejette un e-mail ou un téléphone invalide', () => {
    const badMail = parseLeadImport(
      [row({ contact: { ...row().contact, email: 'pas-un-email' } })],
      { now: NOW },
    );
    expect(badMail.valid).toHaveLength(0);

    const badPhone = parseLeadImport(
      [row({ contact: { ...row().contact, telephone: '12' } })],
      { now: NOW },
    );
    expect(badPhone.valid).toHaveLength(0);
  });

  it('exige une preuve de consentement', () => {
    const contact = { ...row().contact } as Record<string, unknown>;
    delete contact.consentement;
    const r = parseLeadImport([row({ contact })], { now: NOW });
    expect(r.valid).toHaveLength(0);
    expect(r.errors.some((e) => e.path.includes('consentement'))).toBe(true);
  });

  it('fixe une date de purge pour la rétention RGPD', () => {
    const r = parseLeadImport([row()], { now: NOW });
    expect(r.valid[0].contact.purgeAfterMs).toBeGreaterThan(NOW);
  });

  it('refuse une entrée qui n’est pas un tableau', () => {
    const r = parseLeadImport({ leads: [] }, { now: NOW });
    expect(r.valid).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
  });

  it('normalise l’e-mail en minuscules', () => {
    const r = parseLeadImport([row()], { now: NOW });
    expect(r.valid[0].contact.email).toBe('jean.dupont@example.com');
  });
});

describe('normalizePhone', () => {
  it('convertit en format international', () => {
    expect(normalizePhone('06 12 34 56 78')).toBe('+33612345678');
    expect(normalizePhone('06.12.34.56.78')).toBe('+33612345678');
    expect(normalizePhone('+33612345678')).toBe('+33612345678');
  });
});
