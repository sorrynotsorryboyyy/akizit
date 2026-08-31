import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { Button } from '@/components/ui/Button';
import { Card, Container } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Accédez à votre compte professionnel Akizit.',
  robots: { index: false },
};

/**
 * Écran de connexion.
 *
 * Le bouton est inactif tant que Firebase Auth n'est pas branché (phase 2).
 * L'écran est construit dès maintenant pour que le parcours soit navigable et
 * que la mise en place de l'authentification ne demande qu'à remplacer le
 * gestionnaire de clic.
 */
export default function ConnexionPage() {
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

            <Button variant="secondary" size="lg" className="mt-8 w-full" disabled>
              <GoogleIcon />
              Continuer avec Google
            </Button>

            <p className="mt-4 rounded-field bg-surface-sunken px-3 py-2.5 text-center text-xs text-ink-soft">
              Authentification en cours d’installation. Elle sera active à la mise en
              ligne.
            </p>

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.6 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.6 0 3.7 2.6 1.8 6.4l3.8 3c.9-2.7 3.4-4.6 6.4-4.6z"
      />
    </svg>
  );
}
