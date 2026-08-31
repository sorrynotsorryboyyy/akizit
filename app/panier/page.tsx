import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { CartView } from '@/components/cart/CartView';
import { listAvailableLeads } from '@/lib/leads/queries';
import { currentTimestamp } from '@/lib/now';
import { toPublicLead } from '@/lib/leads/mask';

export const metadata: Metadata = {
  title: 'Mon panier',
  robots: { index: false },
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PanierPage() {
  // Le panier ne connaît que des identifiants : la page fournit le catalogue
  // pour retrouver les libellés et les prix du moment.
  const now = await currentTimestamp();
  const docs = await listAvailableLeads();
  const leads = docs.map((lead) => toPublicLead(lead, { now }));

  return (
    <>
      <MarketingHeader />
      <main className="min-h-[60vh] bg-surface-muted py-12">
        <CartView leads={leads} />
      </main>
      <MarketingFooter />
    </>
  );
}
