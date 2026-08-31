'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, Container } from '@/components/ui/Card';
import { VerticalBadge } from '@/components/leads/LeadFields';
import { useCart } from '@/lib/cart/store';
import { computeTotals, VAT_EXEMPTION_NOTICE } from '@/lib/pricing/totals';
import { DISCOUNT_TIERS, formatRate, nextTier } from '@/lib/pricing/tiers';
import { formatEuros } from '@/lib/format';
import { REQUEST_TYPE_LABELS } from '@/lib/leads/exclusivity';
import type { LeadPublic } from '@/lib/leads/types';

export function CartView({ leads }: { leads: LeadPublic[] }) {
  const leadIds = useCart((s) => s.leadIds);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  const router = useRouter();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /**
   * Départ vers le paiement.
   *
   * On n'envoie que des identifiants : le serveur relit les prix, réserve les
   * leads et calcule le montant qui fait foi. Le total affiché ici n'est
   * qu'un miroir.
   */
  async function checkout() {
    setPending(true);
    setCheckoutError(null);

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leadIds }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data?.code === 'NON_CONNECTE') {
        router.push('/connexion?suite=%2Fpanier');
        return;
      }
      if (data?.code === 'ONBOARDING_REQUIS') {
        router.push('/onboarding?suite=%2Fpanier');
        return;
      }
      setCheckoutError(data?.error ?? 'Le paiement n’a pas pu démarrer.');
      setPending(false);
      return;
    }

    // Le prestataire peut renvoyer une URL externe (Stripe) : seul un chemin
    // interne passe par le routeur.
    if (data.url.startsWith('/')) router.push(data.url);
    else window.location.assign(data.url);
  }

  // Le localStorage n'existe pas au rendu serveur. zustand/persist expose son
  // propre drapeau de réhydratation : on l'utilise plutôt qu'un
  // useEffect+setState, que React 19 signale comme rendu en cascade.
  const hydrated = useCart((s) => s.hydrated);

  const items = useMemo(
    () =>
      leadIds
        .map((id) => leads.find((l) => l.id === id))
        .filter((l): l is LeadPublic => Boolean(l)),
    [leadIds, leads],
  );

  if (!hydrated) {
    return (
      <Container>
        <div className="h-64 animate-pulse rounded-card bg-surface-sunken" />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container>
        <Card className="mx-auto max-w-lg p-10 text-center">
          <h1 className="section-title">Votre panier est vide</h1>
          <p className="mt-3 text-ink-soft">
            Parcourez la liste et ajoutez les leads qui correspondent à votre zone
            d’intervention.
          </p>
          <ButtonLink href="/leads" size="lg" className="mt-7">
            Voir les leads disponibles
          </ButtonLink>
        </Card>
      </Container>
    );
  }

  const totals = computeTotals(
    items.map((l) => ({ leadId: l.id, unitPriceCents: l.priceCents })),
  );
  const upcoming = nextTier(totals.itemCount);

  return (
    <Container>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="section-title">Mon panier</h1>
        <button
          type="button"
          onClick={clear}
          className="text-sm text-ink-faint underline-offset-4 hover:text-danger hover:underline"
        >
          Vider le panier
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* --- Lignes --- */}
        <ul className="space-y-3">
          {items.map((lead) => (
            <Card as="li" key={lead.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <VerticalBadge vertical={lead.vertical} />
                <p className="mt-2 truncate font-semibold text-ink">{lead.summary}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {lead.city} ({lead.departement}) ·{' '}
                  {REQUEST_TYPE_LABELS[lead.requestType]}
                  {lead.maxBuyers === 1 && ' · exclusif'}
                </p>
              </div>

              <p className="shrink-0 font-bold text-ink">
                {formatEuros(lead.priceCents)}
              </p>

              <button
                type="button"
                onClick={() => remove(lead.id)}
                aria-label={`Retirer ${lead.summary}`}
                className="shrink-0 rounded-full p-2 text-ink-faint transition-colors hover:bg-danger-tint hover:text-danger"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </Card>
          ))}
        </ul>

        {/* --- Récapitulatif --- */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-semibold">Récapitulatif</h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">
                  Sous-total ({totals.itemCount} lead
                  {totals.itemCount > 1 ? 's' : ''})
                </dt>
                <dd className="font-medium">{formatEuros(totals.subtotalCents)}</dd>
              </div>

              {totals.discountCents > 0 && (
                <div className="flex justify-between text-brand">
                  <dt>Remise volume ({formatRate(totals.discountRate)})</dt>
                  <dd className="font-medium">
                    −{formatEuros(totals.discountCents)}
                  </dd>
                </div>
              )}

              {/* En franchise en base, afficher « TVA 0 % » puis deux fois le
                  même total ferait douter de la justesse du calcul : on rend
                  un montant unique et la mention légale. */}
              {totals.vatRate > 0 && (
                <>
                  <div className="flex justify-between border-t border-line pt-3">
                    <dt className="text-ink-soft">Total HT</dt>
                    <dd className="font-semibold">{formatEuros(totals.totalCents)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">
                      TVA ({Math.round(totals.vatRate * 100)} %)
                    </dt>
                    <dd className="font-medium">{formatEuros(totals.vatCents)}</dd>
                  </div>
                </>
              )}

              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="text-xl font-bold text-ink">
                  {formatEuros(totals.totalWithVatCents)}
                </dd>
              </div>

              {totals.vatRate === 0 && (
                <p className="text-xs text-ink-faint">{VAT_EXEMPTION_NOTICE}</p>
              )}
            </dl>

            {upcoming && (
              <p className="mt-4 rounded-field bg-brand-tint px-3 py-2.5 text-sm text-brand">
                Ajoutez {upcoming.missing} lead{upcoming.missing > 1 ? 's' : ''} pour
                obtenir −{formatRate(upcoming.tier.rate)}.
              </p>
            )}

            <Button
              className="mt-5 w-full"
              size="lg"
              onClick={checkout}
              disabled={pending}
            >
              {pending ? 'Redirection…' : 'Passer au paiement'}
            </Button>

            {checkoutError && (
              <p
                role="alert"
                className="mt-3 rounded-field bg-danger-tint px-3 py-2.5 text-sm text-danger"
              >
                {checkoutError}
              </p>
            )}

            <p className="mt-3 text-center text-xs text-ink-faint">
              Les montants sont recalculés par le serveur avant tout débit.
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold">Remises par volume</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {[...DISCOUNT_TIERS]
                .sort((a, b) => a.minItems - b.minItems)
                .map((t) => (
                  <li key={t.minItems} className="flex justify-between">
                    <span>À partir de {t.minItems} leads</span>
                    <span
                      className={
                        totals.itemCount >= t.minItems
                          ? 'font-semibold text-brand'
                          : ''
                      }
                    >
                      −{formatRate(t.rate)}
                    </span>
                  </li>
                ))}
            </ul>
          </Card>

          <Link
            href="/leads"
            className="block text-center text-sm text-ink-soft underline-offset-4 hover:text-brand hover:underline"
          >
            ← Continuer mes achats
          </Link>
        </div>
      </div>
    </Container>
  );
}
