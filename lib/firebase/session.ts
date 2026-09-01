import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth, isAdminConfigured } from './admin';

/**
 * Session serveur.
 *
 * Le SDK client persiste dans IndexedDB, invisible du serveur : sans cookie,
 * les Server Components ne sauraient jamais qui est connecté. On échange donc
 * le jeton d'identité contre un cookie de session signé.
 *
 * Le cookie s'appelle `__session` : c'est le seul nom transmis par le CDN de
 * Firebase Hosting. Le conserver évite une migration douloureuse si
 * l'hébergement change un jour.
 */

export const SESSION_COOKIE = '__session';

/** Durée maximale admise par Firebase pour un cookie de session. */
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  onboarded: boolean;
  role: 'pro' | 'admin';
};

export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_MS,
  });
}

/**
 * Utilisateur courant, ou null.
 *
 * `checkRevoked` est réservé aux opérations sensibles : il déclenche un
 * aller-retour réseau, qu'il serait coûteux de payer à chaque navigation.
 */
export async function currentUser(
  options: { checkRevoked?: boolean } = {},
): Promise<SessionUser | null> {
  // Sans backend configuré, il n'y a pas de session à vérifier : le site
  // fonctionne en mode démonstration plutôt que de renvoyer une erreur.
  if (!isAdminConfigured()) return null;

  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  try {
    const claims = await adminAuth().verifySessionCookie(
      value,
      options.checkRevoked ?? false,
    );

    return {
      uid: claims.uid,
      email: claims.email ?? null,
      name: (claims.name as string | undefined) ?? null,
      picture: (claims.picture as string | undefined) ?? null,
      onboarded: claims.onboarded === true,
      role: claims.role === 'admin' ? 'admin' : 'pro',
    };
  } catch {
    // Cookie expiré, révoqué ou falsifié : traité comme une absence de session.
    return null;
  }
}

/** Options du cookie. `httpOnly` empêche toute lecture par un script. */
export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
}
