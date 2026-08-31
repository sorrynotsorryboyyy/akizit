import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { OnboardingForm } from '@/components/auth/OnboardingForm';
import { Card, Container } from '@/components/ui/Card';
import { currentUser } from '@/lib/firebase/session';

export const metadata: Metadata = {
  title: 'Activer mon compte',
  robots: { index: false },
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;
  const user = await currentUser();

  // Sans session, le formulaire n'aurait rien à rattacher.
  if (!user) {
    redirect(`/connexion${suite ? `?suite=${encodeURIComponent(suite)}` : ''}`);
  }

  // Compte déjà activé : inutile de repasser par là.
  if (user.onboarded) redirect(suite ?? '/carte');

  return (
    <>
      <MarketingHeader />
      <main className="bg-surface-muted py-12">
        <Container className="max-w-lg">
          <Card className="p-8">
            <h1 className="section-title">Activer votre compte</h1>
            <p className="mt-3 text-ink-soft">
              Akizit est réservé aux professionnels. Ces informations sont
              nécessaires pour établir vos factures.
            </p>

            {user.email && (
              <p className="mt-4 rounded-field bg-brand-tint px-3 py-2.5 text-sm text-brand">
                Connecté en tant que <strong>{user.email}</strong>
              </p>
            )}

            <div className="mt-7">
              <OnboardingForm suite={suite} />
            </div>
          </Card>
        </Container>
      </main>
    </>
  );
}
