import type { Metadata } from 'next';
import { SITE } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Mentions légales',
  robots: { index: false },
};

/** Trame. Les champs entre crochets sont à compléter avant la mise en ligne. */
export default function MentionsLegalesPage() {
  return (
    <>
      <h1 className="display-title">Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        Le site {SITE.domain} est édité par <strong>[Raison sociale]</strong>,
        [forme juridique] au capital de [montant] €, immatriculée au RCS de [ville]
        sous le numéro <strong>[SIREN]</strong>.
      </p>
      <ul>
        <li>Siège social : [adresse complète]</li>
        <li>Non assujetti à la TVA — franchise en base, art. 293 B du CGI</li>
        <li>Directeur de la publication : [nom]</li>
        <li>Contact : {SITE.email}</li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133,
        Walnut, CA 91789, États-Unis.
      </p>
      <p>
        Les données applicatives sont hébergées par <strong>Google Ireland Limited</strong>{' '}
        (Firebase / Google Cloud), Gordon House, Barrow Street, Dublin 4, Irlande, dans
        la région européenne <code>europe-west1</code>.
      </p>

      <h2>Activité</h2>
      <p>
        Akizit exploite une place de marché de mise en relation entre des particuliers
        ayant exprimé un projet de travaux ou de changement de contrat, et des
        professionnels du secteur concerné. Les demandes proposées à la vente
        proviennent de formulaires renseignés sur les sites édités par la société.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’ensemble des éléments du site — structure, textes, identité visuelle, base de
        données — est protégé par le droit de la propriété intellectuelle. Toute
        reproduction ou extraction non autorisée est interdite.
      </p>

      <h2>Signalement</h2>
      <p>
        Pour signaler un contenu illicite ou exercer vos droits sur vos données
        personnelles, écrivez à {SITE.email}. Voir également notre{' '}
        <a href="/politique-confidentialite">politique de confidentialité</a>.
      </p>
    </>
  );
}
