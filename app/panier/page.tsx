import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { CartView } from '@/components/cart/CartView';
import { getDemoLeads } from '@/lib/leads/demo-data';
import { toPublicLead } from '@/lib/leads/mask';

export const metadata: Metadata = {
  title: 'Mon panier',
  robots: { index: false },
};

export default function PanierPage() {
  // Le panier ne connaît que des identifiants : la page fournit le catalogue
  // pour retrouver les libellés et les prix affichables.
  const leads = getDemoLeads().map((lead) => toPublicLead(lead));

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
