import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/guards';
import { isAdminConfigured } from '@/lib/firebase/admin';
import { Container } from '@/components/ui/Card';
import { Logo } from '@/components/layout/MarketingHeader';

export const metadata: Metadata = {
  title: { default: 'Administration', template: '%s · Admin Akizit' },
  // L'espace d'administration ne doit jamais être indexé.
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/leads/nouveau', label: 'Ajouter' },
  { href: '/admin/import', label: 'Import JSON' },
] as const;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Gabarit de l'administration.
 *
 * L'accès exige le rôle `admin`, vérifié avec checkRevoked : le coût d'un
 * aller-retour réseau est négligeable face au risque qu'un accès retiré reste
 * actif jusqu'à l'expiration du cookie.
 *
 * Sans backend configuré, la garde est inopérante : on l'annonce alors
 * clairement plutôt que de laisser croire à une protection inexistante.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (isAdminConfigured()) await requireAdmin();
  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-line bg-surface">
        <Container className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-ink-soft">
              Admin
            </span>
          </div>

          <nav className="flex items-center gap-5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>
      </header>

      {!isAdminConfigured() && (
        <div className="border-b border-danger/30 bg-danger-tint">
          <Container className="py-2.5">
            <p className="text-sm text-danger">
              <strong>Accès non protégé.</strong> Backend non configuré sur cet
              environnement : la vérification du rôle administrateur est inactive.
              Ne déployez pas en l’état.
            </p>
          </Container>
        </div>
      )}

      <main className="py-10">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
