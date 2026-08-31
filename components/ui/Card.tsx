import type { ReactNode } from 'react';

/** Carte à ombre douce et bordure fine — jamais d'ombre marquée. */
export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'li';
}) {
  return (
    <Tag
      className={[
        'rounded-card border border-line bg-surface shadow-card',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'accent' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-surface-sunken text-ink-soft',
    brand: 'bg-brand-tint text-brand',
    accent: 'bg-accent-tint text-accent',
    danger: 'bg-danger-tint text-danger',
  } as const;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}

/** Conteneur de page : une seule largeur maximale pour tout le site. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={['mx-auto w-full max-w-6xl px-5 sm:px-8', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

/**
 * Section rythmée.
 *
 * L'alternance blanc / teinte est ce qui donne le rythme HubSpot à la page,
 * sans recourir à des bordures qui alourdiraient la lecture.
 */
export function Section({
  children,
  tone = 'surface',
  className,
  id,
}: {
  children: ReactNode;
  tone?: 'surface' | 'muted' | 'tint' | 'inverse';
  className?: string;
  id?: string;
}) {
  const tones = {
    surface: 'bg-surface',
    muted: 'bg-surface-muted',
    tint: 'bg-brand-tint',
    inverse: 'bg-surface-inverse text-ink-inverse',
  } as const;

  return (
    <section id={id} className={[tones[tone], 'py-20 sm:py-28', className].filter(Boolean).join(' ')}>
      <Container>{children}</Container>
    </section>
  );
}
