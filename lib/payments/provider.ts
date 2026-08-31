import 'server-only';
import type { OrderDoc } from '../orders/types';

/**
 * Abstraction de paiement.
 *
 * Le flux métier (réservation, confirmation, droits d'accès) ne connaît pas le
 * prestataire : brancher Stripe consistera à écrire une implémentation et à
 * changer une variable d'environnement, sans toucher à fulfillOrder.
 */

export type CheckoutSession = {
  /** Redirection vers le prestataire, ou vers la page de simulation locale. */
  url: string;
  sessionId: string;
};

export type PaymentEvent = {
  /** Clé d'idempotence : identifiant d'événement du prestataire. */
  eventId: string;
  type: 'payment.succeeded' | 'payment.failed' | 'payment.expired';
  orderId: string;
  paymentIntentId: string | null;
  amountCents: number;
};

export interface PaymentProvider {
  readonly name: 'mock' | 'stripe';

  createCheckoutSession(input: {
    order: OrderDoc;
    proEmail: string | null;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;

  /** Vérifie et normalise un événement entrant. `null` si non pertinent. */
  parseWebhook(request: Request): Promise<PaymentEvent | null>;
}
