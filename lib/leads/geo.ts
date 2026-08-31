/**
 * Positionnement approximatif des leads sur la carte.
 *
 * Publier la position réelle d'un prospect reviendrait à désigner son domicile
 * à tout visiteur, avant même le moindre achat. On ne stocke donc jamais le
 * point d'origine dans le document public : la position affichée est celle du
 * centroïde de la commune, décalée d'un bruit déterministe.
 *
 * Le bruit est DÉTERMINISTE (dérivé de l'identifiant du lead) pour deux
 * raisons : un marqueur qui saute d'un chargement à l'autre trahirait son
 * caractère approximatif, et deux leads d'une même commune doivent rester
 * distinguables au lieu de se superposer exactement.
 */

export type Coordinates = { lat: number; lng: number };

/** Hachage 32 bits stable (FNV-1a), suffisant pour dériver un décalage. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Rayon du brouillage, en degrés (~1,1 km de latitude). */
const JITTER_DEGREES = 0.01;

export function jitterCoordinates(
  center: Coordinates,
  seed: string,
  radius = JITTER_DEGREES,
): Coordinates {
  const h = hash32(seed);

  // Deux composantes indépendantes tirées du même hachage.
  const angle = ((h & 0xffff) / 0xffff) * Math.PI * 2;
  const distance = (((h >>> 16) & 0xffff) / 0xffff) * radius;

  // La longitude se resserre avec la latitude : sans ce facteur, le décalage
  // est visiblement plus large dans le nord de la France que dans le sud.
  const latRad = (center.lat * Math.PI) / 180;
  const lngScale = Math.max(0.2, Math.cos(latRad));

  return {
    lat: round6(center.lat + Math.sin(angle) * distance),
    lng: round6(center.lng + (Math.cos(angle) * distance) / lngScale),
  };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Le département se lit sur le code postal, Corse comprise (2A / 2B). */
export function departementFromPostalCode(postalCode: string): string {
  const prefix = postalCode.slice(0, 2);
  if (prefix === '20') return '2A';
  if (postalCode.startsWith('97') || postalCode.startsWith('98')) {
    return postalCode.slice(0, 3);
  }
  return prefix;
}
