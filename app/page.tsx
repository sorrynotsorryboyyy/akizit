import Link from 'next/link';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, Card, Container, Section } from '@/components/ui/Card';
import { SourceLogo } from '@/components/ui/SourceLogo';
import { SITE, SOURCE_SITES } from '@/lib/site-config';
import { VERTICAL_LIST } from '@/lib/verticals/registry';
import { DISCOUNT_TIERS, formatRate } from '@/lib/pricing/tiers';
import { formatEuros } from '@/lib/format';

const STEPS = [
  {
    title: 'Vous choisissez vos leads',
    body:
      'Filtrez par métier et par département. Chaque lead affiche sa nature, sa ' +
      'localisation et son ancienneté avant tout engagement.',
  },
  {
    title: 'Vous payez à l’unité',
    body:
      'Pas d’abonnement, pas d’engagement, pas de minimum. Vous ne payez que les ' +
      'leads que vous avez choisis, au prix affiché.',
  },
  {
    title: 'Vous appelez dans la minute',
    body:
      'Les coordonnées se débloquent immédiatement après paiement. Vous exportez ' +
      'en CSV pour votre CRM si vous le souhaitez.',
  },
] as const;

const FAQ = [
  {
    q: 'D’où viennent vos leads ?',
    a:
      'De nos propres sites. Nous ne rachetons pas de bases à des tiers : chaque ' +
      'demande provient d’un formulaire rempli par un particulier sur l’un de nos ' +
      'sites, avec son consentement explicite à être recontacté par un professionnel.',
  },
  {
    q: 'Combien d’artisans reçoivent le même lead ?',
    a:
      'Cela dépend de la demande du particulier. S’il a demandé à être rappelé, le ' +
      'lead est exclusif : un seul acheteur, parce qu’une personne qui attend un ' +
      'appel n’en attend pas trois. S’il a demandé des devis, le lead part à trois ' +
      'professionnels au maximum. L’information est affichée sur chaque fiche.',
  },
  {
    q: 'Y a-t-il un engagement ou un abonnement ?',
    a:
      'Aucun. Vous achetez à l’unité, quand vous en avez besoin. Les remises par ' +
      'volume s’appliquent automatiquement dès trois leads dans le panier.',
  },
  {
    q: 'Que se passe-t-il si un lead est injoignable ?',
    a:
      'Signalez-le depuis votre espace dans les 72 heures. Si le numéro est invalide ' +
      'ou si la personne déclare n’avoir jamais fait de demande, le lead vous est ' +
      'recrédité.',
  },
  {
    q: 'Qui peut acheter sur Akizit ?',
    a:
      'Uniquement des professionnels. Un numéro SIRET valide est demandé à ' +
      'l’inscription et vérifié avant tout achat.',
  },
] as const;

export default function HomePage() {
  const priceRange = VERTICAL_LIST.map((v) => v.defaultPriceCents);
  const minPrice = Math.min(...priceRange);

  return (
    <>
      <MarketingHeader />

      <main>
        {/* --- Hero ------------------------------------------------------- */}
        <section className="hero-gradient py-24 sm:py-32">
          <Container>
            <div className="max-w-3xl">
              <div>
                <Badge tone="brand">Réservé aux professionnels</Badge>
                <h1 className="display-title mt-5">
                  Des leads travaux exclusifs,
                  <br />
                  achetés à l’unité.
                </h1>
                <p className="lede mt-5 max-w-xl">
                  Akizit revend les demandes de devis générées par ses propres sites.
                  Vous choisissez vos leads dans la liste, vous payez ce que vous
                  prenez, vous appelez dans la foulée. Sans abonnement.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/leads" size="lg">
                    Voir les leads disponibles
                  </ButtonLink>
                  <ButtonLink href="/comment-ca-marche" variant="secondary" size="lg">
                    Comment ça marche
                  </ButtonLink>
                </div>

                <p className="mt-5 text-sm text-ink-soft">
                  À partir de <strong>{formatEuros(minPrice)}</strong> le lead · Aucun
                  engagement · Remises dès 3 leads
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* --- Sites sources ---------------------------------------------- */}
        <Section tone="surface" className="!py-14">
          <p className="text-center text-sm font-medium text-ink-faint">
            Nos leads proviennent exclusivement de nos propres sites
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {SOURCE_SITES.map((s) => (
              <div key={s.domain} className="text-center">
                <SourceLogo domain={s.domain} label={s.label} height={30} />
                <p className="mt-1.5 text-xs text-ink-faint">{s.focus}</p>
              </div>
            ))}
            <p className="text-sm text-ink-faint">et d’autres à venir…</p>
          </div>
        </Section>

        {/* --- Comment ça marche ------------------------------------------ */}
        <Section tone="muted">
          <p className="eyebrow">Comment ça marche</p>
          <h2 className="section-title mt-3 max-w-2xl">
            Du choix du lead au premier appel, en trois étapes.
          </h2>

          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Card as="li" key={step.title} className="p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-base font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </Card>
            ))}
          </ol>
        </Section>

        {/* --- Verticales -------------------------------------------------- */}
        <Section tone="surface">
          <p className="eyebrow">Nos verticales</p>
          <h2 className="section-title mt-3 max-w-2xl">
            Sept métiers couverts, chacun avec ses propres critères de
            qualification.
          </h2>
          <p className="lede mt-4 max-w-2xl">
            Un lead PAC n’a rien à voir avec un lead résiliation. Chaque fiche porte
            les informations qui comptent pour votre métier : surface, énergie
            actuelle, délai, statut de propriétaire.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICAL_LIST.map((v) => (
              <Card key={v.key} className="flex flex-col p-6">
                <span
                  className="h-2.5 w-10 rounded-full"
                  style={{ backgroundColor: v.color }}
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-lg font-semibold">{v.label}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                  {v.description}
                </p>
                <p className="mt-5 text-sm font-semibold text-brand">
                  dès {formatEuros(v.defaultPriceCents)} le lead
                </p>
              </Card>
            ))}
          </div>
        </Section>

        {/* --- Remises ----------------------------------------------------- */}
        <Section tone="tint">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Tarifs dégressifs</p>
              <h2 className="section-title mt-3">
                Plus vous en prenez, moins vous payez.
              </h2>
              <p className="lede mt-4">
                Les remises s’appliquent automatiquement selon le nombre de leads dans
                votre panier. Aucun code, aucune négociation, aucun engagement de
                volume.
              </p>
              <ButtonLink href="/tarifs" variant="secondary" className="mt-7">
                Voir la grille complète
              </ButtonLink>
            </div>

            <div className="space-y-3">
              {[...DISCOUNT_TIERS]
                .sort((a, b) => a.minItems - b.minItems)
                .map((tier) => (
                  <Card
                    key={tier.minItems}
                    className="flex items-center justify-between px-6 py-5"
                  >
                    <span className="font-semibold">
                      À partir de {tier.minItems} leads
                    </span>
                    <span className="text-xl font-bold text-brand">
                      −{formatRate(tier.rate)}
                    </span>
                  </Card>
                ))}
            </div>
          </div>
        </Section>

        {/* --- FAQ --------------------------------------------------------- */}
        <Section tone="surface">
          <p className="eyebrow">Questions fréquentes</p>
          <h2 className="section-title mt-3">Ce que les professionnels demandent.</h2>

          <div className="mt-10 max-w-3xl divide-y divide-line border-t border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold marker:content-['']">
                  {item.q}
                  <span
                    className="shrink-0 text-xl text-brand transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-soft">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Section>

        {/* --- CTA final --------------------------------------------------- */}
        <Section tone="inverse">
          <div className="text-center">
            <h2 className="section-title !text-ink-inverse">
              Vos prochains chantiers vous attendent.
            </h2>
            <p className="mt-4 text-lg text-ink-inverse/75">
              Créez votre compte professionnel en une minute et consultez les leads
              disponibles près de chez vous.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/connexion" variant="inverse" size="lg">
                Créer mon compte pro
              </ButtonLink>
              <Link
                href="/leads"
                className="inline-flex h-13 items-center px-6 font-semibold text-ink-inverse/90 underline-offset-4 hover:underline"
              >
                Parcourir les leads
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-inverse/60">
              SIRET requis · {SITE.domain}
            </p>
          </div>
        </Section>
      </main>

      <MarketingFooter />
    </>
  );
}
