import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOnboardedProApi } from '@/lib/auth/api-guards';
import { createOrderWithReservation } from '@/lib/orders/reserve';
import { CheckoutError } from '@/lib/orders/types';
import { getPaymentProvider } from '@/lib/payments';
import { MAX_CART_ITEMS } from '@/lib/pricing/tiers';
import { isAdminConfigured } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
  leadIds: z.array(z.string().min(1).max(128)).min(1).max(MAX_CART_ITEMS),
});

/** Messages destinés à l'acheteur : explicites, sans jargon technique. */
const MESSAGES: Record<string, string> = {
  PANIER_VIDE: 'Votre panier est vide.',
  LEAD_INTROUVABLE: 'Un lead de votre panier n’existe plus.',
  LEAD_INDISPONIBLE:
    'Un lead de votre panier vient d’être acheté par un autre professionnel.',
  DEJA_ACHETE: 'Vous avez déjà acheté l’un des leads de ce panier.',
};

export async function POST(request: Request) {
  const guard = await requireOnboardedProApi();
  if (!guard.ok) return guard.response;

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Paiement indisponible : backend non configuré.' },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Panier invalide.' }, { status: 400 });
  }

  const provider = getPaymentProvider();

  try {
    // Réservation et création de commande dans une transaction unique : c'est
    // ce qui empêche deux acheteurs simultanés d'obtenir le même lead exclusif.
    const order = await createOrderWithReservation(
      guard.user.uid,
      parsed.data.leadIds,
      { provider: provider.name },
    );

    const origin = new URL(request.url).origin;
    const session = await provider.createCheckoutSession({
      order,
      proEmail: guard.user.email,
      successUrl: `${origin}/checkout/succes?commande=${order.id}`,
      cancelUrl: `${origin}/panier`,
    });

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      url: session.url,
      totals: {
        itemCount: order.items.length,
        subtotalCents: order.subtotalCents,
        discountRate: order.discountRate,
        totalCents: order.totalCents,
        totalWithVatCents: order.totalWithVatCents,
      },
    });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        {
          ok: false,
          error: MESSAGES[error.code] ?? 'Commande impossible.',
          code: error.code,
          leadId: error.leadId,
        },
        { status: 409 },
      );
    }

    console.error('checkout', error);
    return NextResponse.json(
      { ok: false, error: 'Erreur lors de la création de la commande.' },
      { status: 500 },
    );
  }
}
