'use client';

import { useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LeadFormFields } from '@/components/admin/LeadFormFields';
import { VERTICAL_LIST, VERTICALS, type Vertical } from '@/lib/verticals/registry';
import {
  MAX_BUYERS_BY_REQUEST,
  REQUEST_TYPE_LABELS,
  type RequestType,
} from '@/lib/leads/exclusivity';
import { SOURCE_SITES } from '@/lib/site-config';
import { formatEuros } from '@/lib/format';
import { createLeadAction, type CreateLeadResult } from './actions';

export function NewLeadForm() {
  const [vertical, setVertical] = useState<Vertical>('pac');
  const [requestType, setRequestType] = useState<RequestType>('devis');
  const [data, setData] = useState<Record<string, unknown>>({});
  const [meta, setMeta] = useState({
    // Type élargi volontairement : SOURCE_SITES est `as const`, mais l'admin
    // doit pouvoir saisir un site source qui n'y figure pas encore.
    source: SOURCE_SITES[0].domain as string,
    codePostal: '',
    ville: '',
    priceCents: '',
  });
  const [contact, setContact] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    codePostalExact: '',
    villeExacte: '',
    urlSource: '',
  });

  const [result, setResult] = useState<CreateLeadResult | null>(null);
  const [pending, startTransition] = useTransition();

  // Les erreurs serveur sont réparties par champ pour s'afficher au bon endroit.
  const fieldErrors = useMemo(() => {
    const map: Record<string, string> = {};
    if (result && !result.ok) {
      for (const e of result.errors) {
        const key = e.path.replace(/^data\./, '');
        if (!map[key]) map[key] = e.message;
      }
    }
    return map;
  }, [result]);

  const def = VERTICALS[vertical];

  function submit() {
    const payload = {
      vertical,
      source: meta.source,
      codePostal: meta.codePostal,
      ville: meta.ville,
      requestType,
      capturedAt: new Date().toISOString(),
      ...(meta.priceCents ? { priceCents: Number(meta.priceCents) * 100 } : {}),
      data,
      contact: {
        prenom: contact.prenom,
        nom: contact.nom,
        telephone: contact.telephone,
        email: contact.email,
        codePostalExact: contact.codePostalExact || meta.codePostal,
        villeExacte: contact.villeExacte || meta.ville,
        consentement: {
          collecteLe: new Date().toISOString(),
          urlSource: contact.urlSource || `https://${meta.source}/`,
        },
      },
    };

    startTransition(async () => setResult(await createLeadAction(payload)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        {/* --- Métier --- */}
        <Card className="p-6">
          <h2 className="font-semibold">Métier</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {VERTICAL_LIST.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  setVertical(v.key);
                  // Les champs diffèrent d'une verticale à l'autre : conserver
                  // les anciennes valeurs produirait des champs invalides.
                  setData({});
                  setResult(null);
                }}
                className={[
                  'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  vertical === v.key
                    ? 'border-brand bg-brand-tint text-brand'
                    : 'border-line-strong text-ink-soft hover:border-brand',
                ].join(' ')}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: v.color }}
                  aria-hidden="true"
                />
                {v.label}
              </button>
            ))}
          </div>
        </Card>

        {/* --- Origine et localisation --- */}
        <Card className="p-6">
          <h2 className="font-semibold">Origine et localisation</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Site source" required>
              <select
                value={meta.source}
                onChange={(e) => setMeta({ ...meta, source: e.target.value })}
                className={inputClass(fieldErrors.source)}
              >
                {SOURCE_SITES.map((s) => (
                  <option key={s.domain} value={s.domain}>
                    {s.domain}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Code postal" required error={fieldErrors.codePostal}>
              <input
                value={meta.codePostal}
                onChange={(e) => setMeta({ ...meta, codePostal: e.target.value })}
                placeholder="44000"
                inputMode="numeric"
                className={inputClass(fieldErrors.codePostal)}
              />
            </Field>

            <Field label="Commune" required error={fieldErrors.ville}>
              <input
                value={meta.ville}
                onChange={(e) => setMeta({ ...meta, ville: e.target.value })}
                placeholder="Nantes"
                className={inputClass(fieldErrors.ville)}
              />
            </Field>

            <Field
              label="Prix (€)"
              error={fieldErrors.priceCents}
              help={`Laisser vide pour le tarif du métier (${formatEuros(def.defaultPriceCents)}).`}
            >
              <input
                value={meta.priceCents}
                onChange={(e) => setMeta({ ...meta, priceCents: e.target.value })}
                placeholder={String(def.defaultPriceCents / 100)}
                inputMode="numeric"
                className={inputClass(fieldErrors.priceCents)}
              />
            </Field>
          </div>
        </Card>

        {/* --- Type de demande --- */}
        <Card className="p-6">
          <h2 className="font-semibold">Type de demande</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Il détermine automatiquement le nombre d’acheteurs autorisés.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(['devis', 'telephone'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRequestType(t)}
                className={[
                  'rounded-field border p-4 text-left transition-colors',
                  requestType === t
                    ? 'border-brand bg-brand-tint'
                    : 'border-line-strong hover:border-brand',
                ].join(' ')}
              >
                <span className="block font-semibold">{REQUEST_TYPE_LABELS[t]}</span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {MAX_BUYERS_BY_REQUEST[t]} acheteur
                  {MAX_BUYERS_BY_REQUEST[t] > 1 ? 's' : ''} maximum
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* --- Champs métier, rendus depuis le registre --- */}
        <Card className="p-6">
          <h2 className="font-semibold">Détail du projet — {def.label}</h2>
          <div className="mt-4">
            <LeadFormFields
              vertical={vertical}
              values={data}
              errors={fieldErrors}
              onChange={(key, value) =>
                setData((prev) => {
                  const next = { ...prev };
                  if (value === undefined) delete next[key];
                  else next[key] = value;
                  return next;
                })
              }
            />
          </div>
        </Card>

        {/* --- Coordonnées --- */}
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Coordonnées du prospect</h2>
            <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-ink-soft">
              Stocké séparément
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Ces informations partent dans un document privé, jamais dans la fiche
            consultable avant achat.
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field label="Prénom" required error={fieldErrors['contact.prenom']}>
              <input
                value={contact.prenom}
                onChange={(e) => setContact({ ...contact, prenom: e.target.value })}
                className={inputClass(fieldErrors['contact.prenom'])}
              />
            </Field>
            <Field label="Nom" required error={fieldErrors['contact.nom']}>
              <input
                value={contact.nom}
                onChange={(e) => setContact({ ...contact, nom: e.target.value })}
                className={inputClass(fieldErrors['contact.nom'])}
              />
            </Field>
            <Field label="Téléphone" required error={fieldErrors['contact.telephone']}>
              <input
                value={contact.telephone}
                onChange={(e) => setContact({ ...contact, telephone: e.target.value })}
                placeholder="06 12 34 56 78"
                className={inputClass(fieldErrors['contact.telephone'])}
              />
            </Field>
            <Field label="E-mail" required error={fieldErrors['contact.email']}>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                className={inputClass(fieldErrors['contact.email'])}
              />
            </Field>
            <Field
              label="URL du formulaire d’origine"
              error={fieldErrors['contact.consentement.urlSource']}
              help="Preuve de consentement RGPD. Par défaut, la racine du site source."
            >
              <input
                value={contact.urlSource}
                onChange={(e) => setContact({ ...contact, urlSource: e.target.value })}
                placeholder={`https://${meta.source}/formulaire`}
                className={inputClass(fieldErrors['contact.consentement.urlSource'])}
              />
            </Field>
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <Button size="lg" onClick={submit} disabled={pending}>
            {pending ? 'Validation…' : 'Valider le lead'}
          </Button>
          {result?.ok && (
            <p className="text-sm font-medium text-brand">
              Lead valide : {result.summary} · {result.ville} · {result.maxBuyers}{' '}
              acheteur{result.maxBuyers > 1 ? 's' : ''} max.
            </p>
          )}
          {result && !result.ok && (
            <p className="text-sm font-medium text-danger">
              {result.errors.length} erreur{result.errors.length > 1 ? 's' : ''} à
              corriger.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="font-semibold">Aperçu</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Métier" value={def.label} />
            <Row label="Demande" value={REQUEST_TYPE_LABELS[requestType]} />
            <Row
              label="Acheteurs max"
              value={String(MAX_BUYERS_BY_REQUEST[requestType])}
            />
            <Row
              label="Prix"
              value={
                meta.priceCents
                  ? formatEuros(Number(meta.priceCents) * 100)
                  : formatEuros(def.defaultPriceCents)
              }
            />
            <Row label="Commune" value={meta.ville || '—'} />
          </dl>

          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-faint">
            La validation applique les mêmes règles que l’import JSON. La persistance
            en base arrive en phase 2.
          </p>
        </Card>
      </div>
    </div>
  );
}

function inputClass(error?: string) {
  return [
    'mt-1.5 w-full rounded-field border bg-surface px-3 py-2.5 text-[0.9375rem]',
    'transition-colors focus:border-brand focus:outline-none',
    error ? 'border-danger' : 'border-line-strong',
  ].join(' ');
}

function Field({
  label,
  required,
  error,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
      {help && !error && <span className="mt-1 block text-xs text-ink-faint">{help}</span>}
      {error && (
        <span className="mt-1 block text-xs font-medium text-danger">{error}</span>
      )}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
