import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { ButtonLink } from '@/components/ui/Button';
import { Card, Section } from '@/components/ui/Card';
import { VERTICAL_LIST, verticalBySlug } from '@/lib/verticals/registry';
import { getDemoLeads } from '@/lib/leads/demo-data';
import { formatEuros } from '@/lib/format';

/** Une page par verticale : chacune vise ses propres requêtes de recherche. */
export function generateStaticParams() {
  return VERTICAL_LIST.map((v) => ({ slug: v.slug }));
}

// Next 16 : `params` est une Promise, l'accès synchrone a été supprimé.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vertical = verticalBySlug(slug);
  if (!vertical) return {};

  return {
    title: `Leads ${vertical.label}`,
    description: `${vertical.description} Achetez des demandes qualifiées à l’unité, dès ${formatEuros(vertical.defaultPriceCents)}.`,
  };
}

export default async function VerticalePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vertical = verticalBySlug(slug);
  if (!vertical) notFound();

  const leads = getDemoLeads().filter(
    (l) => l.vertical === vertical.key && l.status === 'available',
  );

  // Départements les mieux fournis : information concrète et utile au visiteur.
  const parDepartement = new Map<string, { city: string; count: number }>();
  for (const lead of leads) {
    const entry = parDepartement.get(lead.departement);
    if (entry) entry.count += 1;
    else parDepartement.set(lead.departement, { city: lead.city, count: 1 });
  }
  const top = [...parDepartement.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);

  const previewFields = vertical.fields.filter((f) => f.showInPreview);

  return (
    <>
      <MarketingHeader />
      <main>
        <Section tone="tint" className="!pb-16">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-12 rounded-full"
              style={{ backgroundColor: vertical.color }}
              aria-hidden="true"
            />
            <p className="eyebrow !text-ink-soft">Verticale</p>
          </div>

          <h1 className="display-title mt-4 max-w-3xl">
            Leads {vertical.label.toLowerCase()} qualifiés, achetés à l’unité.
          </h1>
          <p className="lede mt-5 max-w-2xl">{vertical.description}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/leads" size="lg">
              Voir les {leads.length} leads disponibles
            </ButtonLink>
            <p className="text-sm text-ink-soft">
              À partir de{' '}
              <strong>{formatEuros(vertical.defaultPriceCents)}</strong> le lead
            </p>
          </div>
        </Section>

        <Section tone="surface">
          <h2 className="section-title">Ce que vous savez avant d’acheter</h2>
          <p className="lede mt-3 max-w-2xl">
            Chaque lead {vertical.label.toLowerCase()} porte les critères qui comptent
            pour votre métier. Vous les consultez librement ; seules les coordonnées
            du prospect sont masquées jusqu’au paiement.
          </p>

          <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewFields.map((field) => (
              <Card as="li" key={field.key} className="p-5">
                <p className="font-semibold">{field.label}</p>
                {field.kind === 'enum' && (
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {field.options
                      .slice(0, 4)
                      .map((o) => o.label)
                      .join(' · ')}
                    {field.options.length > 4 && ' …'}
                  </p>
                )}
                {field.help && (
                  <p className="mt-2 text-xs text-ink-faint">{field.help}</p>
                )}
              </Card>
            ))}
          </ul>
        </Section>

        {top.length > 0 && (
          <Section tone="muted">
            <h2 className="section-title">Où sont les leads en ce moment</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {top.map(([dept, info]) => (
                <Card key={dept} className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-semibold">{info.city}</p>
                    <p className="text-sm text-ink-faint">Département {dept}</p>
                  </div>
                  <span className="text-xl font-bold text-brand">{info.count}</span>
                </Card>
              ))}
            </div>
          </Section>
        )}

        <Section tone="surface">
          <h2 className="section-title">Autres métiers couverts</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {VERTICAL_LIST.filter((v) => v.key !== vertical.key).map((v) => (
              <ButtonLink
                key={v.key}
                href={`/verticales/${v.slug}`}
                variant="secondary"
                size="sm"
              >
                {v.label}
              </ButtonLink>
            ))}
          </div>
        </Section>
      </main>
      <MarketingFooter />
    </>
  );
}
