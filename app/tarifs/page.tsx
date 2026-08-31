import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { ButtonLink } from '@/components/ui/Button';
import { Card, Container, Section } from '@/components/ui/Card';
import { VERTICAL_LIST } from '@/lib/verticals/registry';
import { DISCOUNT_TIERS, formatRate } from '@/lib/pricing/tiers';
import { formatEuros } from '@/lib/format';
import { computeTotals } from '@/lib/pricing/totals';

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'Prix des leads par métier et remises par volume. Sans abonnement ni engagement.',
};

export default function TarifsPage() {
  // Exemple chiffré construit avec le vrai calcul plutôt qu'écrit en dur :
  // les chiffres affichés ne peuvent pas diverger de ceux du panier.
  const exemple = computeTotals(
    Array.from({ length: 5 }, (_, i) => ({ leadId: `x${i}`, unitPriceCents: 4500 })),
  );

  return (
    <>
      <MarketingHeader />
      <main>
        <Section tone="tint" className="!pb-16">
          <p className="eyebrow">Tarifs</p>
          <h1 className="display-title mt-3 max-w-3xl">
            Un prix par lead, affiché avant l’achat.
          </h1>
          <p className="lede mt-5 max-w-2xl">
            Pas d’abonnement, pas d’engagement de volume, pas de frais de dossier.
            Vous payez uniquement les leads que vous choisissez, au prix indiqué sur
            leur fiche.
          </p>
        </Section>

        <Section tone="surface">
          <h2 className="section-title">Prix indicatifs par métier</h2>
          <p className="lede mt-3 max-w-2xl">
            Le prix varie selon la qualification de la demande : un projet immédiat
            avec budget défini vaut plus qu’une demande exploratoire. Le tarif exact
            est toujours affiché sur la fiche du lead.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-lg border-collapse text-left">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="pb-3 text-sm font-semibold">Métier</th>
                  <th className="pb-3 text-sm font-semibold">Prix de base</th>
                  <th className="pb-3 text-sm font-semibold">Exclusivité</th>
                </tr>
              </thead>
              <tbody>
                {VERTICAL_LIST.map((v) => (
                  <tr key={v.key} className="border-b border-line">
                    <td className="py-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: v.color }}
                          aria-hidden="true"
                        />
                        <span className="font-medium">{v.label}</span>
                      </div>
                    </td>
                    <td className="py-4 font-semibold">
                      {formatEuros(v.defaultPriceCents)}
                    </td>
                    <td className="py-4 text-sm text-ink-soft">
                      1 à 3 acheteurs selon la demande
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-5 text-sm text-ink-faint">
            Prix hors taxes. TVA applicable en sus selon la réglementation en vigueur.
          </p>
        </Section>

        <Section tone="muted">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <h2 className="section-title">Remises par volume</h2>
              <p className="lede mt-3">
                Elles s’appliquent automatiquement selon le nombre de leads présents
                dans votre panier. Aucun code à saisir.
              </p>

              <div className="mt-7 space-y-3">
                {[...DISCOUNT_TIERS]
                  .sort((a, b) => a.minItems - b.minItems)
                  .map((t) => (
                    <Card
                      key={t.minItems}
                      className="flex items-center justify-between px-6 py-5"
                    >
                      <span className="font-semibold">
                        À partir de {t.minItems} leads
                      </span>
                      <span className="text-xl font-bold text-brand">
                        −{formatRate(t.rate)}
                      </span>
                    </Card>
                  ))}
              </div>
            </div>

            <Card className="p-7">
              <p className="text-sm font-semibold text-ink-soft">Exemple</p>
              <p className="mt-2 text-lg font-semibold">
                5 leads pompe à chaleur à {formatEuros(4500)}
              </p>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Sous-total</dt>
                  <dd className="font-medium">{formatEuros(exemple.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between text-brand">
                  <dt>Remise ({formatRate(exemple.discountRate)})</dt>
                  <dd className="font-medium">
                    −{formatEuros(exemple.discountCents)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3 text-base">
                  <dt className="font-semibold">Total HT</dt>
                  <dd className="text-xl font-bold text-brand">
                    {formatEuros(exemple.totalCents)}
                  </dd>
                </div>
              </dl>

              <ButtonLink href="/carte" className="mt-7 w-full">
                Composer mon panier
              </ButtonLink>
            </Card>
          </div>
        </Section>

        <Section tone="surface">
          <Container className="!px-0 text-center">
            <h2 className="section-title">Un lead injoignable ?</h2>
            <p className="lede mx-auto mt-4 max-w-2xl">
              Signalez-le depuis votre espace dans les 72 heures suivant l’achat. Si
              le numéro est invalide ou si la personne déclare n’avoir jamais fait de
              demande, le lead vous est recrédité.
            </p>
          </Container>
        </Section>
      </main>
      <MarketingFooter />
    </>
  );
}
