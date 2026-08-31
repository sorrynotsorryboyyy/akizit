import 'server-only';
import { NextResponse } from 'next/server';
import { currentUser, type SessionUser } from '../firebase/session';

/**
 * Gardes pour les routes d'API.
 *
 * Distinctes des gardes de pages : une route doit répondre en JSON avec un
 * code d'état, pas rediriger. Un `redirect()` dans un fetch produirait une
 * réponse HTML que le client ne saurait pas interpréter.
 */

type GuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

export async function requireUserApi(): Promise<GuardResult> {
  const user = await currentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Connexion requise.', code: 'NON_CONNECTE' },
        { status: 401 },
      ),
    };
  }

  return { ok: true, user };
}

export async function requireOnboardedProApi(): Promise<GuardResult> {
  const result = await requireUserApi();
  if (!result.ok) return result;

  if (!result.user.onboarded) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: 'Complétez votre profil professionnel pour acheter.',
          code: 'ONBOARDING_REQUIS',
        },
        { status: 403 },
      ),
    };
  }

  return result;
}

/**
 * Réservé à l'administration.
 *
 * `checkRevoked` est justifié ici : le coût d'un aller-retour réseau est
 * négligeable face au risque qu'un accès révoqué reste actif jusqu'à
 * l'expiration naturelle du cookie.
 */
export async function requireAdminApi(): Promise<GuardResult> {
  const user = await currentUser({ checkRevoked: true });

  if (!user || user.role !== 'admin') {
    // 404 plutôt que 403 : ne pas confirmer l'existence de la route.
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Introuvable.' },
        { status: 404 },
      ),
    };
  }

  return { ok: true, user };
}
