import type { Metadata } from 'next';
import Link from 'next/link';
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

/**
 * Gabarit de l'administration.
 *
 * L'accès n'est pas encore protégé : la vérification du rôle admin arrive avec
 * Firebase Auth en phase 2. Le bandeau le rappelle explicitement pour que
 * personne ne déploie cet écran en l'état.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

      <div className="border-b border-danger/30 bg-danger-tint">
        <Container className="py-2.5">
          <p className="text-sm text-danger">
            <strong>Accès non protégé.</strong> L’authentification et la vérification
            du rôle administrateur seront branchées en phase 2, avant toute mise en
            ligne.
          </p>
        </Container>
      </div>

      <main className="py-10">
        <Container>{children}</Container>
      </main>
    </div>
  );
}
