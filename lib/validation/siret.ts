/**
 * Validation d'un numéro SIRET.
 *
 * Un SIRET fait 14 chiffres et satisfait la clé de Luhn. Vérifier la clé,
 * plutôt que la seule longueur, écarte les saisies fantaisistes du type
 * « 12345678901234 » sans appeler d'API externe — utile pour un contrôle
 * immédiat à la saisie.
 *
 * Ce contrôle prouve la cohérence du numéro, pas l'existence de
 * l'établissement : une vérification auprès de l'API Sirene reste
 * souhaitable pour lutter contre l'usurpation.
 */

export function isValidSiret(input: string): boolean {
  const digits = input.replace(/\s/g, '');
  if (!/^\d{14}$/.test(digits)) return false;

  // Un numéro à un seul chiffre répété satisfait parfois Luhn (00000000000000
  // par exemple) sans désigner aucun établissement : on l'écarte d'emblée.
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // La Poste fait exception : ses SIRET ne satisfont pas Luhn mais la somme
  // de leurs chiffres est un multiple de 5.
  if (digits.startsWith('356000000')) {
    const sum = [...digits].reduce((acc, c) => acc + Number(c), 0);
    return sum % 5 === 0;
  }

  return luhnValid(digits);
}

function luhnValid(digits: string): boolean {
  let sum = 0;

  // Parcours de droite à gauche : un chiffre sur deux est doublé.
  for (let i = 0; i < digits.length; i++) {
    const position = digits.length - 1 - i;
    let value = Number(digits[position]);

    if (i % 2 === 1) {
      value *= 2;
      if (value > 9) value -= 9;
    }

    sum += value;
  }

  return sum % 10 === 0;
}

/** Les 9 premiers chiffres d'un SIRET forment le SIREN de l'entreprise. */
export function sirenFromSiret(siret: string): string {
  return siret.replace(/\s/g, '').slice(0, 9);
}

/** Présentation lisible : 123 456 789 01234. */
export function formatSiret(siret: string): string {
  const d = siret.replace(/\s/g, '');
  if (d.length !== 14) return siret;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

/** Normalisation d'un téléphone français en E.164. */
export function normalizeFrenchPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');

  if (/^\+33[1-9]\d{8}$/.test(digits)) return digits;
  if (/^0[1-9]\d{8}$/.test(digits)) return `+33${digits.slice(1)}`;

  return null;
}
