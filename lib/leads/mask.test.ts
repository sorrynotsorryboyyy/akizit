import { describe, expect, it } from 'vitest';
import { maskEmail, maskPhone, toPublicLead } from './mask';
import type { LeadDoc } from './types';

const NOW = 1_700_000_500_000;

const doc: LeadDoc = {
  id: 'lead-1',
  vertical: 'pac',
  source: 'masolutionchaleur.fr',
  postalCode: '44000',
  city: 'Nantes',
  departement: '44',
  region: 'Pays de la Loire',
  lat: 47.2184,
  lng: -1.5536,
  basePriceCents: 4500,
  qualityScore: 70,
  requestType: 'devis',
  maxBuyers: 3,
  soldCount: 1,
  status: 'available',
  reservedBy: 'pro-secret-uid',
  reservedUntilMs: 1_700_000_000_000,
  data: { typePac: 'air_eau', surfaceM2: 120 },
  summary: 'PAC Air / Eau — 120 m²',
  capturedAtMs: 1_690_000_000_000,
  createdAtMs: 1_690_000_100_000,
};

describe('toPublicLead', () => {
  it('n’expose jamais les champs de réservation', () => {
    const pub = toPublicLead(doc, { now: NOW }) as Record<string, unknown>;
    expect(pub.reservedBy).toBeUndefined();
    expect(pub.reservedUntilMs).toBeUndefined();
  });

  it('ne laisse fuiter aucune donnée de contact, même ajoutée par erreur', () => {
    // Simule un document Firestore pollué : un champ de contact s'est glissé
    // dans la vitrine. La liste blanche doit l'écarter sans qu'on ait pensé
    // à l'exclure nommément.
    const pollué = {
      ...doc,
      telephone: '0612345678',
      email: 'victime@example.com',
      nom: 'Dupont',
    } as unknown as LeadDoc;

    const serialisé = JSON.stringify(toPublicLead(pollué, { now: NOW }));
    expect(serialisé).not.toContain('0612345678');
    expect(serialisé).not.toContain('victime@example.com');
    expect(serialisé).not.toContain('Dupont');
    expect(serialisé).not.toContain('pro-secret-uid');
  });

  it('calcule les places restantes', () => {
    expect(toPublicLead(doc, { now: NOW }).remainingSlots).toBe(2);
    expect(toPublicLead({ ...doc, soldCount: 3 }, { now: NOW }).remainingSlots).toBe(0);
    // Un compteur incohérent ne doit pas produire un négatif affichable.
    expect(toPublicLead({ ...doc, soldCount: 5 }, { now: NOW }).remainingSlots).toBe(0);
  });

  it('marque la possession par le pro courant', () => {
    expect(toPublicLead(doc, { now: NOW }).owned).toBe(false);
    expect(toPublicLead(doc, { ownedByCurrentUser: true, now: NOW }).owned).toBe(true);
  });
});

describe('maskPhone', () => {
  it('conserve juste assez pour crédibiliser sans permettre de recomposer', () => {
    expect(maskPhone('0612345678')).toBe('06 ** ** ** 78');
    expect(maskPhone('+33612345678')).toBe('06 ** ** ** 78');
    expect(maskPhone('06 12 34 56 78')).toBe('06 ** ** ** 78');
  });

  it('reste sûr face à une entrée dégradée', () => {
    expect(maskPhone('')).toBe('•• •• •• •• ••');
    expect(maskPhone('12')).toBe('•• •• •• •• ••');
  });
});

describe('maskEmail', () => {
  it('masque la partie locale', () => {
    expect(maskEmail('jean@gmail.com')).toBe('j***@gmail.com');
    expect(maskEmail('a@b.fr')).toBe('a***@b.fr');
  });

  it('ne renvoie rien d’exploitable sur une entrée invalide', () => {
    expect(maskEmail('pas-un-email')).toBe('•••••');
  });
});
