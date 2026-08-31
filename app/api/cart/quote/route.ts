import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildQuote } from '@/lib/pricing/quote';
import { currentUser } from '@/lib/firebase/session';
import { listEntitlementLeadIds } from '@/lib/leads/queries';
import { MAX_CART_ITEMS } from '@/lib/pricing/tiers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Devis du panier.
 *
 * Le corps ne contient QUE des identifiants : aucun prix n'est accepté du
 * client. Accessible sans être connecté, afin qu'un visiteur puisse composer
 * un panier avant de créer son compte — le montant reste calculé par le
 * serveur dans tous les cas.
 */
const schema = z.object({
  leadIds: z.array(z.string().min(1).max(128)).max(MAX_CART_ITEMS),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Panier invalide.' },
      { status: 400 },
    );
  }

  const user = await currentUser();

  // Les leads déjà acquis sont écartés du devis plutôt que refacturés.
  const ownedLeadIds = user ? await listEntitlementLeadIds(user.uid) : [];

  const quote = await buildQuote(parsed.data.leadIds, {
    proId: user?.uid,
    ownedLeadIds,
  });

  return NextResponse.json({ ok: true, quote });
}
