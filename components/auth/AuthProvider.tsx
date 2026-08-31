'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onIdTokenChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, firebaseConfigured, googleProvider } from '@/lib/firebase/client';

/**
 * Contexte d'authentification.
 *
 * Deux états coexistent : la session Firebase côté navigateur, et le cookie
 * de session côté serveur. Ce composant les maintient alignés — sans quoi
 * l'utilisateur se croirait connecté alors que les Server Components le
 * verraient anonyme.
 */

type AuthState = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: () => Promise<{ ok: boolean; onboarded?: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  /** À appeler après l'onboarding pour récupérer les nouveaux claims. */
  refreshClaims: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;

    // onIdTokenChanged plutôt que onAuthStateChanged : il se déclenche aussi
    // au renouvellement du jeton, ce qui permet de rafraîchir le cookie de
    // session avant qu'il n'expire.
    return onIdTokenChanged(auth(), (next) => {
      setUser(next);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback<AuthState['signIn']>(async () => {
    if (!firebaseConfigured) {
      return { ok: false, error: 'Authentification non configurée.' };
    }

    try {
      const credential = await signInWithPopup(auth(), googleProvider());
      const idToken = await credential.user.getIdToken();

      // Le cookie doit être posé côté serveur : sans lui, les Server
      // Components ne verraient pas la session.
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      if (!response.ok) return { ok: false, error: data.error ?? 'Connexion refusée.' };

      return { ok: true, onboarded: data.onboarded === true };
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return { ok: false, error: 'Connexion annulée.' };
      }
      return { ok: false, error: 'La connexion a échoué. Réessayez.' };
    }
  }, []);

  const signOutUser = useCallback(async () => {
    // Les deux côtés doivent être nettoyés : oublier le cookie laisserait
    // l'utilisateur connecté du point de vue du serveur.
    await fetch('/api/auth/session', { method: 'DELETE' });
    if (firebaseConfigured) await signOut(auth());
  }, []);

  const refreshClaims = useCallback(async () => {
    const current = auth().currentUser;
    if (!current) return;

    // `true` force le rafraîchissement : sans cela, un claim tout juste posé
    // par le serveur n'apparaîtrait qu'au bout d'une heure.
    const idToken = await current.getIdToken(true);
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: firebaseConfigured,
      signIn,
      signOutUser,
      refreshClaims,
    }),
    [user, loading, signIn, signOutUser, refreshClaims],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider.');
  return context;
}
