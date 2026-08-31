import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Card, Container } from '@/components/ui/Card';
import { currentUser } from '@/lib/firebase/session';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Accédez à votre compte professionnel Akizit.',
  robots: { index: false },
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const { suite } = await searchParams;
  const user = await currentUser();

  // Déjà connecté : on renvoie vers la destination voulue, ou l'onboarding
  // s'il reste à faire.
  if (user) {
    redirect(user.onboarded ? (suite ?? '/leads') : '/onboarding');
  }

  return (
    <>
      <MarketingHeader />
      <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-surface-muted py-12">
        <Container className="max-w-md">
          <Card className="p-8">
            <h1 className="section-title text-center">Espace professionnel</h1>
            <p className="mt-3 text-center text-ink-soft">
              Connectez-vous avec Google pour accéder aux leads disponibles.
            </p>

            <div className="mt-8">
              <GoogleSignInButton suite={suite} />
            </div>

            <div className="mt-7 border-t border-line pt-5">
              <p className="text-sm font-semibold">Plateforme réservée aux pros</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Un numéro SIRET valide vous sera demandé après la connexion. Il est
                vérifié avant tout achat.
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-ink-faint">
              En continuant, vous acceptez nos{' '}
              <Link href="/cgv" className="underline underline-offset-2 hover:text-brand">
                CGV
              </Link>{' '}
              et notre{' '}
              <Link
                href="/politique-confidentialite"
                className="underline underline-offset-2 hover:text-brand"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </Card>
        </Container>
      </main>
    </>
  );
}
