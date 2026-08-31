import type { FieldDef } from '../field-types';

/** Peinture — intérieur, extérieur, ravalement. */
export const peintureFields = [
  {
    key: 'typeTravaux',
    kind: 'enum',
    label: 'Type de travaux',
    required: true,
    showInPreview: true,
    options: [
      { value: 'interieur', label: 'Intérieur' },
      { value: 'exterieur', label: 'Extérieur' },
      { value: 'ravalement', label: 'Ravalement de façade' },
      { value: 'mixte', label: 'Intérieur et extérieur' },
    ],
  },
  {
    key: 'surfaceM2',
    kind: 'surface',
    label: 'Surface à peindre',
    required: true,
    showInPreview: true,
    min: 5,
    max: 2000,
  },
  {
    key: 'nombrePieces',
    kind: 'number',
    label: 'Nombre de pièces',
    required: false,
    showInPreview: true,
    min: 1,
    max: 50,
  },
  {
    key: 'typeLogement',
    kind: 'enum',
    label: 'Type de bien',
    required: true,
    showInPreview: true,
    options: [
      { value: 'maison', label: 'Maison' },
      { value: 'appartement', label: 'Appartement' },
      { value: 'local_pro', label: 'Local professionnel' },
    ],
  },
  {
    key: 'logementOccupe',
    kind: 'boolean',
    label: 'Logement occupé pendant les travaux',
    required: false,
    showInPreview: true,
    help: "Conditionne la protection du mobilier et le planning.",
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
    key: 'budgetEstime',
    kind: 'enum',
    label: 'Budget estimé',
    required: false,
    showInPreview: false,
    options: [
      { value: 'moins_2k', label: 'Moins de 2 000 €' },
      { value: '2k_5k', label: '2 000 – 5 000 €' },
      { value: '5k_10k', label: '5 000 – 10 000 €' },
      { value: 'plus_10k', label: 'Plus de 10 000 €' },
    ],
  },
] as const satisfies readonly FieldDef[];
