'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from './AuthProvider';
import { VERTICAL_LIST } from '@/lib/verticals/registry';
import { isValidSiret, normalizeFrenchPhone } from '@/lib/validation/siret';

/**
 * Formulaire d'onboarding professionnel.
 *
 * La validation est doublée : ici pour un retour immédiat, et côté serveur
 * pour ce qui fait autorité. Le contrôle client n'est qu'un confort — la
 * route API refait tout, car rien de ce qui vient du navigateur n'est fiable.
 */
export function OnboardingForm({ suite }: { suite?: string }) {
  const { refreshClaims } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState({
    raisonSociale: '',
    siret: '',
    secteur: VERTICAL_LIST[0].key as string,
    telephone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function validateLocally() {
    const next: Record<string, string> = {};

    if (values.raisonSociale.trim().length < 2) {
      next.raisonSociale = 'Indiquez la raison sociale de votre entreprise.';
    }
    if (!isValidSiret(values.siret)) {
      next.siret = 'SIRET invalide : 14 chiffres, clé de contrôle incluse.';
    }
    if (normalizeFrenchPhone(values.telephone) === null) {
      next.telephone = 'Numéro de téléphone français attendu.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateLocally()) return;

    setPending(true);

    const response = await fetch('/api/auth/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(values),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const fieldErrors = data?.fieldErrors as Record<string, string[]> | undefined;
      setErrors(
        fieldErrors
          ? Object.fromEntries(
              Object.entries(fieldErrors).map(([k, v]) => [k, v[0]]),
            )
          : { raisonSociale: data?.error ?? 'Enregistrement impossible.' },
      );
      setPending(false);
      return;
    }

    // Sans ce rafraîchissement, le claim `onboarded` tout juste posé
    // n'apparaîtrait dans le jeton qu'au bout d'une heure, et les gardes
    // continueraient de renvoyer ici.
    await refreshClaims();

    router.push(suite ?? '/leads');
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate>
      <Field
        label="Raison sociale"
        error={errors.raisonSociale}
        value={values.raisonSociale}
        onChange={(v) => setValues({ ...values, raisonSociale: v })}
        placeholder="Dupont Chauffage SARL"
        autoComplete="organization"
      />

      <Field
        label="Numéro SIRET"
        error={errors.siret}
        value={values.siret}
        onChange={(v) => setValues({ ...values, siret: v })}
        placeholder="552 081 317 66522"
        inputMode="numeric"
        help="14 chiffres, figurant sur votre Kbis ou vos factures."
      />

      <div className="mt-5">
        <label htmlFor="secteur" className="text-sm font-medium">
          Activité principale
        </label>
        <select
          id="secteur"
          value={values.secteur}
          onChange={(e) => setValues({ ...values, secteur: e.target.value })}
          className="mt-1.5 w-full rounded-field border border-line-strong bg-surface px-3 py-2.5 text-[0.9375rem] focus:border-brand focus:outline-none"
        >
          {VERTICAL_LIST.map((v) => (
            <option key={v.key} value={v.key}>
              {v.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-faint">
          Sert à vous proposer les leads pertinents. Vous pourrez acheter dans
          tous les métiers.
        </p>
      </div>

      <Field
        label="Téléphone professionnel"
        error={errors.telephone}
        value={values.telephone}
        onChange={(v) => setValues({ ...values, telephone: v })}
        placeholder="06 12 34 56 78"
        inputMode="tel"
        autoComplete="tel"
      />

      <Button type="submit" size="lg" className="mt-7 w-full" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Activer mon compte'}
      </Button>

      <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
        Ces informations figurent sur vos factures. Elles ne sont jamais
        communiquées aux particuliers dont vous achetez les demandes.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  help,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: string;
} & Omit<React.ComponentProps<'input'>, 'value' | 'onChange'>) {
  const id = `onb-${label.toLowerCase().replace(/[^a-z]/g, '')}`;

  return (
    <div className="mt-5 first:mt-0">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        className={[
          'mt-1.5 w-full rounded-field border bg-surface px-3 py-2.5 text-[0.9375rem]',
          'transition-colors focus:border-brand focus:outline-none',
          error ? 'border-danger' : 'border-line-strong',
        ].join(' ')}
        {...rest}
      />
      {help && !error && (
        <p id={`${id}-help`} className="mt-1 text-xs text-ink-faint">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
