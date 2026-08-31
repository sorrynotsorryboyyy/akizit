import type { Vertical } from '../verticals/registry';
import type { MaxBuyers, RequestType } from './exclusivity';
import type { PriceBreakdown } from '../pricing/dynamic';

/** Statut commercial d'un lead. `reserved` couvre les 15 min du checkout. */
export type LeadStatus = 'available' | 'reserved' | 'sold_out' | 'archived';

/**
 * Document `leads/{id}` — la vitrine.
 *
 * Aucun champ de ce type ne permet d'identifier ou de recontacter le
 * prospect : c'est la garantie que la collection peut être lue sans risque
 * par un pro qui n'a rien acheté.
 */
export type LeadDoc = {
  id: string;
  vertical: Vertical;
  source: string;

  postalCode: string;
  city: string;
  departement: string;
  region: string;
  /** Centroïde de commune bruité — jamais l'adresse réelle. */
  lat: number;
  lng: number;

  /**
   * Prix de BASE du lead, en centimes : tarif du métier, éventuellement
   * surchargé à l'import. Ce n'est jamais le prix affiché — celui-ci est
   * recalculé à la lecture par computeDynamicPrice (fraîcheur, exclusivité,
   * qualité). Voir lib/pricing/dynamic.ts.
   */
  basePriceCents: number;
  /**
   * Score qualité figé à l'ingestion (0–100).
   *
   * Le dossier ne change plus après capture : le recalculer à chaque
   * affichage coûterait du CPU pour un résultat constant. La fraîcheur, elle,
   * dépend de l'instant et reste calculée à la volée.
   */
  qualityScore: number;
  requestType: RequestType;
  maxBuyers: MaxBuyers;
  soldCount: number;
  status: LeadStatus;
  reservedBy: string | null;
  reservedUntilMs: number | null;

  data: Record<string, unknown>;
  /** Résumé généré depuis `data`, jamais une saisie libre. */
  summary: string;

  capturedAtMs: number;
  createdAtMs: number;
};

/**
 * Ce qui est réellement envoyé au navigateur.
 *
 * Construit par liste blanche dans ./mask.ts. Une liste blanche oubliée retire
 * un champ d'affichage ; une liste noire oubliée provoque une fuite. D'où le
 * choix de la première.
 */
export type LeadPublic = Omit<LeadDoc, 'reservedBy' | 'reservedUntilMs'> & {
  /**
   * Prix du moment, recalculé à chaque lecture.
   *
   * Conserve le nom `priceCents` pour que les composants d'affichage restent
   * inchangés ; seul son sens évolue : « prix courant » et non « prix figé ».
   */
  priceCents: number;
  /** Décomposition du prix, pour justifier le tarif plutôt que le subir. */
  pricing: PriceBreakdown;
  /** Places restantes, pour l'argument de rareté. */
  remainingSlots: number;
  /** Le pro courant l'a déjà acheté (grisé dans la liste). */
  owned: boolean;
};

/** Document `leadContacts/{id}` — jamais lisible par un client. */
export type LeadContactDoc = {
  leadId: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  adresse?: string;
  codePostalExact: string;
  villeExacte: string;
  notes?: string;
  /** Acheteurs du lead : hors du document public pour ne pas livrer la
   *  liste des clients à la concurrence. */
  buyerIds: string[];
  consentement: {
    collecteLeMs: number;
    urlSource: string;
    ip?: string;
  };
  /** Rétention RGPD : purge automatique si le lead reste invendu. */
  purgeAfterMs: number;
};
