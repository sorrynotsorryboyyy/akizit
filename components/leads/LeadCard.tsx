'use client';

import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VerticalBadge } from './LeadFields';
import { useCart } from '@/lib/cart/store';
import { formatAge, formatEuros } from '@/lib/format';
import { REQUEST_TYPE_LABELS } from '@/lib/leads/exclusivity';
import type { LeadPublic } from '@/lib/leads/types';

/**
 * Carte d'un lead dans la liste.
 *
 * N'affiche que des informations non identifiantes : métier, commune,
 * ancienneté, prix. Les coordonnées ne transitent jamais jusqu'ici — c'est
 * `toPublicLead` qui garantit la projection en liste blanche.
 */
export function LeadCard({
  lead,
  now,
  onOpen,
  selected,
}: {
  lead: LeadPublic;
  now: number;
  onOpen: (id: string) => void;
  selected: boolean;
}) {
  const leadIds = useCart((s) => s.leadIds);
  const toggle = useCart((s) => s.toggle);
  const hydrated = useCart((s) => s.hydrated);

  const inCart = hydrated && leadIds.includes(lead.id);
  const soldOut = lead.status === 'sold_out';

  return (
    <Card
      as="li"
      className={[
        'flex flex-col p-5 transition-colors',
        selected ? 'border-brand ring-1 ring-brand' : 'hover:border-line-strong',
        soldOut ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <VerticalBadge vertical={lead.vertical} />
        {lead.maxBuyers === 1 ? (
          <Badge tone="accent">Exclusif</Badge>
        ) : (
          <Badge tone={lead.remainingSlots <= 1 ? 'accent' : 'neutral'}>
            {lead.remainingSlots} / {lead.maxBuyers} places
          </Badge>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen(lead.id)}
        className="mt-3 text-left"
        aria-label={`Voir le détail : ${lead.summary}`}
      >
        <p className="font-semibold text-ink">{lead.summary}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {lead.city} ({lead.departement})
        </p>
      </button>

      <p className="mt-2 text-xs text-ink-faint">
        {formatAge(lead.capturedAtMs, now)} · {REQUEST_TYPE_LABELS[lead.requestType]}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-lg font-bold text-ink">{formatEuros(lead.priceCents)}</p>

        {soldOut ? (
          <Button size="sm" variant="secondary" disabled>
            Épuisé
          </Button>
        ) : (
          <Button
            size="sm"
            variant={inCart ? 'secondary' : 'primary'}
            onClick={() => toggle(lead.id)}
          >
            {inCart ? 'Retirer' : 'Ajouter'}
          </Button>
        )}
      </div>
    </Card>
  );
}
