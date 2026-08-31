import type { Metadata } from 'next';
import { SITE, SOURCE_SITES } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  robots: { index: false },
};

/**
 * Trame de politique de confidentialité.
 *
 * C'est le document le plus sensible du site : l'activité consiste à
 * transmettre des données personnelles de particuliers à des tiers. La base
 * légale, la durée de conservation et l'information des personnes doivent être
 * validées par un juriste — les valeurs ci-dessous sont des hypothèses de
 * travail cohérentes avec ce qui est implémenté.
 */
export default function ConfidentialitePage() {
  return (
    <>
      <h1 className="display-title">Politique de confidentialité</h1>

      <p>
        Cette politique décrit le traitement des données personnelles opéré par Akizit,
        tant pour les <strong>particuliers</strong> qui remplissent un formulaire sur
        l’un de nos sites que pour les <strong>professionnels</strong> inscrits sur la
        plateforme.
      </p>

      <h2>1. Données des particuliers</h2>

      <h3>Origine et finalité</h3>
      <p>
        Les données sont collectées via les formulaires des sites que nous éditons (
        {SOURCE_SITES.map((s) => s.domain).join(', ')}). Elles sont collectées dans le
        but explicite d’être transmises à un ou plusieurs professionnels susceptibles
        de répondre au projet décrit.
      </p>

      <h3>Base légale</h3>
      <p>
        Le traitement repose sur le <strong>consentement</strong> de la personne,
        recueilli au moment de la soumission du formulaire. La date, l’adresse du
        formulaire et la version des conditions acceptées sont conservées à titre de
        preuve.
      </p>

      <h3>Catégories de données</h3>
      <ul>
        <li>Identité et coordonnées : nom, prénom, téléphone, adresse e-mail</li>
        <li>Localisation : adresse, code postal, commune</li>
        <li>
          Données de projet : nature des travaux, surface, délai, statut d’occupation
        </li>
        <li>Preuve de consentement : horodatage, page d’origine</li>
      </ul>

      <h3>Destinataires</h3>
      <p>
        Les coordonnées sont transmises aux professionnels ayant acquis la demande,
        dans la limite de <strong>trois</strong> destinataires pour une demande de
        devis, et d’<strong>un seul</strong> destinataire pour une demande de rappel
        téléphonique. Avant tout achat, aucune donnée identifiante n’est visible :
        seuls le métier, la commune approximative et les caractéristiques du projet
        sont affichés.
      </p>

      <h3>Durée de conservation</h3>
      <p>
        Une demande non vendue est supprimée automatiquement au terme de{' '}
        <strong>[X mois]</strong>. Une demande vendue est conservée pendant la durée
        nécessaire à la preuve de la transaction, puis archivée conformément aux
        obligations comptables.
      </p>

      <h2>2. Données des professionnels</h2>
      <p>
        Nous traitons les données de compte (identité, e-mail, raison sociale, SIRET,
        téléphone) aux fins de gestion du compte, de facturation et de lutte contre la
        fraude. La base légale est l’exécution du contrat et le respect d’obligations
        légales.
      </p>

      <h2>3. Vos droits</h2>
      <p>
        Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation,
        d’opposition et de portabilité, ainsi que du droit de retirer votre consentement
        à tout moment. Pour l’exercer, écrivez à <strong>{SITE.email}</strong> ; nous
        répondons sous un mois.
      </p>
      <p>
        Vous pouvez également introduire une réclamation auprès de la{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          CNIL
        </a>
        .
      </p>

      <h2>4. Sécurité</h2>
      <p>
        Les coordonnées des prospects sont stockées séparément des données affichées
        publiquement, dans un espace inaccessible depuis le navigateur. Leur
        consultation n’est possible qu’après achat, via un accès serveur contrôlé, et
        chaque consultation est journalisée.
      </p>

      <h2>5. Sous-traitants</h2>
      <ul>
        <li>Vercel Inc. — hébergement du site</li>
        <li>Google Ireland Limited — authentification et base de données (UE)</li>
        <li>Stripe Payments Europe Ltd. — traitement des paiements</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        Le site utilise les cookies strictement nécessaires à son fonctionnement
        (session d’authentification, panier). [Compléter en cas d’ajout d’outils de
        mesure d’audience.]
      </p>
    </>
  );
}
