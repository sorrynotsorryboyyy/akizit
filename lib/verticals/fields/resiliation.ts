import type { FieldDef } from '../field-types';

/**
 * Résiliation — leads issus de commentresilier.fr.
 *
 * Le nom de l'opérateur actuel est une énumération et non un champ libre :
 * outre la protection contre les fuites, cela rend les filtres exploitables
 * (« tous les leads Free en Bretagne »).
 */
export const resiliationFields = [
  {
    key: 'typeContrat',
    kind: 'enum',
    label: 'Type de contrat',
    required: true,
    showInPreview: true,
    options: [
      { value: 'assurance_auto', label: 'Assurance auto' },
      { value: 'assurance_habitation', label: 'Assurance habitation' },
      { value: 'mutuelle', label: 'Mutuelle santé' },
      { value: 'telecom', label: 'Téléphonie / Internet' },
      { value: 'energie', label: 'Énergie' },
      { value: 'banque', label: 'Banque' },
      { value: 'salle_sport', label: 'Salle de sport' },
    ],
  },
  {
    key: 'operateurActuel',
    kind: 'enum',
    label: 'Fournisseur actuel',
    required: true,
    showInPreview: true,
    options: [
      { value: 'orange', label: 'Orange' },
      { value: 'sfr', label: 'SFR' },
      { value: 'free', label: 'Free' },
      { value: 'bouygues', label: 'Bouygues' },
      { value: 'edf', label: 'EDF' },
      { value: 'engie', label: 'Engie' },
      { value: 'axa', label: 'AXA' },
      { value: 'maif', label: 'MAIF' },
      { value: 'autre', label: 'Autre' },
    ],
  },
  {
    key: 'montantMensuel',
    kind: 'number',
    label: 'Montant mensuel actuel',
    required: true,
    showInPreview: true,
    min: 1,
    max: 2000,
    unit: '€',
  },
  {
    key: 'motif',
    kind: 'enum',
    label: 'Motif de résiliation',
    required: true,
    showInPreview: true,
    options: [
      { value: 'trop_cher', label: 'Tarif trop élevé' },
      { value: 'demenagement', label: 'Déménagement' },
      { value: 'service_insuffisant', label: 'Service insuffisant' },
      { value: 'changement_situation', label: 'Changement de situation' },
      { value: 'autre', label: 'Autre' },
    ],
  },
  {
    key: 'echeanceProche',
    kind: 'boolean',
    label: 'Échéance dans moins de 3 mois',
    required: true,
    showInPreview: true,
    help: "Une échéance proche rend le lead nettement plus chaud.",
  },
  {
    key: 'ancienneteContratAnnees',
    kind: 'number',
    label: 'Ancienneté du contrat',
    required: false,
    showInPreview: false,
    min: 0,
    max: 60,
    unit: 'ans',
  },
] as const satisfies readonly FieldDef[];
