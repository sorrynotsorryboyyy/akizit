import 'server-only';
import { mockProvider } from './mock';
import type { PaymentProvider } from './provider';

/**
 * Sélection du prestataire de paiement.
 *
 * Stripe sera ajouté en phase 4 : il suffira d'importer son implémentation et
 * de basculer PAYMENT_PROVIDER. Aucune ligne du flux métier ne change.
 */
export function getPaymentProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    case 'stripe':
      throw new Error(
        'Le prestataire Stripe n’est pas encore implémenté (prévu en phase 4).',
      );
    default:
      return mockProvider;
  }
}

export const isMockPayment = () => process.env.PAYMENT_PROVIDER !== 'stripe';

export type { PaymentProvider, PaymentEvent, CheckoutSession } from './provider';
