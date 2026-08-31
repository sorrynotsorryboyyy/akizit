import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Card';
import { SITE } from '@/lib/site-config';

const NAV = [
  { href: '/leads', label: 'Leads disponibles' },
  { href: '/comment-ca-marche', label: 'Comment ça marche' },
  { href: '/tarifs', label: 'Tarifs' },
] as const;

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={['flex items-center gap-2 font-bold tracking-tight', className]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Marqueur de lieu : le produit est géographique avant tout. */}
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"
          fill="var(--color-brand)"
        />
        <circle cx="12" cy="9" r="2.6" fill="#fff" />
      </svg>
      <span className="text-lg">{SITE.name}</span>
    </Link>
  );
}

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.9375rem] font-medium text-ink-soft transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/connexion" variant="ghost" size="sm">
            Connexion
          </ButtonLink>
          <ButtonLink href="/leads" size="sm" className="hidden xs:inline-flex">
            Voir les leads
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
