import 'server-only';
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Admin SDK.
 *
 * Contourne les Security Rules par conception : c'est lui qui écrit les leads,
 * lit les coordonnées et pose les custom claims. Tout code l'utilisant doit
 * donc vérifier lui-même les droits — les règles ne le protègent pas.
 *
 * `server-only` garantit qu'un import depuis un composant client échoue à la
 * compilation plutôt qu'à l'exécution.
 */

/**
 * La clé de service arrive encodée en base64 sur une seule ligne : les
 * variables d'environnement Vercel sont mono-ligne, et bricoler les `\n` de la
 * clé privée est une source d'échecs silencieux.
 */
function credentials() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!encoded) return null;

  try {
    const json = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    return cert(json);
  } catch (error) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY illisible : attendu un JSON de compte de service encodé en base64. ' +
        `Détail : ${(error as Error).message}`,
    );
  }
}

let cached: App | null = null;

function adminApp(): App {
  if (cached) return cached;
  if (getApps().length) {
    cached = getApp();
    return cached;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const credential = credentials();

  // Sans clé de service mais avec émulateur, l'Admin SDK fonctionne en mode
  // non authentifié : c'est ce qui permet de développer sans projet Firebase.
  cached = initializeApp(
    credential ? { credential, projectId } : { projectId: projectId ?? 'akizit-local' },
  );

  return cached;
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}

export function adminDb(): Firestore {
  const db = getFirestore(adminApp());
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() lève si déjà appelé : sans conséquence, on ignore.
  }
  return db;
}

/**
 * Le backend est-il réellement configuré ?
 *
 * FONCTION et non constante : une constante est évaluée à l'import du module,
 * donc figée au moment du BUILD. Un build lancé sur un poste où `.env.local`
 * existe produirait un bundle persuadé que Firestore est disponible, et le
 * déploiement échouerait en tentant de joindre un émulateur inexistant —
 * exactement le défaut observé en production.
 *
 * Évaluée à chaque appel, elle reflète l'environnement d'exécution réel.
 */
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIRESTORE_EMULATOR_HOST,
  );
}
