import type { Vertical } from '../verticals/registry';
import type { MaxBuyers, RequestType } from './exclusivity';

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

  priceCents: number;
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
  /** Places restantes, pour l'argument de rareté. */
  remainingSlots: number;
  /** Le pro courant l'a déjà acheté (grisé sur la carte). */
  owned: boolean;
};

/** Charge utile allégée de la carte : ~60 octets par point au lieu de ~400. */
export type LeadMapPoint = [
  id: string,
  lat: number,
  lng: number,
  vertical: Vertical,
  priceCents: number,
];

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
