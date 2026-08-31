'use client';

import type { FieldDef } from '@/lib/verticals/field-types';
import { VERTICALS, type Vertical } from '@/lib/verticals/registry';

/**
 * Formulaire métier générique.
 *
 * Un seul composant sert les sept verticales : il rend les champs décrits par
 * le registre. Ajouter une verticale ne demande donc aucun formulaire nouveau,
 * et un champ ajouté à une verticale apparaît ici automatiquement.
 */
export function LeadFormFields({
  vertical,
  values,
  errors,
  onChange,
}: {
  vertical: Vertical;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {VERTICALS[vertical].fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          value={values[field.key]}
          error={errors[field.key]}
          onChange={(v) => onChange(field.key, v)}
        />
      ))}
    </div>
  );
}

function FieldControl({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${field.key}`;
  const describedBy = error ? `${id}-error` : field.help ? `${id}-help` : undefined;

  const inputClass = [
    'mt-1.5 w-full rounded-field border bg-surface px-3 py-2.5 text-[0.9375rem]',
    'transition-colors focus:border-brand focus:outline-none',
    error ? 'border-danger' : 'border-line-strong',
  ].join(' ');

  return (
    <div className={field.kind === 'boolean' ? 'sm:col-span-2' : undefined}>
      {field.kind === 'boolean' ? (
        <label className="flex cursor-pointer items-start gap-3">
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            aria-describedby={describedBy}
            className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]"
          />
          <span>
            <span className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-danger"> *</span>}
            </span>
            {field.help && (
              <span id={`${id}-help`} className="mt-0.5 block text-xs text-ink-faint">
                {field.help}
              </span>
            )}
          </span>
        </label>
      ) : (
        <>
          <label htmlFor={id} className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-danger"> *</span>}
          </label>

          {field.kind === 'enum' ? (
            <select
              id={id}
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value || undefined)}
              aria-describedby={describedBy}
              className={inputClass}
            >
              <option value="">— Choisir —</option>
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={id}
              type="number"
              inputMode="numeric"
              min={field.min}
              max={field.max}
              value={value === undefined || value === null ? '' : String(value)}
              onChange={(e) =>
                onChange(e.target.value === '' ? undefined : Number(e.target.value))
              }
              aria-describedby={describedBy}
              className={inputClass}
              placeholder={
                field.kind === 'surface'
                  ? 'm²'
                  : field.kind === 'number' && field.unit
                    ? field.unit
                    : undefined
              }
            />
          )}

          {field.help && !error && (
            <p id={`${id}-help`} className="mt-1 text-xs text-ink-faint">
              {field.help}
            </p>
          )}
        </>
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
