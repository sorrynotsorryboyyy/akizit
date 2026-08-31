/** Formatages partagés. Une seule source pour éviter les écarts d'affichage. */

const EUR = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/** Les montants circulent en centimes entiers dans toute l'application. */
export function formatEuros(cents: number): string {
  return EUR.format(cents / 100);
}

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(ms: number): string {
  return DATE.format(new Date(ms));
}

/**
 * Ancienneté d'un lead, argument commercial central : un lead de moins de
 * 24 h se convertit bien mieux qu'un lead de trois semaines.
 */
export function formatAge(ms: number, now: number = Date.now()): string {
  const hours = Math.floor((now - ms) / 3_600_000);
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 31) return `il y a ${days} jours`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'il y a 1 mois' : `il y a ${months} mois`;
}
