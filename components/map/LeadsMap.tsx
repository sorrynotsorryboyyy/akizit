'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { MapFilters, type Filters } from './MapFilters';
import { LeadDetailPanel } from '@/components/leads/LeadDetailPanel';
import { CartBar } from '@/components/cart/CartBar';
import { VERTICAL_KEYS, type Vertical } from '@/lib/verticals/registry';
import type { LeadPublic } from '@/lib/leads/types';

/**
 * `ssr: false` est indispensable : maplibre-gl accède à `window` dès son
 * import, ce qui ferait échouer le pré-rendu serveur.
 */
const MapCanvas = dynamic(() => import('./MapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-surface-muted">
      <p className="text-sm text-ink-faint">Chargement de la carte…</p>
    </div>
  ),
});

export function LeadsMap({ leads, now }: { leads: LeadPublic[]; now: number }) {
  const [filters, setFilters] = useState<Filters>({
    verticals: new Set(),
    hideSoldOut: true,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const acc = Object.fromEntries(VERTICAL_KEYS.map((v) => [v, 0])) as Record<
      Vertical,
      number
    >;
    for (const lead of leads) acc[lead.vertical] += 1;
    return acc;
  }, [leads]);

  const visible = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.hideSoldOut && lead.status === 'sold_out') return false;
      if (filters.verticals.size > 0 && !filters.verticals.has(lead.vertical)) {
        return false;
      }
      return true;
    });
  }, [leads, filters]);

  const selected = useMemo(
    () => visible.find((l) => l.id === selectedId) ?? null,
    [visible, selectedId],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <MapFilters
        filters={filters}
        counts={counts}
        total={leads.length}
        onChange={setFilters}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {/* La hauteur du conteneur doit être connue avant l'init de MapLibre,
            sinon la carte s'initialise à 0 px et reste grise. */}
        <div className="relative flex-1">
          <MapCanvas leads={visible} selectedId={selectedId} onSelect={setSelectedId} />

          <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-surface/95 px-4 py-2 text-sm font-medium shadow-card backdrop-blur">
            {visible.length} lead{visible.length > 1 ? 's' : ''} affiché
            {visible.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Panneau latéral sur grand écran ; sur mobile, il se superpose. */}
        <aside
          className={[
            'w-full max-w-md border-l border-line bg-surface',
            selected
              ? 'absolute inset-0 z-20 lg:relative lg:inset-auto'
              : 'hidden lg:block',
          ].join(' ')}
        >
          <LeadDetailPanel
            lead={selected}
            now={now}
            onClose={() => setSelectedId(null)}
          />
        </aside>
      </div>

      <CartBar leads={leads} />
    </div>
  );
}
