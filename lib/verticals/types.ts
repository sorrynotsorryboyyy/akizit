import type {
  BooleanField,
  EnumField,
  FieldDef,
} from './field-types';
import type { chauffageFields } from './fields/chauffage';
import type { resiliationFields } from './fields/resiliation';
import type { pacFields } from './fields/pac';
import type { peintureFields } from './fields/peinture';
import type { toitureFields } from './fields/toiture';
import type { panneauxSolairesFields } from './fields/panneaux-solaires';
import type { plomberieFields } from './fields/plomberie';

/**
 * Dérive le type des données métier depuis les définitions de champs.
 *
 * Ajouter un champ à une verticale met donc à jour son type sans qu'aucune
 * interface ne soit maintenue à la main : le compilateur signale ensuite les
 * endroits à corriger.
 */

type ValueOf<F extends FieldDef> = F extends EnumField
  ? F['options'][number]['value']
  : F extends BooleanField
    ? boolean
    : number;

type RequiredKeys<F extends readonly FieldDef[]> = Extract<
  F[number],
  { required: true }
>['key'];

type OptionalKeys<F extends readonly FieldDef[]> = Extract<
  F[number],
  { required: false }
>['key'];

export type DataOf<F extends readonly FieldDef[]> = {
  [K in RequiredKeys<F>]: ValueOf<Extract<F[number], { key: K }>>;
} & {
  [K in OptionalKeys<F>]?: ValueOf<Extract<F[number], { key: K }>>;
};

export type ChauffageData = DataOf<typeof chauffageFields>;
export type ResiliationData = DataOf<typeof resiliationFields>;
export type PacData = DataOf<typeof pacFields>;
export type PeintureData = DataOf<typeof peintureFields>;
export type ToitureData = DataOf<typeof toitureFields>;
export type PanneauxSolairesData = DataOf<typeof panneauxSolairesFields>;
export type PlomberieData = DataOf<typeof plomberieFields>;

/** Union discriminée par `vertical`. */
export type VerticalPayload =
  | { vertical: 'chauffage'; data: ChauffageData }
  | { vertical: 'resiliation'; data: ResiliationData }
  | { vertical: 'pac'; data: PacData }
  | { vertical: 'peinture'; data: PeintureData }
  | { vertical: 'toiture'; data: ToitureData }
  | { vertical: 'panneaux_solaires'; data: PanneauxSolairesData }
  | { vertical: 'plomberie'; data: PlomberieData };
