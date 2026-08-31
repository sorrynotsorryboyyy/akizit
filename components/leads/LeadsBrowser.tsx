'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { LeadCard } from './LeadCard';
import { LeadDetailPanel } from './LeadDetailPanel';
import { CartBar } from '@/components/cart/CartBar';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Card';
import { VERTICAL_LIST, isVertical, type Vertical } from '@/lib/verticals/registry';
import { formatEuros } from '@/lib/format';
import type { LeadPublic } from '@/lib/leads/types';

/**
 * Liste des leads disponibles.
 *
 * Remplace la carte : plus simple à lire, et surtout indexable. L'état des
 * filtres vit dans l'URL plutôt que dans un état local, ce qui rend chaque
 * sélection partageable et référençable — un lien « leads PAC en Loire-
 * Atlantique » devient une page à part entière pour les moteurs.
 */

type Tri = 'recent' | 'prix_asc' | 'prix_desc' | 'exclusif';

const TRIS: { value: Tri; label: string }[] = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'prix_asc', label: 'Prix croissant' },
  { value: 'prix_desc', label: 'Prix décroissant' },
  { value: 'exclusif', label: 'Exclusifs d’abord' },
];

const PAR_PAGE = 24;

export function LeadsBrowser({ leads, now }: { leads: LeadPublic[]; now: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const metier = params.get('metier');
  const dept = params.get('dept');
  const tri = (params.get('tri') as Tri | null) ?? 'recent';
  const exclusifSeul = params.get('exclusif') === '1';
  const masquerEpuises = params.get('epuises') !== '0';

  /** Écrit un paramètre dans l'URL sans recharger la page. */
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null) next.delete(key);
      else next.set(key, value);
      setPage(1);
      router.replace(next.size ? `/leads?${next}` : '/leads', { scroll: false });
    },
    [params, router],
  );

  const departements = useMemo(() => {
    const set = new Map<string, number>();
    for (const l of leads) set.set(l.departement, (set.get(l.departement) ?? 0) + 1);
    return [...set.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [leads]);

  const counts = useMemo(() => {
    const acc: Partial<Record<Vertical, number>> = {};
    for (const l of leads) acc[l.vertical] = (acc[l.vertical] ?? 0) + 1;
    return acc;
  }, [leads]);

  const filtres = useMemo(() => {
    const result = leads.filter((l) => {
      if (masquerEpuises && l.status === 'sold_out') return false;
      if (metier && isVertical(metier) && l.vertical !== metier) return false;
      if (dept && l.departement !== dept) return false;
      if (exclusifSeul && l.maxBuyers !== 1) return false;
      return true;
    });

    switch (tri) {
      case 'prix_asc':
        return [...result].sort((a, b) => a.priceCents - b.priceCents);
      case 'prix_desc':
        return [...result].sort((a, b) => b.priceCents - a.priceCents);
      case 'exclusif':
        return [...result].sort(
          (a, b) => a.maxBuyers - b.maxBuyers || b.capturedAtMs - a.capturedAtMs,
        );
      default:
        return [...result].sort((a, b) => b.capturedAtMs - a.capturedAtMs);
    }
  }, [leads, metier, dept, tri, exclusifSeul, masquerEpuises]);

  const visibles = filtres.slice(0, page * PAR_PAGE);
  const selected = useMemo(
    () => filtres.find((l) => l.id === selectedId) ?? null,
    [filtres, selectedId],
  );

  const prixMin = filtres.length
    ? Math.min(...filtres.map((l) => l.priceCents))
    : 0;

  const filtreActif = Boolean(metier || dept || exclusifSeul);

  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container className="py-5">
          {/* --- Métiers --- */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              active={!metier}
              onClick={() => setParam('metier', null)}
              label="Tous"
              count={leads.length}
            />
            {VERTICAL_LIST.map((v) => (
              <FilterChip
                key={v.key}
                active={metier === v.key}
                onClick={() => setParam('metier', metier === v.key ? null : v.key)}
                label={v.shortLabel}
                count={counts[v.key] ?? 0}
                color={v.color}
              />
            ))}
          </div>

          {/* --- Département, tri, options --- */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={dept ?? ''}
              onChange={(e) => setParam('dept', e.target.value || null)}
              aria-label="Filtrer par département"
              className="h-10 rounded-field border border-line-strong bg-surface px-3 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">Tous les départements</option>
              {departements.map(([d, n]) => (
                <option key={d} value={d}>
                  {d} ({n})
                </option>
              ))}
            </select>

            <select
              value={tri}
              onChange={(e) => setParam('tri', e.target.value)}
              aria-label="Trier les leads"
              className="h-10 rounded-field border border-line-strong bg-surface px-3 text-sm focus:border-brand focus:outline-none"
            >
              {TRIS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={exclusifSeul}
                onChange={(e) => setParam('exclusif', e.target.checked ? '1' : null)}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              Exclusifs seulement
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={masquerEpuises}
                onChange={(e) => setParam('epuises', e.target.checked ? null : '0')}
                className="h-4 w-4 accent-[var(--color-brand)]"
              />
              Masquer les épuisés
            </label>

            {filtreActif && (
              <button
                type="button"
                onClick={() => router.replace('/leads', { scroll: false })}
                className="text-sm text-ink-faint underline-offset-4 hover:text-brand hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-ink-soft">
            <strong className="text-ink">{filtres.length}</strong> lead
            {filtres.length > 1 ? 's' : ''} disponible
            {filtres.length > 1 ? 's' : ''}
            {filtres.length > 0 && <> · à partir de {formatEuros(prixMin)}</>}
          </p>
        </div>

        {filtres.length === 0 ? (
          <div className="mt-8 rounded-card border border-line bg-surface p-10 text-center">
            <p className="font-semibold text-ink">Aucun lead ne correspond</p>
            <p className="mt-2 text-sm text-ink-soft">
              Élargissez vos critères ou revenez plus tard : de nouvelles demandes
              arrivent chaque jour.
            </p>
            {filtreActif && (
              <Button
                variant="secondary"
                className="mt-5"
                onClick={() => router.replace('/leads', { scroll: false })}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  now={now}
                  selected={lead.id === selectedId}
                  onOpen={setSelectedId}
                />
              ))}
            </ul>

            {visibles.length < filtres.length && (
              <div className="mt-8 text-center">
                <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                  Afficher {Math.min(PAR_PAGE, filtres.length - visibles.length)} leads
                  de plus
                </Button>
              </div>
            )}
          </>
        )}
      </Container>

      {/* Panneau de détail : superposé, fermé par défaut. */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink/20">
          <button
            type="button"
            aria-label="Fermer"
            className="flex-1 cursor-default"
            onClick={() => setSelectedId(null)}
          />
          <aside className="w-full max-w-md border-l border-line bg-surface shadow-panel">
            <LeadDetailPanel
              lead={selected}
              now={now}
              onClose={() => setSelectedId(null)}
            />
          </aside>
        </div>
      )}

      <div className="sticky bottom-0 z-30">
        <CartBar leads={leads} />
      </div>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-brand bg-brand text-white'
          : 'border-line-strong text-ink-soft hover:border-brand hover:text-brand',
      ].join(' ')}
    >
      {color && (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: active ? '#fff' : color }}
          aria-hidden="true"
        />
      )}
      {label}
      <span className={active ? 'text-white/70' : 'text-ink-faint'}>{count}</span>
    </button>
  );
}
