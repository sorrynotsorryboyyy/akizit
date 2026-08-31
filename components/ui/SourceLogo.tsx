'use client';

import Image from 'next/image';
import { useState } from 'react';

/**
 * Logo d'un site d'acquisition, avec repli typographique.
 *
 * Le fichier n'existe pas forcément encore : plutôt que d'afficher une image
 * cassée ou un espace vide, on rend le nom du site en typographie soignée. Le
 * jour où le SVG est déposé dans `public/logos/sources/`, il s'affiche sans
 * qu'aucune ligne de code ne change.
 *
 * Le repli se déclenche sur l'événement `onError` : c'est le navigateur qui
 * nous dit que le fichier manque, on n'a donc rien à vérifier côté serveur.
 */
export function SourceLogo({
  domain,
  label,
  className,
  height = 28,
}: {
  /** Domaine complet, ex. « masolutionchaleur.fr ». */
  domain: string;
  /** Nom lisible, affiché en repli. */
  label: string;
  className?: string;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);

  // Le fichier porte le domaine sans son extension : masolutionchaleur.svg
  const slug = domain.replace(/\.[a-z.]+$/i, '');

  if (failed) {
    return (
      <span
        className={['font-bold tracking-tight text-ink', className]
          .filter(Boolean)
          .join(' ')}
        style={{ fontSize: height * 0.6 }}
      >
        {label}
      </span>
    );
  }

  return (
    <Image
      src={`/logos/sources/${slug}.svg`}
      alt={label}
      height={height}
      width={height * 4}
      onError={() => setFailed(true)}
      className={['h-auto w-auto object-contain', className]
        .filter(Boolean)
        .join(' ')}
      style={{ maxHeight: height }}
      unoptimized
    />
  );
}
