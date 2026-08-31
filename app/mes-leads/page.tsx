import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { Card, Container } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { PurchasedLeads } from '@/components/leads/PurchasedLeads';
import { requireOnboardedPro } from '@/lib/auth/guards';
import { getLeadsByIds, listEntitlementLeadIds } from '@/lib/leads/queries';
import { toPublicLead } from '@/lib/leads/mask';
import { currentTimestamp } from '@/lib/now';

export const metadata: Metadata = {
  title: 'Mes leads',
  robots: { index: false },
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function MesLeadsPage() {
  const user = await requireOnboardedPro('/mes-leads');
  const now = await currentTimestamp();

  const leadIds = await listEntitlementLeadIds(user.uid);
  const leads = await getLeadsByIds(leadIds);

  // Même ici, les coordonnées ne sont PAS incluses dans le rendu serveur :
  // elles finiraient dans le payload React et donc dans le HTML. Le composant
  // les récupère à la demande via la route dédiée, qui journalise l'accès.
  const publicLeads = leads.map((l) => toPublicLead(l, { ownedByCurrentUser: true }));

  return (
    <>
      <MarketingHeader />
      <main className="min-h-[60vh] bg-surface-muted py-12">
        <Container>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h1 className="section-title">Mes leads</h1>
              <p className="mt-2 text-ink-soft">
                {publicLeads.length} lead{publicLeads.length > 1 ? 's' : ''} acheté
                {publicLeads.length > 1 ? 's' : ''}
              </p>
            </div>
            <ButtonLink href="/carte" variant="secondary" size="sm">
              Acheter d’autres leads
            </ButtonLink>
          </div>

          <div className="mt-8">
            {publicLeads.length === 0 ? (
              <Card className="mx-auto max-w-lg p-10 text-center">
                <h2 className="text-lg font-semibold">Aucun lead pour le moment</h2>
                <p className="mt-2 text-ink-soft">
                  Parcourez la carte et achetez vos premiers leads : leurs
                  coordonnées apparaîtront ici immédiatement.
                </p>
                <ButtonLink href="/carte" size="lg" className="mt-6">
                  Voir les leads disponibles
                </ButtonLink>
              </Card>
            ) : (
              <PurchasedLeads leads={publicLeads} now={now} />
            )}
          </div>
        </Container>
      </main>
    </>
  );
}
