'use client';

import { useCallback, useMemo, useState } from 'react';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LeadFields, VerticalBadge } from './LeadFields';
import { formatAge, formatEuros } from '@/lib/format';
import { REQUEST_TYPE_LABELS } from '@/lib/leads/exclusivity';
import type { LeadPublic } from '@/lib/leads/types';

type Contact = {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string | null;
  codePostal: string;
  ville: string;
  notes: string | null;
};

/**
 * Leads achetés.
 *
 * Les coordonnées ne sont jamais rendues côté serveur : elles se trouveraient
 * dans le payload React, donc dans le HTML, récupérable par une extension ou
 * un cache mal configuré. Elles sont demandées à la volée à la route dédiée,
 * qui vérifie le droit d'accès et journalise chaque révélation.
 */
export function PurchasedLeads({ leads, now }: { leads: LeadPublic[]; now: number }) {
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');

  const reveal = useCallback(
    async (leadId: string) => {
      if (contacts[leadId] || loading[leadId]) return;

      setLoading((s) => ({ ...s, [leadId]: true }));
      setErrors((s) => ({ ...s, [leadId]: '' }));

      const response = await fetch(`/api/leads/${leadId}/contact`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrors((s) => ({
          ...s,
          [leadId]: data?.error ?? 'Coordonnées indisponibles.',
        }));
      } else {
        setContacts((s) => ({ ...s, [leadId]: data.contact }));
      }

      setLoading((s) => ({ ...s, [leadId]: false }));
    },
    [contacts, loading],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.city.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.departement.includes(q),
    );
  }, [leads, query]);

  /**
   * Export CSV.
   *
   * Construit à partir des seules coordonnées déjà révélées : exporter
   * déclencherait sinon la révélation silencieuse de tous les leads, ce qui
   * fausserait le journal d'audit.
   */
  const exportCsv = useCallback(() => {
    const rows = [
      [
        'id',
        'metier',
        'ville',
        'code_postal',
        'departement',
        'type_demande',
        'prix_paye_eur',
        'date_lead',
        'prenom',
        'nom',
        'telephone',
        'email',
        'adresse',
      ],
      ...filtered.map((l) => {
        const c = contacts[l.id];
        return [
          l.id,
          l.vertical,
          l.city,
          l.postalCode,
          l.departement,
          l.requestType,
          (l.priceCents / 100).toFixed(2),
          new Date(l.capturedAtMs).toISOString().slice(0, 10),
          c?.prenom ?? '',
          c?.nom ?? '',
          c?.telephone ?? '',
          c?.email ?? '',
          c?.adresse ?? '',
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'),
      )
      .join('\r\n');

    // BOM UTF-8 : sans lui, Excel affiche « Ã© » à la place des accents.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `akizit-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered, contacts]);

  const revealedCount = Object.keys(contacts).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une ville, un département…"
          className="h-11 flex-1 rounded-field border border-line-strong bg-surface px-4 text-[0.9375rem] focus:border-brand focus:outline-none"
        />
        <Button variant="secondary" onClick={exportCsv}>
          Exporter en CSV
        </Button>
      </div>

      {revealedCount < filtered.length && (
        <p className="mt-3 text-sm text-ink-faint">
          L’export contient les coordonnées des leads déjà affichés
          ({revealedCount}/{filtered.length}). Affichez-les pour les inclure.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {filtered.map((lead) => {
          const contact = contacts[lead.id];

          return (
            <Card as="li" key={lead.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <VerticalBadge vertical={lead.vertical} />
                    <Badge tone="neutral">
                      {REQUEST_TYPE_LABELS[lead.requestType]}
                    </Badge>
                    {lead.maxBuyers === 1 && <Badge tone="accent">Exclusif</Badge>}
                  </div>

                  <h2 className="mt-2.5 text-lg font-semibold">{lead.summary}</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {lead.city} ({lead.departement}) ·{' '}
                    {formatAge(lead.capturedAtMs, now)} · acheté{' '}
                    {formatEuros(lead.priceCents)}
                  </p>
                </div>

                {!contact && (
                  <Button
                    onClick={() => reveal(lead.id)}
                    disabled={loading[lead.id]}
                    size="sm"
                  >
                    {loading[lead.id] ? 'Chargement…' : 'Afficher les coordonnées'}
                  </Button>
                )}
              </div>

              {errors[lead.id] && (
                <p
                  role="alert"
                  className="mt-4 rounded-field bg-danger-tint px-3 py-2.5 text-sm text-danger"
                >
                  {errors[lead.id]}
                </p>
              )}

              {contact && (
                <div className="mt-5 rounded-field border border-brand/30 bg-brand-tint p-5">
                  <p className="text-sm font-semibold text-brand">
                    Coordonnées du prospect
                  </p>
                  <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    <Row label="Nom">
                      {contact.prenom} {contact.nom}
                    </Row>
                    <Row label="Téléphone">
                      <a
                        href={`tel:${contact.telephone}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        {contact.telephone}
                      </a>
                    </Row>
                    <Row label="E-mail">
                      <a
                        href={`mailto:${contact.email}`}
                        className="break-all text-brand hover:underline"
                      >
                        {contact.email}
                      </a>
                    </Row>
                    <Row label="Adresse">
                      {contact.adresse ? `${contact.adresse}, ` : ''}
                      {contact.codePostal} {contact.ville}
                    </Row>
                  </dl>
                  {contact.notes && (
                    <p className="mt-3 border-t border-brand/20 pt-3 text-sm text-ink-soft">
                      {contact.notes}
                    </p>
                  )}
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-brand">
                  Détail du projet
                </summary>
                <div className="mt-3">
                  <LeadFields vertical={lead.vertical} data={lead.data} mode="full" />
                </div>
              </details>
            </Card>
          );
        })}
      </ul>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-ink-faint uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-ink">{children}</dd>
    </div>
  );
}
