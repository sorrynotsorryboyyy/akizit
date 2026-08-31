'use server';

import { parseLeadImport, type ImportRowError } from '@/lib/leads/import';

export type ImportReport = {
  ok: boolean;
  total: number;
  imported: number;
  rejected: number;
  errors: ImportRowError[];
  /** Aperçu des leads acceptés, sans aucune donnée de contact. */
  preview: { id: string; vertical: string; ville: string; summary: string }[];
  message?: string;
};

/**
 * Validation d'un import JSON.
 *
 * La persistance arrive en phase 2 : pour l'instant l'action valide, sépare
 * vitrine et coordonnées, puis rend un rapport. Le parcours de validation est
 * donc déjà celui de la production, ce qui permet de corriger les fichiers
 * d'export des sites sources dès maintenant.
 *
 * L'aperçu renvoyé au navigateur est construit champ par champ : même dans un
 * écran d'administration, les coordonnées ne traversent pas le réseau sans
 * raison.
 */
export async function validateImportAction(raw: string): Promise<ImportReport> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      total: 0,
      imported: 0,
      rejected: 0,
      errors: [],
      preview: [],
      message: `JSON invalide : ${(error as Error).message}`,
    };
  }

  // Accepte aussi bien un tableau nu qu'un objet { leads: [...] }, les deux
  // formes se rencontrant selon l'outil qui produit l'export.
  const rows =
    Array.isArray(parsed) ||
    typeof parsed !== 'object' ||
    parsed === null ||
    !('leads' in parsed)
      ? parsed
      : (parsed as { leads: unknown }).leads;

  const result = parseLeadImport(rows, { idPrefix: 'import' });
  const total = Array.isArray(rows) ? rows.length : 0;

  return {
    ok: result.errors.length === 0,
    total,
    imported: result.valid.length,
    rejected: total - result.valid.length,
    errors: result.errors.slice(0, 100),
    preview: result.valid.slice(0, 10).map(({ lead }) => ({
      id: lead.id,
      vertical: lead.vertical,
      ville: lead.city,
      summary: lead.summary,
    })),
  };
}
