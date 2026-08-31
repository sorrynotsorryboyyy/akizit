import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { Card, Container } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { requireOnboardedPro } from '@/lib/auth/guards';
import { isAdminConfigured, adminDb } from '@/lib/firebase/admin';
import { formatEuros } from '@/lib/format';
import type { OrderDoc } from '@/lib/orders/types';

export const metadata: Metadata = {
  title: 'Commande confirmée',
  robots: { index: false },
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function SuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ commande?: string }>;
}) {
  const { commande } = await searchParams;
  const user = await requireOnboardedPro('/mes-leads');

  if (!commande || !isAdminConfigured()) redirect('/mes-leads');

  const snapshot = await adminDb().collection('orders').doc(commande).get();
  const order = snapshot.exists ? (snapshot.data() as OrderDoc) : null;

  // Une commande d'autrui ne doit rien révéler, pas même son existence.
  if (!order || order.proId !== user.uid) redirect('/mes-leads');

  return (
    <>
      <MarketingHeader />
      <main className="grid min-h-[70vh] place-items-center bg-surface-muted py-12">
        <Container className="max-w-lg">
          <Card className="p-8 text-center">
            {order.status === 'paid' ? (
              <>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-tint">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="var(--color-brand)"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <h1 className="section-title mt-5">Commande confirmée</h1>
                <p className="mt-3 text-ink-soft">
                  {order.items.length} lead{order.items.length > 1 ? 's' : ''} pour{' '}
                  {formatEuros(order.totalWithVatCents)}. Les coordonnées sont
                  disponibles dès maintenant.
                </p>

                {order.invoiceNumber && (
                  <p className="mt-4 rounded-field bg-surface-muted px-3 py-2.5 text-sm text-ink-soft">
                    Facture <strong>{order.invoiceNumber}</strong>
                  </p>
                )}

                <ButtonLink href="/mes-leads" size="lg" className="mt-7 w-full">
                  Voir mes leads
                </ButtonLink>
              </>
            ) : (
              <>
                <h1 className="section-title">Paiement en cours de confirmation</h1>
                <p className="mt-3 text-ink-soft">
                  Votre règlement est en cours de traitement. Vos leads
                  apparaîtront dans votre espace dès sa confirmation — vous pouvez
                  fermer cette page sans risque.
                </p>
                <ButtonLink href="/mes-leads" variant="secondary" className="mt-7 w-full">
                  Aller à mes leads
                </ButtonLink>
              </>
            )}
          </Card>
        </Container>
      </main>
    </>
  );
}
