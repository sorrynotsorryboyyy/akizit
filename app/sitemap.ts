import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site-config';
import { VERTICAL_LIST } from '@/lib/verticals/registry';

/**
 * Plan du site.
 *
 * Uniquement les pages publiques : l'espace acheteur, le panier et
 * l'administration n'ont rien à faire dans un index de moteur de recherche.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE.url}/leads`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE.url}/tarifs`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE.url}/comment-ca-marche`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Une page par métier : ce sont les pages qui visent les requêtes longues.
  for (const v of VERTICAL_LIST) {
    pages.push({
      url: `${SITE.url}/verticales/${v.slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  for (const slug of ['mentions-legales', 'cgv', 'politique-confidentialite']) {
    pages.push({
      url: `${SITE.url}/${slug}`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    });
  }

  return pages;
}
