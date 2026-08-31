import 'server-only';
import { leadInputSchema } from './schema';
import { resolveMaxBuyers } from './exclusivity';
import { findCommune } from './communes';
import { departementFromPostalCode, jitterCoordinates } from './geo';
import { VERTICALS } from '../verticals/registry';
import { computeQualityScore } from '../pricing/quality';
import type { LeadContactDoc, LeadDoc } from './types';

/**
 * Import de leads en masse.
 *
 * Deux garanties portées par ce module :
 *
 *  1. La validation est par ligne : un lot de 500 leads dont trois sont
 *     invalides importe les 497 autres et rend un rapport précis, plutôt que
 *     de tout rejeter en bloc.
 *  2. La séparation vitrine / contact est faite ICI, une fois pour toutes.
 *     L'appelant reçoit deux documents distincts et ne peut pas les confondre.
 */

export type ImportRowError = {
  index: number;
  path: string;
  message: string;
};

export type ImportResult = {
  valid: { lead: LeadDoc; contact: LeadContactDoc }[];
  errors: ImportRowError[];
};

/** Rétention par défaut d'un lead invendu, en jours. */
const DEFAULT_RETENTION_DAYS = 180;

export function parseLeadImport(
  rows: unknown,
  options: { idPrefix?: string; now?: number } = {},
): ImportResult {
  const now = options.now ?? Date.now();
  const prefix = options.idPrefix ?? 'lead';

  if (!Array.isArray(rows)) {
    return {
      valid: [],
      errors: [
        { index: -1, path: '', message: 'Le fichier doit contenir un tableau de leads.' },
      ],
    };
  }

  const valid: ImportResult['valid'] = [];
  const errors: ImportRowError[] = [];

  rows.forEach((row, index) => {
    const parsed = leadInputSchema.safeParse(row);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          index,
          path: issue.path.join('.') || '(racine)',
          message: issue.message,
        });
      }
      return;
    }

    const input = parsed.data as Record<string, never>;
    const id = `${prefix}-${String(index + 1).padStart(5, '0')}`;

    valid.push(buildDocuments(id, input, now));
  });

  return { valid, errors };
}

function buildDocuments(
  id: string,
  input: Record<string, never>,
  now: number,
): { lead: LeadDoc; contact: LeadContactDoc } {
  const vertical = input.vertical as unknown as LeadDoc['vertical'];
  const def = VERTICALS[vertical];

  const postalCode = input.codePostal as unknown as string;
  const city = input.ville as unknown as string;
  const commune = findCommune(postalCode);

  // Position affichée : centroïde de commune bruité, jamais l'adresse réelle.
  // Le floutage a lieu à l'écriture — une donnée jamais stockée ne peut pas
  // fuiter, quel que soit le code d'affichage écrit plus tard.
  const center = commune ?? { lat: 46.6, lng: 2.45 };
  const { lat, lng } = jitterCoordinates(center, id);

  const requestType = input.requestType as unknown as LeadDoc['requestType'];
  const maxBuyers = resolveMaxBuyers(
    requestType,
    input.maxBuyers as unknown as 1 | 2 | 3 | undefined,
  );

  const data = input.data as unknown as Record<string, unknown>;
  const capturedAt = input.capturedAt as unknown as Date;
  const contactInput = input.contact as unknown as Record<string, unknown>;

  const lead: LeadDoc = {
    id,
    vertical,
    source: input.source as unknown as string,
    postalCode,
    city,
    departement: commune?.departement ?? departementFromPostalCode(postalCode),
    region: commune?.region ?? '',
    lat,
    lng,
    basePriceCents: (input.priceCents as unknown as number) ?? def.defaultPriceCents,
    qualityScore: computeQualityScore(vertical, data).score,
    requestType,
    maxBuyers,
    soldCount: 0,
    status: 'available',
    reservedBy: null,
    reservedUntilMs: null,
    data,
    summary: def.buildSummary(data),
    capturedAtMs: capturedAt.getTime(),
    createdAtMs: now,
  };

  const consent = contactInput.consentement as {
    collecteLe: Date;
    urlSource: string;
    ip?: string;
  };

  const contact: LeadContactDoc = {
    leadId: id,
    prenom: contactInput.prenom as string,
    nom: contactInput.nom as string,
    telephone: normalizePhone(contactInput.telephone as string),
    email: (contactInput.email as string).toLowerCase(),
    adresse: contactInput.adresse as string | undefined,
    codePostalExact: contactInput.codePostalExact as string,
    villeExacte: contactInput.villeExacte as string,
    notes: contactInput.notes as string | undefined,
    buyerIds: [],
    consentement: {
      collecteLeMs: consent.collecteLe.getTime(),
      urlSource: consent.urlSource,
      ip: consent.ip,
    },
    purgeAfterMs: now + DEFAULT_RETENTION_DAYS * 86_400_000,
  };

  return { lead, contact };
}

/** Normalisation E.164 : le même numéro doit avoir une seule écriture. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+33')) return digits;
  if (digits.startsWith('0')) return `+33${digits.slice(1)}`;
  return digits;
}
