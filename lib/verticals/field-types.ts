/**
 * Définitions de champs métier.
 *
 * Une verticale n'est pas sept composants, c'est une donnée : un tableau de
 * définitions de champs décrit à la fois la fiche lead, le formulaire admin et
 * le schéma de validation. Ajouter une verticale ne demande donc aucun
 * composant nouveau.
 *
 * Ce module ne dépend de rien (surtout pas de Zod) afin d'être importable
 * depuis un composant client sans embarquer la librairie de validation.
 */

export type FieldKind = 'enum' | 'number' | 'boolean' | 'year' | 'surface';

/**
 * Signal de qualité porté par un champ.
 *
 * Déclaré à côté de la définition du champ, jamais dans une table séparée :
 * ajouter un champ à une verticale sans se demander ce qu'il vaut
 * commercialement est précisément l'erreur qu'on veut rendre impossible.
 *
 * Le score obtenu sert à moduler le prix du lead (voir lib/pricing/quality.ts).
 */
export type QualitySignal = {
  /** Poids du champ. Le total des poids d'une verticale sert de dénominateur. */
  weight: number;
  /** Traduction de la valeur du champ en contribution normalisée [0, 1]. */
  score:
    | { kind: 'map'; values: Record<string, number> }
    | { kind: 'bool'; whenTrue: number; whenFalse: number }
    | { kind: 'range'; at: number; to: number };
  /**
   * Contribution quand le champ est absent (optionnel non renseigné).
   * Par défaut 0 : un dossier incomplet est décoté, jamais neutre.
   */
  whenMissing?: number;
};

type BaseField = {
  key: string;
  label: string;
  help?: string;
  required: boolean;
  /**
   * Champ visible dans la vitrine, avant achat.
   *
   * Ne jamais passer à `true` un champ qui, combiné aux autres, permettrait
   * d'identifier ou de recontacter le prospect sans payer.
   */
  showInPreview: boolean;
  /** Absent = le champ ne participe pas au score de qualité. */
  quality?: QualitySignal;
};

export type EnumField = BaseField & {
  kind: 'enum';
  options: readonly { value: string; label: string }[];
};

export type NumberField = BaseField & {
  kind: 'number';
  min: number;
  max: number;
  unit?: string;
};

export type BooleanField = BaseField & { kind: 'boolean' };

export type YearField = BaseField & { kind: 'year'; min: number; max: number };

export type SurfaceField = BaseField & {
  kind: 'surface';
  min: number;
  max: number;
};

/**
 * Il n'existe volontairement PAS de champ texte libre.
 *
 * Un champ « précisions du client » finirait tôt ou tard par contenir un
 * numéro de téléphone ou un nom, qui serait alors publié dans la vitrine
 * consultable avant achat. Restreindre les types disponibles rend cette fuite
 * structurellement impossible plutôt que de compter sur la vigilance à la
 * saisie.
 */
export type FieldDef =
  | EnumField
  | NumberField
  | BooleanField
  | YearField
  | SurfaceField;

/** Libellé lisible d'une valeur d'énumération, pour l'affichage. */
export function labelOf(
  fields: readonly FieldDef[],
  key: string,
  value: unknown,
): string {
  const field = fields.find((f) => f.key === key);
  if (!field || field.kind !== 'enum') return String(value ?? '');
  return field.options.find((o) => o.value === value)?.label ?? String(value ?? '');
}

/** Rendu d'une valeur de champ, unité comprise. */
export function formatFieldValue(field: FieldDef, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';

  switch (field.kind) {
    case 'enum':
      return field.options.find((o) => o.value === value)?.label ?? String(value);
    case 'boolean':
      return value ? 'Oui' : 'Non';
    case 'surface':
      return `${value} m²`;
    case 'year':
      return String(value);
    case 'number':
      return field.unit ? `${value} ${field.unit}` : String(value);
  }
}
