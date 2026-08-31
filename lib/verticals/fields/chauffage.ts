import type { FieldDef } from '../field-types';

/**
 * Chauffage — leads issus de masolutionchaleur.fr.
 *
 * `as const satisfies` est le pivot du typage : `satisfies` valide la forme
 * contre FieldDef, tandis que `as const` préserve les littéraux, ce qui permet
 * d'inférer automatiquement le type des données (voir ../types.ts).
 */
export const chauffageFields = [
  {
    key: 'energieActuelle',
    kind: 'enum',
    label: 'Énergie actuelle',
    required: true,
    showInPreview: true,
    options: [
      { value: 'fioul', label: 'Fioul' },
      { value: 'gaz', label: 'Gaz' },
      { value: 'electrique', label: 'Électrique' },
      { value: 'bois', label: 'Bois' },
      { value: 'autre', label: 'Autre' },
    ],
  },
  {
    key: 'typeProjet',
    kind: 'enum',
    label: 'Type de projet',
    required: true,
    showInPreview: true,
    quality: { weight: 15, score: { kind: 'map', values: { remplacement: 1, installation: 0.9, entretien: 0.2 } } },
    options: [
      { value: 'remplacement', label: 'Remplacement' },
      { value: 'installation', label: 'Première installation' },
      { value: 'entretien', label: 'Entretien' },
    ],
  },
  {
    key: 'surfaceM2',
    kind: 'surface',
    label: 'Surface à chauffer',
    required: true,
    showInPreview: true,
    quality: { weight: 10, score: { kind: 'range', at: 40, to: 200 } },
    min: 10,
    max: 1000,
  },
  {
    key: 'typeLogement',
    kind: 'enum',
    label: 'Type de logement',
    required: true,
    showInPreview: true,
    options: [
      { value: 'maison', label: 'Maison' },
      { value: 'appartement', label: 'Appartement' },
    ],
  },
  {
    key: 'proprietaire',
    kind: 'boolean',
    label: 'Propriétaire du logement',
    required: true,
    showInPreview: true,
    quality: { weight: 30, score: { kind: 'bool', whenTrue: 1, whenFalse: 0 } },
    help: "Un locataire ne peut pas engager de travaux : l'information est décisive.",
  },
  {
    key: 'delaiProjet',
    kind: 'enum',
    label: 'Délai du projet',
    required: true,
    showInPreview: true,
    quality: { weight: 25, score: { kind: 'map', values: { immediat: 1, moins_3_mois: 0.7, moins_6_mois: 0.35, reflexion: 0.05 } } },
    options: [
      { value: 'immediat', label: 'Immédiat' },
      { value: 'moins_3_mois', label: 'Moins de 3 mois' },
      { value: 'moins_6_mois', label: 'Moins de 6 mois' },
      { value: 'reflexion', label: 'En réflexion' },
    ],
  },
  {
    key: 'anneeConstruction',
    kind: 'year',
    label: 'Année de construction',
    required: false,
    showInPreview: false,
    min: 1800,
    max: 2026,
  },
  {
    key: 'budgetEstime',
    kind: 'enum',
    label: 'Budget estimé',
    required: false,
    showInPreview: false,
    quality: { weight: 20, score: { kind: 'map', values: { moins_5k: 0.2, '5k_10k': 0.5, '10k_20k': 0.8, plus_20k: 1 } }, whenMissing: 0.15 },
    options: [
      { value: 'moins_5k', label: 'Moins de 5 000 €' },
      { value: '5k_10k', label: '5 000 – 10 000 €' },
      { value: '10k_20k', label: '10 000 – 20 000 €' },
      { value: 'plus_20k', label: 'Plus de 20 000 €' },
    ],
  },
] as const satisfies readonly FieldDef[];
