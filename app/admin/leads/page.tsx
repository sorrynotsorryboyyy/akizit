import type { Metadata } from 'next';
import { Badge, Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { VerticalBadge } from '@/components/leads/LeadFields';
import { getDemoLeads } from '@/lib/leads/demo-data';
import { currentTimestamp } from '@/lib/now';
import { formatAge, formatEuros } from '@/lib/format';
import { REQUEST_TYPE_LABELS } from '@/lib/leads/exclusivity';

export const metadata: Metadata = { title: 'Leads' };

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const now = await currentTimestamp();
  // Les 60 plus récents : au-delà, la pagination arrivera avec Firestore.
  const leads = getDemoLeads().slice(0, 60);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Leads</h1>
          <p className="mt-2 text-ink-soft">
            {getDemoLeads().length} leads en base · 60 plus récents affichés
          </p>
        </div>
        <ButtonLink href="/admin/leads/nouveau" size="sm">
          Ajouter un lead
        </ButtonLink>
      </div>

      <Card className="mt-8 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-4xl text-left text-sm">
            <thead className="border-b border-line bg-surface-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Métier</th>
                <th className="px-4 py-3 font-semibold">Demande</th>
                <th className="px-4 py-3 font-semibold">Localisation</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Places</th>
                <th className="px-4 py-3 font-semibold">Prix</th>
                <th className="px-4 py-3 font-semibold">Âge</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <VerticalBadge vertical={lead.vertical} />
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    <span className="block truncate text-ink">{lead.summary}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {lead.city}
                    <span className="text-ink-faint"> ({lead.departement})</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                    {REQUEST_TYPE_LABELS[lead.requestType]}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {lead.soldCount} / {lead.maxBuyers}
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">
                    {formatEuros(lead.basePriceCents)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                    {formatAge(lead.capturedAtMs, now)}
                  </td>
                  <td className="px-4 py-3">
                    {lead.status === 'available' ? (
                      <Badge tone="brand">Disponible</Badge>
                    ) : (
                      <Badge tone="neutral">Épuisé</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-sm text-ink-faint">
        Les coordonnées des prospects ne sont pas affichées dans cette liste : elles
        ne sont consultables qu’à la demande, via une route serveur qui journalise
        chaque accès.
      </p>
    </>
  );
}
