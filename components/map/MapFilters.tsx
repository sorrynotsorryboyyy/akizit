'use client';

import { VERTICAL_LIST, type Vertical } from '@/lib/verticals/registry';

export type Filters = {
  verticals: Set<Vertical>;
  hideSoldOut: boolean;
};

export function MapFilters({
  filters,
  counts,
  total,
  onChange,
}: {
  filters: Filters;
  counts: Record<Vertical, number>;
  total: number;
  onChange: (next: Filters) => void;
}) {
  function toggleVertical(v: Vertical) {
    const next = new Set(filters.verticals);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange({ ...filters, verticals: next });
  }

  const allSelected = filters.verticals.size === 0;

  return (
    <div className="border-b border-line bg-surface px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ ...filters, verticals: new Set() })}
          className={[
            'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
            allSelected
              ? 'border-brand bg-brand text-white'
              : 'border-line-strong text-ink-soft hover:border-brand hover:text-brand',
          ].join(' ')}
        >
          Tous ({total})
        </button>

        {VERTICAL_LIST.map((v) => {
          const active = filters.verticals.has(v.key);
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => toggleVertical(v.key)}
              aria-pressed={active}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-brand bg-brand-tint text-brand'
                  : 'border-line-strong text-ink-soft hover:border-brand hover:text-brand',
              ].join(' ')}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: v.color }}
                aria-hidden="true"
              />
              {v.shortLabel}
              <span className="text-xs text-ink-faint">{counts[v.key] ?? 0}</span>
            </button>
          );
        })}

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={filters.hideSoldOut}
            onChange={(e) => onChange({ ...filters, hideSoldOut: e.target.checked })}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          Masquer les leads épuisés
        </label>
      </div>
    </div>
  );
}
