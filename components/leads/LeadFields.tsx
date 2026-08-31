import { formatFieldValue } from '@/lib/verticals/field-types';
import { VERTICALS, type Vertical } from '@/lib/verticals/registry';

/**
 * Rendu générique des champs métier.
 *
 * Un seul composant pour les sept verticales : il lit les définitions du
 * registre plutôt que de connaître les champs. En mode `preview`, seuls les
 * champs marqués `showInPreview` sont rendus — c'est ce qui distingue la
 * vitrine de la fiche débloquée.
 */
export function LeadFields({
  vertical,
  data,
  mode,
  className,
}: {
  vertical: Vertical;
  data: Record<string, unknown>;
  mode: 'preview' | 'full';
  className?: string;
}) {
  const fields = VERTICALS[vertical].fields.filter(
    (f) => (mode === 'full' || f.showInPreview) && data[f.key] !== undefined,
  );

  if (fields.length === 0) return null;

  return (
    <dl
      className={['grid gap-x-6 gap-y-4 sm:grid-cols-2', className]
        .filter(Boolean)
        .join(' ')}
    >
      {fields.map((field) => (
        <div key={field.key}>
          <dt className="text-xs font-medium tracking-wide text-ink-faint uppercase">
            {field.label}
          </dt>
          <dd className="mt-1 font-semibold text-ink">
            {formatFieldValue(field, data[field.key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function VerticalBadge({
  vertical,
  className,
}: {
  vertical: Vertical;
  className?: string;
}) {
  const def = VERTICALS[vertical];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ backgroundColor: `${def.color}18`, color: def.color }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: def.color }}
        aria-hidden="true"
      />
      {def.shortLabel}
    </span>
  );
}
