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
    help: "Un locataire ne peut pas engager de travaux : l'information est décisive.",
  },
  {
    key: 'delaiProjet',
    kind: 'enum',
    label: 'Délai du projet',
    required: true,
    showInPreview: true,
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
    options: [
      { value: 'moins_5k', label: 'Moins de 5 000 €' },
      { value: '5k_10k', label: '5 000 – 10 000 €' },
      { value: '10k_20k', label: '10 000 – 20 000 €' },
      { value: 'plus_20k', label: 'Plus de 20 000 €' },
    ],
  },
] as const satisfies readonly FieldDef[];
