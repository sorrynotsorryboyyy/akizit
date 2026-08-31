import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { Card, Container } from '@/components/ui/Card';
import { SimulationForm } from './SimulationForm';
import { verifyMockToken } from '@/lib/payments/mock';
import { isMockPayment } from '@/lib/payments';
import { formatEuros } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Simulation de paiement',
  robots: { index: false },
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Page de simulation de paiement.
 *
 * Elle reproduit le retour depuis un prestataire réel : récapitulatif du
 * montant puis confirmation. Quand Stripe sera actif, cette page devient
 * inaccessible et la redirection pointe vers Stripe Checkout.
 */
export default async function SimulationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; suite?: string }>;
}) {
  if (!isMockPayment()) redirect('/panier');

  const { token, suite } = await searchParams;
  const verified = token ? verifyMockToken(token) : null;

  if (!verified) {
    return (
      <>
        <MarketingHeader />
        <main className="grid min-h-[60vh] place-items-center bg-surface-muted py-12">
          <Container className="max-w-md">
            <Card className="p-8 text-center">
              <h1 className="section-title">Lien de paiement invalide</h1>
              <p className="mt-3 text-ink-soft">
                Ce lien a expiré ou n’est pas valide. Reprenez depuis votre panier.
              </p>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <MarketingHeader />
      <main className="grid min-h-[70vh] place-items-center bg-surface-muted py-12">
        <Container className="max-w-md">
          <Card className="p-8">
            <p className="rounded-field bg-accent-tint px-3 py-2.5 text-center text-sm font-medium text-accent">
              Environnement de développement — aucun paiement réel
            </p>

            <h1 className="section-title mt-6 text-center">Confirmer le paiement</h1>

            <div className="mt-6 rounded-field bg-surface-muted p-5 text-center">
              <p className="text-sm text-ink-soft">Montant à régler</p>
              <p className="mt-1 text-3xl font-bold text-ink">
                {formatEuros(verified.amountCents)}
              </p>
              <p className="mt-1 text-xs text-ink-faint">TTC · commande {verified.orderId}</p>
            </div>

            <div className="mt-7">
              <SimulationForm token={token!} suite={suite} />
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-ink-faint">
              En production, cette étape se déroulera sur la page sécurisée de
              Stripe. Le déblocage des coordonnées suit exactement le même chemin.
            </p>
          </Card>
        </Container>
      </main>
    </>
  );
}
