'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/lib/cart/store';
import { computeTotals } from '@/lib/pricing/totals';
import { formatRate, nextTier } from '@/lib/pricing/tiers';
import { formatEuros } from '@/lib/format';
import type { LeadPublic } from '@/lib/leads/types';

/**
 * Barre de panier.
 *
 * Les montants affichés ici sont indicatifs : ils servent au retour immédiat
 * et à l'incitation au palier suivant. Le montant qui fait foi est celui que
 * renvoie /api/cart/quote au moment du paiement.
 */
export function CartBar({ leads }: { leads: LeadPublic[] }) {
  const leadIds = useCart((s) => s.leadIds);
  const clear = useCart((s) => s.clear);

  // Le localStorage n'existe pas au rendu serveur : on n'affiche la barre
  // qu'après montage pour éviter une divergence d'hydratation.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useMemo(
    () =>
      leadIds
        .map((id) => leads.find((l) => l.id === id))
        .filter((l): l is LeadPublic => Boolean(l))
        .map((l) => ({ leadId: l.id, unitPriceCents: l.priceCents })),
    [leadIds, leads],
  );

  if (!mounted || items.length === 0) return null;

  const totals = computeTotals(items);
  const upcoming = nextTier(totals.itemCount);

  return (
    <div className="border-t border-line bg-surface px-5 py-3 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold text-ink">
            {totals.itemCount} lead{totals.itemCount > 1 ? 's' : ''}
          </span>

          {totals.discountRate > 0 && (
            <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand">
              −{formatRate(totals.discountRate)} appliqué
            </span>
          )}

          {upcoming && (
            <span className="text-xs text-ink-soft">
              +{upcoming.missing} lead{upcoming.missing > 1 ? 's' : ''} pour −
              {formatRate(upcoming.tier.rate)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            {totals.discountCents > 0 && (
              <p className="text-xs text-ink-faint line-through">
                {formatEuros(totals.subtotalCents)}
              </p>
            )}
            <p className="text-lg leading-tight font-bold text-ink">
              {formatEuros(totals.totalCents)}
              <span className="ml-1 text-xs font-normal text-ink-faint">HT</span>
            </p>
          </div>

          <button
            type="button"
            onClick={clear}
            className="text-sm text-ink-faint underline-offset-4 hover:text-danger hover:underline"
          >
            Vider
          </button>

          <Link
            href="/panier"
            className="inline-flex h-11 items-center rounded-full bg-brand px-6 font-semibold text-white shadow-cta transition-colors hover:bg-brand-dark"
          >
            Voir le panier
          </Link>
        </div>
      </div>
    </div>
  );
}
