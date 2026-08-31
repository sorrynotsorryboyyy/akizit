import type { FieldDef } from './field-types';
import { labelOf } from './field-types';
import { chauffageFields } from './fields/chauffage';
import { resiliationFields } from './fields/resiliation';
import { pacFields } from './fields/pac';
import { peintureFields } from './fields/peinture';
import { toitureFields } from './fields/toiture';
import { panneauxSolairesFields } from './fields/panneaux-solaires';
import { plomberieFields } from './fields/plomberie';

/**
 * Registre des verticales.
 *
 * Ce module est volontairement dépourvu de Zod : il est importé par des
 * composants client (filtres de carte, badges, formulaire admin) et embarquer
 * la librairie de validation dans le bundle navigateur serait inutile. La
 * validation vit dans ./schemas.ts, marqué `server-only`.
 */

export const VERTICAL_KEYS = [
  'chauffage',
  'resiliation',
  'pac',
  'peinture',
  'toiture',
  'panneaux_solaires',
  'plomberie',
] as const;

export type Vertical = (typeof VERTICAL_KEYS)[number];

export type VerticalDef = {
  key: Vertical;
  label: string;
  /** Utilisé dans les badges et les filtres, où la place manque. */
  shortLabel: string;
  slug: string;
  description: string;
  /** Teinte du marqueur sur la carte. Une couleur par verticale. */
  color: string;
  /** Prix de base en centimes, surchargeable lead par lead. */
  defaultPriceCents: number;
  fields: readonly FieldDef[];
  /**
   * Résumé affiché avant achat.
   *
   * Généré à partir des champs typés, jamais recopié d'une saisie libre :
   * c'est ce qui garantit qu'aucune donnée identifiante n'atteint la vitrine.
   */
  buildSummary: (data: Record<string, unknown>) => string;
};

export const VERTICALS: Record<Vertical, VerticalDef> = {
  chauffage: {
    key: 'chauffage',
    label: 'Chauffage',
    shortLabel: 'Chauffage',
    slug: 'chauffage',
    description:
      'Remplacement et installation de systèmes de chauffage, tous types d’énergie.',
    color: '#b4462a',
    defaultPriceCents: 3500,
    fields: chauffageFields,
    buildSummary: (d) =>
      `${labelOf(chauffageFields, 'typeProjet', d.typeProjet)} — ` +
      `${labelOf(chauffageFields, 'energieActuelle', d.energieActuelle)}, ${d.surfaceM2} m²`,
  },

  resiliation: {
    key: 'resiliation',
    label: 'Résiliation de contrat',
    shortLabel: 'Résiliation',
    slug: 'resiliation',
    description:
      'Particuliers cherchant à résilier un contrat en cours et à changer de fournisseur.',
    color: '#4a5f57',
    defaultPriceCents: 1200,
    fields: resiliationFields,
    buildSummary: (d) =>
      `${labelOf(resiliationFields, 'typeContrat', d.typeContrat)} — ` +
      `${labelOf(resiliationFields, 'operateurActuel', d.operateurActuel)}, ${d.montantMensuel} €/mois`,
  },

  pac: {
    key: 'pac',
    label: 'Pompe à chaleur',
    shortLabel: 'PAC',
    slug: 'pompe-a-chaleur',
    description:
      'Projets d’installation de pompe à chaleur air/eau, air/air ou géothermique.',
    color: '#0b6b4f',
    defaultPriceCents: 4500,
    fields: pacFields,
    buildSummary: (d) =>
      `PAC ${labelOf(pacFields, 'typePac', d.typePac)} — ${d.surfaceM2} m², ` +
      `remplace ${labelOf(pacFields, 'chauffageActuel', d.chauffageActuel)}`,
  },

  peinture: {
    key: 'peinture',
    label: 'Peinture',
    shortLabel: 'Peinture',
    slug: 'peinture',
    description:
      'Travaux de peinture intérieure, extérieure et ravalement de façade.',
    color: '#1a8a68',
    defaultPriceCents: 2500,
    fields: peintureFields,
    buildSummary: (d) =>
      `Peinture ${labelOf(peintureFields, 'typeTravaux', d.typeTravaux)} — ${d.surfaceM2} m²`,
  },

  toiture: {
    key: 'toiture',
    label: 'Toiture',
    shortLabel: 'Toiture',
    slug: 'toiture',
    description:
      'Réfection, réparation, nettoyage et isolation de toiture.',
    color: '#b8791f',
    defaultPriceCents: 4000,
    fields: toitureFields,
    buildSummary: (d) =>
      `${labelOf(toitureFields, 'typeIntervention', d.typeIntervention)} — ` +
      `${labelOf(toitureFields, 'typeCouverture', d.typeCouverture)}, ${d.surfaceM2} m²`,
  },

  panneaux_solaires: {
    key: 'panneaux_solaires',
    label: 'Panneaux solaires',
    shortLabel: 'Solaire',
    slug: 'panneaux-solaires',
    description:
      'Installation photovoltaïque et solaire thermique, autoconsommation ou revente.',
    color: '#085840',
    defaultPriceCents: 5000,
    fields: panneauxSolairesFields,
    buildSummary: (d) =>
      `${labelOf(panneauxSolairesFields, 'typeInstallation', d.typeInstallation)} — ` +
      `${labelOf(panneauxSolairesFields, 'objectif', d.objectif)}, ${d.surfaceToitureM2} m² de toiture`,
  },

  plomberie: {
    key: 'plomberie',
    label: 'Plomberie',
    shortLabel: 'Plomberie',
    slug: 'plomberie',
    description:
      'Dépannage, rénovation de sanitaires et travaux de plomberie.',
    color: '#2f6f8f',
    defaultPriceCents: 2000,
    fields: plomberieFields,
    buildSummary: (d) =>
      `${labelOf(plomberieFields, 'typeIntervention', d.typeIntervention)}` +
      (d.urgence ? ' — urgent' : ''),
  },
};

/** Ordre d'affichage stable, pour les grilles et les filtres. */
export const VERTICAL_LIST: readonly VerticalDef[] = VERTICAL_KEYS.map(
  (k) => VERTICALS[k],
);

export function isVertical(value: unknown): value is Vertical {
  return (
    typeof value === 'string' && (VERTICAL_KEYS as readonly string[]).includes(value)
  );
}

export function verticalBySlug(slug: string): VerticalDef | undefined {
  return VERTICAL_LIST.find((v) => v.slug === slug);
}
