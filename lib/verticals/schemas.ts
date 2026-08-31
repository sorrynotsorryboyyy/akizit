import 'server-only';
import { z } from 'zod';
import type { FieldDef } from './field-types';
import { VERTICALS, VERTICAL_KEYS, type Vertical } from './registry';

/**
 * Validation dérivée du registre.
 *
 * Aucun schéma n'est écrit à la main par verticale : la table de
 * correspondance « type de champ → validateur » vit ici, en un seul endroit.
 * Ajouter un FieldKind se fait donc en un point unique.
 *
 * Marqué `server-only` : Zod n'a rien à faire dans le bundle navigateur, et
 * les schémas d'import ne doivent pas être exposés.
 */

function fieldToZod(field: FieldDef): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.kind) {
    case 'enum': {
      const values = field.options.map((o) => o.value) as [string, ...string[]];
      schema = z.enum(values);
      break;
    }
    case 'boolean':
      schema = z.boolean();
      break;
    case 'number':
    case 'surface':
    case 'year':
      schema = z.number().int().min(field.min).max(field.max);
      break;
  }

  return field.required ? schema : schema.optional();
}

/**
 * `.strict()` est une protection de sécurité, pas une coquetterie : un import
 * JSON négligent ou malveillant qui glisserait un champ « telephone » dans
 * `data` verrait ce champ publié dans la vitrine consultable sans achat. Avec
 * strict, l'import échoue au lieu de publier.
 */
function buildDataSchema(vertical: Vertical) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of VERTICALS[vertical].fields) {
    shape[field.key] = fieldToZod(field);
  }
  return z.object(shape).strict();
}

type DataSchema = ReturnType<typeof buildDataSchema>;

export const verticalDataSchemas = Object.fromEntries(
  VERTICAL_KEYS.map((v) => [v, buildDataSchema(v)]),
) as Record<Vertical, DataSchema>;

/**
 * Union discriminée : Zod sélectionne le bon schéma d'après `vertical`.
 *
 * Le tableau est construit dynamiquement depuis le registre, ce que la
 * signature de `discriminatedUnion` (qui attend un tuple littéral) ne sait pas
 * exprimer. L'assertion porte donc uniquement sur l'arité, jamais sur la forme
 * des schémas eux-mêmes — ceux-ci restent générés par `buildDataSchema`.
 */
export const verticalPayloadSchema = z.discriminatedUnion(
  'vertical',
  VERTICAL_KEYS.map((v) =>
    z.object({ vertical: z.literal(v), data: verticalDataSchemas[v] }),
  ) as unknown as readonly [z.ZodObject, ...z.ZodObject[]],
);

export function validateVerticalData(vertical: Vertical, data: unknown) {
  return verticalDataSchemas[vertical].safeParse(data);
}
