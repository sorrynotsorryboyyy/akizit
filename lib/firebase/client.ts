'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  type Auth,
} from 'firebase/auth';

/**
 * SDK Firebase côté navigateur.
 *
 * Ne sert qu'à l'authentification : les données transitent par les routes
 * serveur, qui appliquent les projections en liste blanche. Aucune lecture
 * Firestore directe depuis le client, afin que la vitrine reste la seule
 * surface exposée.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Vrai quand la configuration est absente : le site tourne alors en démo. */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

let cachedAuth: Auth | null = null;

function app(): FirebaseApp {
  // getApps() évite l'erreur « app already exists » au rechargement à chaud.
  return getApps().length ? getApp() : initializeApp(config);
}

export function auth(): Auth {
  if (cachedAuth) return cachedAuth;

  cachedAuth = getAuth(app());

  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR) {
    connectAuthEmulator(cachedAuth, process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR, {
      disableWarnings: true,
    });
  }

  return cachedAuth;
}

export function googleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Force le choix du compte : sur un poste partagé, une connexion silencieuse
  // au dernier compte utilisé est une source d'erreur fréquente.
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}
