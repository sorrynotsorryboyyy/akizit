import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { ButtonLink } from '@/components/ui/Button';
import { Card, Section } from '@/components/ui/Card';
import { SourceLogo } from '@/components/ui/SourceLogo';
import { SOURCE_SITES } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Comment ça marche',
  description:
    'De la génération du lead sur nos sites à votre premier appel : le parcours ' +
    'complet, et ce que nous garantissons à chaque étape.',
};

const ETAPES = [
  {
    titre: 'Un particulier remplit un formulaire',
    corps:
      'Sur l’un de nos sites, une personne décrit son projet : type de travaux, ' +
      'surface, délai, statut de propriétaire. Elle accepte explicitement d’être ' +
      'recontactée par un professionnel. Ce consentement est horodaté et conservé.',
  },
  {
    titre: 'Nous qualifions la demande',
    corps:
      'Chaque demande est structurée selon les critères de son métier. Les ' +
      'demandes incomplètes ou manifestement non sérieuses ne sont pas mises en ' +
      'vente.',
  },
  {
    titre: 'Le lead apparaît dans la liste',
    corps:
      'Vous voyez sa commune, son métier, son ancienneté et son ' +
      'prix. Les critères du projet sont visibles avant l’achat ; seules les ' +
      'coordonnées restent masquées.',
  },
  {
    titre: 'Vous achetez ce que vous voulez',
    corps:
      'À l’unité, sans abonnement. Les remises par volume s’appliquent ' +
      'automatiquement dès trois leads dans le panier.',
  },
  {
    titre: 'Vous appelez immédiatement',
    corps:
      'Les coordonnées se débloquent dès le paiement confirmé. Vous les ' +
      'retrouvez dans « Mes leads » et pouvez les exporter en CSV.',
  },
] as const;

export default function CommentCaMarchePage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <Section tone="tint" className="!pb-16">
          <p className="eyebrow">Comment ça marche</p>
          <h1 className="display-title mt-3 max-w-3xl">
            Du formulaire rempli à votre premier appel.
          </h1>
          <p className="lede mt-5 max-w-2xl">
            Akizit ne rachète pas de bases de données. Chaque lead provient d’un
            formulaire rempli sur l’un de nos propres sites, par une personne qui a
            accepté d’être recontactée.
          </p>
        </Section>

        <Section tone="surface">
          <ol className="space-y-5">
            {ETAPES.map((etape, i) => (
              <Card as="li" key={etape.titre} className="flex gap-5 p-7">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-lg font-semibold">{etape.titre}</h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">{etape.corps}</p>
                </div>
              </Card>
            ))}
          </ol>
        </Section>

        <Section tone="muted">
          <h2 className="section-title">Nos sites générateurs</h2>
          <p className="lede mt-3 max-w-2xl">
            Nous exploitons nos propres sites d’information et de mise en relation.
            C’est ce qui nous permet de garantir l’origine et la fraîcheur de chaque
            demande.
          </p>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            {SOURCE_SITES.map((site) => (
              <Card key={site.domain} className="p-6">
                <SourceLogo domain={site.domain} label={site.label} height={30} />
                <p className="mt-2 text-sm text-brand">{site.domain}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {site.focus}
                </p>
              </Card>
            ))}
          </div>
        </Section>

        <Section tone="surface">
          <h2 className="section-title">Combien d’artisans reçoivent le même lead ?</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Card className="p-7">
              <p className="text-sm font-semibold text-accent">Demande de rappel</p>
              <p className="mt-2 text-2xl font-bold">1 seul acheteur</p>
              <p className="mt-3 leading-relaxed text-ink-soft">
                Quand la personne demande à être rappelée, elle attend un appel — pas
                trois. Le lead est donc strictement exclusif.
              </p>
            </Card>
            <Card className="p-7">
              <p className="text-sm font-semibold text-brand">Demande de devis</p>
              <p className="mt-2 text-2xl font-bold">3 acheteurs maximum</p>
              <p className="mt-3 leading-relaxed text-ink-soft">
                Comparer plusieurs devis est la démarche normale. Le lead est vendu à
                trois professionnels au plus, et le nombre de places restantes est
                affiché sur sa fiche.
              </p>
            </Card>
          </div>
        </Section>

        <Section tone="inverse">
          <div className="text-center">
            <h2 className="section-title !text-ink-inverse">
              Prêt à voir ce qui est disponible chez vous ?
            </h2>
            <ButtonLink href="/leads" variant="inverse" size="lg" className="mt-7">
              Voir les leads disponibles
            </ButtonLink>
          </div>
        </Section>
      </main>
      <MarketingFooter />
    </>
  );
}
