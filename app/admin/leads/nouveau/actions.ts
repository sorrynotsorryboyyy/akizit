'use server';

import { parseLeadImport, type ImportRowError } from '@/lib/leads/import';

export type CreateLeadResult =
  | { ok: true; summary: string; ville: string; maxBuyers: number }
  | { ok: false; errors: ImportRowError[] };

/**
 * Création manuelle d'un lead.
 *
 * Passe par exactement le même chemin de validation que l'import JSON : un
 * seul jeu de règles, donc pas de divergence possible entre les deux portes
 * d'entrée. La persistance arrive en phase 2.
 */
export async function createLeadAction(payload: unknown): Promise<CreateLeadResult> {
  const result = parseLeadImport([payload], { idPrefix: 'manuel' });

  if (result.errors.length > 0 || result.valid.length === 0) {
    return { ok: false, errors: result.errors };
  }

  const { lead } = result.valid[0];
  return {
    ok: true,
    summary: lead.summary,
    ville: lead.city,
    maxBuyers: lead.maxBuyers,
  };
}
