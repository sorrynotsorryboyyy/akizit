import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { getDemoLeads } from '@/lib/leads/demo-data';
import { VERTICAL_LIST } from '@/lib/verticals/registry';
import { formatEuros } from '@/lib/format';

export default function AdminDashboardPage() {
  const leads = getDemoLeads();

  const available = leads.filter((l) => l.status === 'available');
  const soldOut = leads.filter((l) => l.status === 'sold_out');

  // Valeur du stock encore vendable : le chiffre qui pilote l'activité.
  const stockValue = available.reduce(
    (sum, l) => sum + l.basePriceCents * (l.maxBuyers - l.soldCount),
    0,
  );
  const realized = leads.reduce((sum, l) => sum + l.basePriceCents * l.soldCount, 0);

  const byVertical = VERTICAL_LIST.map((v) => ({
    ...v,
    count: available.filter((l) => l.vertical === v.key).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="section-title">Tableau de bord</h1>
        <div className="flex gap-2">
          <ButtonLink href="/admin/leads/nouveau" size="sm">
            Ajouter un lead
          </ButtonLink>
          <ButtonLink href="/admin/import" variant="secondary" size="sm">
            Import JSON
          </ButtonLink>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Leads disponibles" value={String(available.length)} />
        <Stat label="Leads épuisés" value={String(soldOut.length)} />
        <Stat label="Valeur du stock" value={formatEuros(stockValue)} />
        <Stat label="Chiffre réalisé" value={formatEuros(realized)} />
      </div>

      <Card className="mt-8 p-6">
        <h2 className="font-semibold">Stock disponible par métier</h2>
        <ul className="mt-5 space-y-3">
          {byVertical.map((v) => {
            const max = byVertical[0].count || 1;
            return (
              <li key={v.key} className="flex items-center gap-4">
                <span className="w-40 shrink-0 text-sm font-medium">{v.label}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${(v.count / max) * 100}%`,
                      backgroundColor: v.color,
                    }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right text-sm font-semibold">
                  {v.count}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold">Données de démonstration</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Les leads affichés sont générés localement et disparaissent au
          redémarrage. La persistance Firestore, l’authentification et la
          vérification du rôle administrateur arrivent en phase 2. Les écrans
          d’ajout et d’import valident déjà les données avec les schémas définitifs.
        </p>
        <Link
          href="/admin/leads"
          className="mt-4 inline-block text-sm font-medium text-brand underline-offset-4 hover:underline"
        >
          Consulter les leads →
        </Link>
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-ink">{value}</p>
    </Card>
  );
}
