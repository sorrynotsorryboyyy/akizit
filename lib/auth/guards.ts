import 'server-only';
import { redirect } from 'next/navigation';
import { currentUser, type SessionUser } from '../firebase/session';

/**
 * Gardes d'accès.
 *
 * Une seule porte d'entrée pour chaque niveau d'exigence, afin qu'aucune page
 * n'invente sa propre vérification. Les redirections conservent la
 * destination voulue pour y ramener l'utilisateur après connexion.
 */

export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) {
    redirect(`/connexion${returnTo ? `?suite=${encodeURIComponent(returnTo)}` : ''}`);
  }
  return user;
}

/**
 * Exige un compte professionnel complet.
 *
 * L'onboarding conditionne l'accès au produit : sans SIRET renseigné, aucun
 * achat n'est possible.
 */
export async function requireOnboardedPro(returnTo?: string): Promise<SessionUser> {
  const user = await requireUser(returnTo);

  if (!user.onboarded) {
    redirect(`/onboarding${returnTo ? `?suite=${encodeURIComponent(returnTo)}` : ''}`);
  }

  return user;
}

/**
 * Exige le rôle administrateur.
 *
 * Renvoie vers l'accueil plutôt que vers une page d'erreur : un pro curieux
 * n'a pas besoin d'apprendre qu'une administration existe à cette adresse.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await currentUser({ checkRevoked: true });
  if (!user || user.role !== 'admin') redirect('/');
  return user;
}

/** Variante non bloquante, pour adapter l'affichage sans imposer de garde. */
export async function optionalUser(): Promise<SessionUser | null> {
  return currentUser();
}
