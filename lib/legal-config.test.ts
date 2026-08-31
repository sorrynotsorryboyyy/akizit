import { describe, expect, it } from 'vitest';
import {
  LEGAL,
  TO_FILL,
  adresseComplete,
  champsManquants,
  legalComplet,
  siren,
} from './legal-config';

/**
 * Complétude des mentions légales.
 *
 * Le test « aucun champ à compléter » est volontairement en `skip` : il doit
 * être activé avant l'ouverture au public. Tant qu'il dort, les autres tests
 * garantissent au moins que le mécanisme de détection fonctionne.
 */
describe('legal-config', () => {
  it('détecte les champs encore à renseigner', () => {
    const manquants = champsManquants();
    // Cohérence : legalComplet() doit refléter champsManquants().
    expect(legalComplet()).toBe(manquants.length === 0);
  });

  it('n’affiche jamais de numéro de TVA en franchise en base', () => {
    // Afficher un numéro fictif serait une fausse déclaration ; l'absence de
    // numéro est la mention correcte.
    expect(LEGAL.tvaIntracom).toBeNull();
  });

  it('déduit le SIREN du SIRET une fois celui-ci renseigné', () => {
    const s = siren();
    if (LEGAL.siret.includes(TO_FILL)) {
      expect(s).toBe(TO_FILL);
    } else {
      expect(s).toMatch(/^\d{9}$/);
    }
  });

  it('n’expose aucun fragment « À COMPLÉTER » dans l’adresse assemblée', () => {
    expect(adresseComplete()).not.toContain(TO_FILL);
  });

  it('renseigne les hébergeurs, obligatoires dans les mentions légales', () => {
    expect(LEGAL.hebergeur.nom.length).toBeGreaterThan(0);
    expect(LEGAL.hebergeurDonnees.nom.length).toBeGreaterThan(0);
  });

  it('fixe une durée de conservation des leads (RGPD)', () => {
    expect(LEGAL.retentionLeadsMois).toBeGreaterThan(0);
  });

  /**
   * À RÉACTIVER avant la mise en ligne publique : retirer le `.skip`.
   * Il échouera tant que les informations d'entreprise ne sont pas saisies.
   */
  it.skip('est complet — à activer avant ouverture au public', () => {
    expect(champsManquants()).toEqual([]);
  });
});
