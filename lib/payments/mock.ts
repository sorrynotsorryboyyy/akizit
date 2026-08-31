import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentProvider } from './provider';

/**
 * Prestataire simulé, pour le développement local.
 *
 * Le jeton de confirmation est signé par HMAC plutôt que d'accepter un simple
 * identifiant de commande : sans signature, un professionnel pourrait
 * confirmer n'importe quelle commande en appelant la route directement, y
 * compris si la variable d'environnement était mal réglée en production.
 */

function secret(): string {
  // Une valeur par défaut suffit en local : ce prestataire n'encaisse rien.
  return process.env.MOCK_PAYMENT_SECRET ?? 'akizit-mock-secret-local';
}

export function signMockToken(orderId: string, amountCents: number): string {
  const payload = `${orderId}.${amountCents}`;
  const signature = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifyMockToken(
  token: string,
): { orderId: string; amountCents: number } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [orderId, amount, signature] = parts;
  const expected = createHmac('sha256', secret())
    .update(`${orderId}.${amount}`)
    .digest('hex');

  // Comparaison à temps constant : une comparaison naïve laisse fuiter la
  // signature attendue par mesure du temps de réponse.
  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return { orderId, amountCents: Number(amount) };
}

export const mockProvider: PaymentProvider = {
  name: 'mock',

  async createCheckoutSession({ order, successUrl }) {
    const token = signMockToken(order.id, order.totalWithVatCents);

    // Page locale de simulation : elle affiche le récapitulatif et propose de
    // confirmer, ce qui reproduit le retour depuis un prestataire réel.
    const url = `/checkout/simulation?token=${encodeURIComponent(token)}&suite=${encodeURIComponent(successUrl)}`;

    return { url, sessionId: `mock_${order.id}` };
  },

  async parseWebhook() {
    // Le mode simulé n'émet pas de webhook : la confirmation passe par
    // /api/checkout/confirm, protégée par le jeton signé.
    return null;
  },
};
