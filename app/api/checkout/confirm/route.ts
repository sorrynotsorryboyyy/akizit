import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOnboardedProApi } from '@/lib/auth/api-guards';
import { fulfillOrder } from '@/lib/orders/fulfill';
import { CheckoutError } from '@/lib/orders/types';
import { verifyMockToken } from '@/lib/payments/mock';
import { isMockPayment } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ token: z.string().min(10).max(512) });

/**
 * Confirmation d'un paiement simulé.
 *
 * Deux protections, la seconde étant la plus importante :
 *
 *  1. Le jeton est signé : on ne peut pas confirmer une commande arbitraire en
 *     appelant la route avec un identifiant deviné.
 *  2. La route refuse de s'exécuter si Stripe est actif. Sans ce garde-fou,
 *     une variable d'environnement mal réglée en production ouvrirait un
 *     chemin pour valider des commandes sans payer.
 */
export async function POST(request: Request) {
  if (!isMockPayment()) {
    return NextResponse.json(
      { ok: false, error: 'Route indisponible : paiement réel actif.' },
      { status: 403 },
    );
  }

  const guard = await requireOnboardedProApi();
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Requête invalide.' }, { status: 400 });
  }

  const verified = verifyMockToken(parsed.data.token);
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: 'Jeton de paiement invalide.' },
      { status: 400 },
    );
  }

  try {
    const result = await fulfillOrder(verified.orderId, {
      amountCents: verified.amountCents,
      paymentIntentId: `mock_pi_${verified.orderId}`,
    });

    return NextResponse.json({
      ok: true,
      orderId: result.order.id,
      invoiceNumber: result.order.invoiceNumber,
      alreadyFulfilled: result.alreadyFulfilled,
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      const message =
        error.code === 'LEAD_PERDU'
          ? 'Un lead de votre commande a été acheté entre-temps. Aucun montant n’a été débité.'
          : 'Confirmation impossible.';

      return NextResponse.json(
        { ok: false, error: message, code: error.code },
        { status: 409 },
      );
    }

    console.error('checkout/confirm', error);
    return NextResponse.json(
      { ok: false, error: 'Erreur lors de la confirmation.' },
      { status: 500 },
    );
  }
}
