import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { LeadsBrowser } from '@/components/leads/LeadsBrowser';
import { listAvailableLeads, listEntitlementLeadIds } from '@/lib/leads/queries';
import { toPublicLead } from '@/lib/leads/mask';
import { optionalUser } from '@/lib/auth/guards';
import { currentTimestamp } from '@/lib/now';

export const metadata: Metadata = {
  title: 'Leads disponibles',
  description:
    'Consultez les demandes de devis qualifiées disponibles partout en France : ' +
    'chauffage, pompe à chaleur, toiture, plomberie, solaire. Achat à l’unité.',
  alternates: { canonical: '/leads' },
};

export const runtime = 'nodejs';

/**
 * Rendu à la requête : l'ancienneté affichée serait figée à la date du build
 * si la page était prérendue statiquement.
 */
export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const user = await optionalUser();

  // Les leads déjà acquis sont marqués : on lit SES propres droits, jamais
  // ceux des autres professionnels.
  const owned = new Set(
    user?.onboarded ? await listEntitlementLeadIds(user.uid) : [],
  );

  const now = await currentTimestamp();

  const docs = await listAvailableLeads();
  const leads = docs.map((lead) =>
    toPublicLead(lead, { ownedByCurrentUser: owned.has(lead.id), now }),
  );

  return (
    <>
      <MarketingHeader />
      <main className="min-h-[70vh] bg-surface-muted">
        {/* useSearchParams impose une frontière Suspense côté serveur. */}
        <Suspense fallback={<div className="h-96" />}>
          <LeadsBrowser leads={leads} now={now} />
        </Suspense>
      </main>
    </>
  );
}
