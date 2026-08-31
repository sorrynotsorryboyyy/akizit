'use client';

import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LeadFields, VerticalBadge } from './LeadFields';
import { MaskedContact } from './MaskedContact';
import { useCart } from '@/lib/cart/store';
import { formatAge, formatEuros } from '@/lib/format';
import { REQUEST_TYPE_LABELS } from '@/lib/leads/exclusivity';
import { VERTICALS } from '@/lib/verticals/registry';
import type { LeadPublic } from '@/lib/leads/types';

/** Panneau de détail d'un lead sélectionné sur la carte. */
export function LeadDetailPanel({
  lead,
  onClose,
  now,
}: {
  lead: LeadPublic | null;
  onClose: () => void;
  now: number;
}) {
  const leadIds = useCart((s) => s.leadIds);
  const toggle = useCart((s) => s.toggle);

  if (!lead) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <p className="font-semibold text-ink">Sélectionnez un lead</p>
          <p className="mt-2 max-w-xs text-sm text-ink-soft">
            Cliquez sur un point de la carte pour consulter le détail de la demande
            et l’ajouter à votre panier.
          </p>
        </div>
      </div>
    );
  }

  const inCart = leadIds.includes(lead.id);
  const soldOut = lead.status === 'sold_out';
  const def = VERTICALS[lead.vertical];

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <VerticalBadge vertical={lead.vertical} />
            <h2 className="mt-2 text-lg leading-snug font-bold text-ink">
              {lead.summary}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le détail"
            className="-mr-1 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <span className="font-medium text-ink">
            {lead.city} ({lead.departement})
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatAge(lead.capturedAtMs, now)}</span>
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Exclusivité : l'argument commercial le plus fort, donc affiché haut. */}
        <div className="flex flex-wrap items-center gap-2">
          {lead.maxBuyers === 1 ? (
            <Badge tone="accent">Exclusif — 1 seul acheteur</Badge>
          ) : (
            <Badge tone={lead.remainingSlots <= 1 ? 'accent' : 'neutral'}>
              {lead.remainingSlots} place{lead.remainingSlots > 1 ? 's' : ''} sur{' '}
              {lead.maxBuyers}
            </Badge>
          )}
          <Badge tone="neutral">{REQUEST_TYPE_LABELS[lead.requestType]}</Badge>
        </div>

        <LeadFields vertical={lead.vertical} data={lead.data} mode="preview" />

        <MaskedContact requestType={lead.requestType} />

        <p className="text-xs leading-relaxed text-ink-faint">
          Lead généré sur {lead.source}. La position affichée est approximative :
          l’adresse exacte est communiquée après achat.
        </p>
      </div>

      <footer className="border-t border-line bg-surface px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-ink">{formatEuros(lead.priceCents)}</p>
            <p className="text-xs text-ink-faint">{def.label} · prix unitaire</p>
          </div>

          {soldOut ? (
            <Button disabled variant="secondary">
              Plus disponible
            </Button>
          ) : (
            <Button
              variant={inCart ? 'secondary' : 'primary'}
              onClick={() => toggle(lead.id)}
            >
              {inCart ? 'Retirer du panier' : 'Ajouter au panier'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
