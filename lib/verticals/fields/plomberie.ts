import type { FieldDef } from '../field-types';

/** Plomberie — dépannage, rénovation, sanitaires. */
export const plomberieFields = [
  {
    key: 'typeIntervention',
    kind: 'enum',
    label: 'Type d’intervention',
    required: true,
    showInPreview: true,
    options: [
      { value: 'fuite', label: 'Fuite d’eau' },
      { value: 'debouchage', label: 'Débouchage' },
      { value: 'chauffe_eau', label: 'Chauffe-eau / ballon' },
      { value: 'salle_de_bain', label: 'Rénovation salle de bain' },
      { value: 'installation_sanitaire', label: 'Installation sanitaire' },
      { value: 'canalisation', label: 'Canalisations' },
    ],
  },
  {
    key: 'urgence',
    kind: 'boolean',
    label: 'Intervention urgente',
    required: true,
    showInPreview: true,
    help: "Une urgence se convertit vite mais suppose une disponibilité immédiate.",
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
    key: 'proprietaire',
    kind: 'boolean',
    label: 'Propriétaire du logement',
    required: true,
    showInPreview: true,
  },
  {
    key: 'delaiProjet',
    kind: 'enum',
    label: 'Délai souhaité',
    required: true,
    showInPreview: true,
    options: [
      { value: 'immediat', label: 'Immédiat' },
      { value: 'cette_semaine', label: 'Cette semaine' },
      { value: 'ce_mois', label: 'Ce mois-ci' },
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
      { value: 'moins_500', label: 'Moins de 500 €' },
      { value: '500_2k', label: '500 – 2 000 €' },
      { value: '2k_5k', label: '2 000 – 5 000 €' },
      { value: 'plus_5k', label: 'Plus de 5 000 €' },
    ],
  },
] as const satisfies readonly FieldDef[];
