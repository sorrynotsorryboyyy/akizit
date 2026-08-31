import { describe, expect, it } from 'vitest';
import {
  formatSiret,
  isValidSiret,
  normalizeFrenchPhone,
  sirenFromSiret,
} from './siret';

describe('isValidSiret', () => {
  /** SIRET réels et publics, vérifiés contre l'algorithme de Luhn. */
  it('accepte des SIRET réels', () => {
    expect(isValidSiret('55208131766522')).toBe(true);
    expect(isValidSiret('44306184100047')).toBe(true);
    expect(isValidSiret('38012986643097')).toBe(true);
  });

  it('accepte un SIRET saisi avec des espaces', () => {
    expect(isValidSiret('552 081 317 66522')).toBe(true);
  });

  it('rejette une longueur incorrecte', () => {
    expect(isValidSiret('5520813176652')).toBe(false);
    expect(isValidSiret('552081317665220')).toBe(false);
    expect(isValidSiret('')).toBe(false);
  });

  it('rejette la présence de lettres', () => {
    expect(isValidSiret('5520813176652A')).toBe(false);
  });

  it('rejette un numéro dont la clé de Luhn est fausse', () => {
    expect(isValidSiret('12345678901234')).toBe(false);
    expect(isValidSiret('55208131766523')).toBe(false);
  });

  /**
   * 00000000000000 satisfait Luhn : sans cette exclusion, une saisie
   * manifestement fantaisiste passerait la validation.
   */
  it('rejette les numéros à chiffre unique répété', () => {
    expect(isValidSiret('00000000000000')).toBe(false);
    expect(isValidSiret('11111111111111')).toBe(false);
  });

  /**
   * La Poste échappe à Luhn : ses SIRET satisfont la règle « somme des
   * chiffres multiple de 5 ». 35600000009075 a une somme de 35.
   */
  it('accepte les SIRET de La Poste', () => {
    expect(isValidSiret('35600000009075')).toBe(true);
  });

  it('rejette un SIRET La Poste dont la somme n’est pas multiple de 5', () => {
    expect(isValidSiret('35600000000048')).toBe(false);
  });
});

describe('sirenFromSiret', () => {
  it('extrait les neuf premiers chiffres', () => {
    expect(sirenFromSiret('552 081 317 66522')).toBe('552081317');
  });
});

describe('formatSiret', () => {
  it('met en forme un SIRET valide', () => {
    expect(formatSiret('55208131766522')).toBe('552 081 317 66522');
  });

  it('laisse inchangée une entrée de longueur inattendue', () => {
    expect(formatSiret('123')).toBe('123');
  });
});

describe('normalizeFrenchPhone', () => {
  it('convertit les formats courants en E.164', () => {
    expect(normalizeFrenchPhone('06 12 34 56 78')).toBe('+33612345678');
    expect(normalizeFrenchPhone('06.12.34.56.78')).toBe('+33612345678');
    expect(normalizeFrenchPhone('0612345678')).toBe('+33612345678');
    expect(normalizeFrenchPhone('+33612345678')).toBe('+33612345678');
  });

  it('rejette un numéro invalide', () => {
    expect(normalizeFrenchPhone('12345')).toBeNull();
    expect(normalizeFrenchPhone('0012345678')).toBeNull();
    expect(normalizeFrenchPhone('')).toBeNull();
  });
});
