import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site-config';

/**
 * Directives pour les robots d'indexation.
 *
 * Les espaces privés sont exclus ici EN PLUS de leur `noindex` : un robot qui
 * ignore le sitemap peut suivre un lien, et deux barrières valent mieux qu'une.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/mes-leads',
        '/panier',
        '/checkout',
        '/onboarding',
        '/connexion',
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
