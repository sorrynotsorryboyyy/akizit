import type { Metadata } from 'next';
import { SITE } from '@/lib/site-config';
import { DISCOUNT_TIERS, formatRate } from '@/lib/pricing/tiers';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  robots: { index: false },
};

/** Trame de CGV. Les remises sont lues depuis le code, jamais recopiées. */
export default function CgvPage() {
  const tiers = [...DISCOUNT_TIERS].sort((a, b) => a.minItems - b.minItems);

  return (
    <>
      <h1 className="display-title">Conditions générales de vente</h1>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent la vente, par [Raison sociale] (« Akizit »),
        de demandes de mise en relation (« leads ») à des clients professionnels
        (« l’Acheteur »). Toute commande implique leur acceptation sans réserve.
      </p>

      <h2>2. Accès à la plateforme</h2>
      <p>
        L’accès est réservé aux professionnels. L’Acheteur garantit l’exactitude de son
        numéro SIRET et de sa raison sociale. Akizit peut suspendre tout compte dont les
        informations se révéleraient inexactes.
      </p>

      <h2>3. Nature de la prestation</h2>
      <p>
        Akizit vend l’accès aux coordonnées d’un particulier ayant exprimé un projet.
        Akizit est tenue d’une <strong>obligation de moyens</strong> : elle ne garantit
        ni la signature d’un contrat, ni la réalisation de travaux, ni le budget final.
      </p>

      <h2>4. Exclusivité</h2>
      <p>
        Le nombre maximal d’acheteurs est indiqué sur chaque fiche avant l’achat :
      </p>
      <ul>
        <li>
          <strong>Demande de rappel téléphonique</strong> : un seul acheteur, le lead
          est exclusif.
        </li>
        <li>
          <strong>Demande de devis</strong> : trois acheteurs au maximum.
        </li>
      </ul>

      <h2>5. Prix et remises</h2>
      <p>
        Les prix sont indiqués en euros nets sur chaque fiche. Akizit relève de la
        franchise en base de TVA : TVA non applicable, art. 293 B du CGI. Les remises par
        volume s’appliquent automatiquement selon le nombre de leads commandés :
      </p>
      <ul>
        {tiers.map((t) => (
          <li key={t.minItems}>
            à partir de {t.minItems} leads : −{formatRate(t.rate)}
          </li>
        ))}
      </ul>
      <p>
        Le montant facturé est celui calculé par Akizit au moment de la validation de la
        commande.
      </p>

      <h2>6. Commande et paiement</h2>
      <p>
        Les leads sélectionnés sont réservés pendant <strong>quinze minutes</strong> le
        temps du paiement. Passé ce délai sans règlement, ils sont automatiquement
        remis en vente. Le paiement s’effectue en ligne ; les coordonnées sont
        débloquées dès sa confirmation.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        L’Acheteur agissant à des fins professionnelles, le droit de rétractation prévu
        pour les consommateurs ne s’applique pas. La prestation étant pleinement
        exécutée dès le déblocage des coordonnées, la vente est ferme.
      </p>

      <h2>8. Garantie « lead injoignable »</h2>
      <p>
        Par dérogation à l’article 7, un lead est recrédité s’il est signalé dans les{' '}
        <strong>72 heures</strong> suivant l’achat et si l’un des cas suivants est
        établi :
      </p>
      <ul>
        <li>numéro de téléphone invalide ou inattribué ;</li>
        <li>
          la personne déclare n’avoir jamais soumis de demande ;
        </li>
        <li>coordonnées manifestement erronées.</li>
      </ul>
      <p>
        L’absence de réponse après plusieurs tentatives, un changement d’avis ou un
        budget jugé insuffisant ne constituent pas des motifs de recrédit.
      </p>

      <h2>9. Obligations de l’Acheteur</h2>
      <p>
        L’Acheteur s’engage à n’utiliser les coordonnées que pour répondre au projet
        décrit, à ne pas les céder à un tiers, à ne pas les intégrer à une base de
        prospection et à respecter la réglementation applicable au démarchage
        téléphonique ainsi que le RGPD, dont il est responsable de traitement pour les
        données qui lui sont transmises.
      </p>

      <h2>10. Responsabilité</h2>
      <p>
        La responsabilité d’Akizit est limitée au montant des sommes effectivement
        versées par l’Acheteur au titre du lead concerné.
      </p>

      <h2>11. Droit applicable</h2>
      <p>
        Les présentes sont soumises au droit français. À défaut de résolution amiable,
        le litige relève des tribunaux compétents de [ville].
      </p>

      <p>Contact : {SITE.email}</p>
    </>
  );
}
