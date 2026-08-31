import { remainingSlots } from './exclusivity';
import { computeDynamicPrice } from '../pricing/dynamic';
import type { LeadDoc, LeadPublic } from './types';

/**
 * Projection vers le navigateur.
 *
 * Règle unique et non négociable : ce fichier construit l'objet champ par
 * champ, en liste blanche. Aucun `...doc`, aucun `delete doc.telephone`.
 *
 * Un `delete` oublié envoie la donnée sensible au navigateur ; une ligne
 * oubliée dans une liste blanche ne fait que retirer un champ d'affichage,
 * défaut visible immédiatement et sans conséquence. C'est la seule asymétrie
 * qui compte ici.
 */
export function toPublicLead(
  doc: LeadDoc,
  options: { ownedByCurrentUser?: boolean; now: number },
): LeadPublic {
  // Le prix est calculé ICI, à l'unique frontière entre la base et le
  // navigateur : liste, fiche, panier et « mes leads » restent ainsi
  // cohérents sans que chacun ait à y penser.
  const pricing = computeDynamicPrice(doc, options.now);

  return {
    id: doc.id,
    vertical: doc.vertical,
    source: doc.source,

    postalCode: doc.postalCode,
    city: doc.city,
    departement: doc.departement,
    region: doc.region,
    lat: doc.lat,
    lng: doc.lng,

    basePriceCents: doc.basePriceCents,
    qualityScore: doc.qualityScore,
    priceCents: pricing.priceCents,
    pricing,
    requestType: doc.requestType,
    maxBuyers: doc.maxBuyers,
    soldCount: doc.soldCount,
    status: doc.status,

    data: doc.data,
    summary: doc.summary,

    capturedAtMs: doc.capturedAtMs,
    createdAtMs: doc.createdAtMs,

    remainingSlots: remainingSlots(doc.soldCount, doc.maxBuyers),
    owned: options.ownedByCurrentUser ?? false,
  };
}

/**
 * Indice de contact affiché avant achat (« 06 ** ** ** 42 »).
 *
 * Calculé côté serveur et jamais stocké en clair dans la vitrine. Les quatre
 * derniers caractères suffisent à rendre le lead crédible sans permettre de
 * recomposer le numéro.
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '•• •• •• •• ••';
  const head = digits.startsWith('33') ? `0${digits.slice(2, 3)}` : digits.slice(0, 2);
  return `${head} ** ** ** ${digits.slice(-2)}`;
}

/** Idem pour l'e-mail : « m****@gmail.com ». */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '•••••';
  return `${local.slice(0, 1)}${'*'.repeat(Math.max(3, local.length - 1))}@${domain}`;
}
