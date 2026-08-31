import type { Vertical } from '../verticals/registry';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';

export type OrderItem = {
  leadId: string;
  vertical: Vertical;
  ville: string;
  departement: string;
  /** Prix figé au moment de la réservation : il ne bouge plus ensuite. */
  unitPriceCents: number;
};

export type OrderDoc = {
  id: string;
  proId: string;
  status: OrderStatus;
  items: OrderItem[];

  subtotalCents: number;
  discountRate: number;
  discountCents: number;
  totalCents: number;
  vatRate: number;
  vatCents: number;
  totalWithVatCents: number;

  provider: 'mock' | 'stripe';
  providerSessionId: string | null;
  providerPaymentIntentId: string | null;

  reservationExpiresAtMs: number;
  paidAtMs: number | null;
  invoiceNumber: string | null;

  createdAtMs: number;
  updatedAtMs: number;
};

export type EntitlementDoc = {
  proId: string;
  leadId: string;
  orderId: string;
  vertical: Vertical;
  pricePaidCents: number;
  grantedAtMs: number;
};

/** Durée de réservation pendant le paiement. */
export const RESERVATION_MINUTES = 15;

export class CheckoutError extends Error {
  constructor(
    public code:
      | 'PANIER_VIDE'
      | 'LEAD_INTROUVABLE'
      | 'LEAD_INDISPONIBLE'
      | 'DEJA_ACHETE'
      | 'COMMANDE_INTROUVABLE'
      | 'COMMANDE_ANNULEE'
      | 'LEAD_PERDU',
    public leadId?: string,
  ) {
    super(code);
    this.name = 'CheckoutError';
  }
}
