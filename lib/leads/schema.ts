import 'server-only';
import { z } from 'zod';
import { VERTICAL_KEYS } from '../verticals/registry';
import { verticalDataSchemas } from '../verticals/schemas';

/**
 * Schéma d'entrée d'un lead (formulaire admin et import JSON).
 *
 * Deux blocs distincts par construction : ce qui ira dans la vitrine publique,
 * et le bloc `contact` qui partira dans la collection privée `leadContacts`.
 * Cette séparation est reproduite jusque dans le typage pour qu'aucun écrit
 * ne puisse mélanger les deux par inadvertance.
 */

export const contactInputSchema = z.object({
  prenom: z.string().trim().min(1).max(80),
  nom: z.string().trim().min(1).max(80),
  telephone: z
    .string()
    .trim()
    .regex(/^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/, 'Numéro français invalide'),
  email: z.email().max(160),
  adresse: z.string().trim().max(200).optional(),
  codePostalExact: z.string().regex(/^\d{5}$/),
  villeExacte: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(2000).optional(),

  /**
   * Preuve de consentement RGPD, capturée à la source.
   *
   * Sans elle, la revente de la donnée n'est pas défendable : c'est ce qui
   * atteste que la personne a accepté la transmission à des partenaires.
   */
  consentement: z.object({
    collecteLe: z.coerce.date(),
    urlSource: z.url().max(500),
    ip: z.string().max(64).optional(),
  }),
});

export type ContactInput = z.infer<typeof contactInputSchema>;

const baseLeadSchema = z.object({
  source: z.string().trim().min(2).max(120),
  codePostal: z.string().regex(/^\d{5}$/),
  ville: z.string().trim().min(1).max(120),

  requestType: z.enum(['devis', 'telephone']),
  /** Laisser vide dans le cas courant : déduit du requestType. */
  maxBuyers: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),

  /** Vide = prix de base de la verticale. */
  priceCents: z.number().int().min(100).max(50_000).optional(),

  capturedAt: z.coerce.date(),
  contact: contactInputSchema,
});

/**
 * Union discriminée complète : le bon schéma de `data` est choisi selon la
 * verticale, et un champ inconnu fait échouer l'import (voir `.strict()`).
 */
export const leadInputSchema = z.discriminatedUnion(
  'vertical',
  VERTICAL_KEYS.map((v) =>
    baseLeadSchema.extend({
      vertical: z.literal(v),
      data: verticalDataSchemas[v],
    }),
  ) as unknown as [z.ZodObject<z.ZodRawShape>, ...z.ZodObject<z.ZodRawShape>[]],
);

export type LeadInput = z.infer<typeof leadInputSchema>;

/** Import en masse : un tableau, borné pour éviter un envoi démesuré. */
export const leadImportSchema = z.object({
  leads: z.array(leadInputSchema).min(1).max(1000),
});
