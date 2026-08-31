/** Constantes du site. Une seule source pour les métadonnées et le contenu. */

export const SITE = {
  name: 'Akizit',
  domain: 'akizit.com',
  url: 'https://akizit.com',
  tagline: 'Des leads travaux exclusifs, achetés à l’unité.',
  description:
    'Akizit vend des demandes de devis qualifiées, générées par nos propres sites. ' +
    'Choisissez vos leads sur la carte, payez à l’unité, sans abonnement ni engagement.',
  email: 'contact@akizit.com',
} as const;

/**
 * Sites générateurs de leads.
 *
 * Ce sont nos propres sites : c'est l'argument différenciant face aux
 * revendeurs qui achètent leur stock à des tiers.
 */
export const SOURCE_SITES = [
  {
    domain: 'masolutionchaleur.fr',
    label: 'Ma Solution Chaleur',
    focus: 'Chauffage, pompes à chaleur, énergies renouvelables',
  },
  {
    domain: 'commentresilier.fr',
    label: 'Comment Résilier',
    focus: 'Résiliation de contrats et changement de fournisseur',
  },
] as const;
