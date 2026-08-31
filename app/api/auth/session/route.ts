import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { adminAuth } from '@/lib/firebase/admin';
import {
  SESSION_COOKIE,
  createSessionCookie,
  sessionCookieOptions,
} from '@/lib/firebase/session';

/** L'Admin SDK dépend de modules Node absents du runtime Edge. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ idToken: z.string().min(20).max(4096) });

/**
 * Échange un jeton d'identité contre un cookie de session.
 *
 * Le jeton est vérifié avant tout : `createSessionCookie` refuserait un jeton
 * invalide, mais la vérification explicite permet de distinguer un jeton
 * expiré d'une panne, et donc de rendre un message utile.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Requête invalide.' },
      { status: 400 },
    );
  }

  try {
    const decoded = await adminAuth().verifyIdToken(parsed.data.idToken, true);

    // Un jeton de plus de cinq minutes est refusé : il doit provenir d'une
    // connexion qui vient d'avoir lieu, pas d'un jeton récupéré ailleurs.
    const ageSeconds = Date.now() / 1000 - decoded.auth_time;
    if (ageSeconds > 5 * 60) {
      return NextResponse.json(
        { ok: false, error: 'Connexion expirée, veuillez recommencer.' },
        { status: 401 },
      );
    }

    const cookie = await createSessionCookie(parsed.data.idToken);
    const store = await cookies();
    store.set({ ...sessionCookieOptions(), value: cookie });

    return NextResponse.json({
      ok: true,
      onboarded: decoded.onboarded === true,
      role: decoded.role === 'admin' ? 'admin' : 'pro',
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Authentification refusée.',
        detail: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 401 },
    );
  }
}

/** Déconnexion : le cookie est effacé côté serveur. */
export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
