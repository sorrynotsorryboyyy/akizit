import Link from 'next/link';
import { Container } from '@/components/ui/Card';
import { SITE } from '@/lib/site-config';
import { VERTICAL_LIST } from '@/lib/verticals/registry';

const LEGAL = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgv', label: 'CGV' },
  { href: '/politique-confidentialite', label: 'Confidentialité' },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-surface-muted py-14">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-bold tracking-tight">{SITE.name}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
              {SITE.tagline}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Verticales</p>
            <ul className="mt-3 space-y-2">
              {VERTICAL_LIST.map((v) => (
                <li key={v.key}>
                  <Link
                    href={`/verticales/${v.slug}`}
                    className="text-sm text-ink-soft transition-colors hover:text-brand"
                  >
                    {v.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Plateforme</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/carte" className="text-sm text-ink-soft hover:text-brand">
                  Leads disponibles
                </Link>
              </li>
              <li>
                <Link
                  href="/comment-ca-marche"
                  className="text-sm text-ink-soft hover:text-brand"
                >
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="text-sm text-ink-soft hover:text-brand">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Légal</p>
            <ul className="mt-3 space-y-2">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-soft hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </p>
          <p>Plateforme réservée aux professionnels.</p>
        </div>
      </Container>
    </footer>
  );
}
