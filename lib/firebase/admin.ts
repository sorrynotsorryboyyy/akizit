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
 * Lit la clé de service, quel que soit le format fourni.
 *
 * Trois formes sont acceptées, parce que les trois se rencontrent en vrai :
 *  - JSON encodé en base64 (recommandé : une seule ligne, rien à échapper) ;
 *  - JSON brut collé tel quel ;
 *  - JSON brut dont les retours à la ligne de la clé privée ont été échappés,
 *    ce que font plusieurs interfaces de déploiement.
 *
 * Renvoie `null` plutôt que de lever : une clé illisible doit faire basculer
 * le site en mode démonstration, jamais le rendre inaccessible. L'erreur est
 * journalisée pour rester diagnosticable dans les logs Vercel.
 */
function credentials() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;

  // Un JSON commence par « { » ; sinon on suppose du base64.
  const decoded = raw.startsWith('{')
    ? raw
    : Buffer.from(raw, 'base64').toString('utf8');

  const parsed = tryParse(decoded);

  if (!parsed) {
    console.error(
      'FIREBASE_SERVICE_ACCOUNT_KEY illisible : attendu le JSON du compte de ' +
        'service, brut ou encodé en base64. Bascule en mode démonstration.',
    );
    return null;
  }

  // Les retours à la ligne de la clé privée sont souvent échappés par les
  // interfaces de déploiement. Sans cette restauration, l'initialisation
  // échoue avec une erreur de format PEM peu parlante.
  const privateKey = parsed.private_key;
  if (typeof privateKey === 'string') {
    parsed.private_key = privateKey.split(String.raw`\n`).join('\n');
  }

  try {
    return cert(parsed as Parameters<typeof cert>[0]);
  } catch (error) {
    console.error(
      'FIREBASE_SERVICE_ACCOUNT_KEY refusée par le SDK :',
      (error as Error).message,
    );
    return null;
  }
}

function tryParse(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

let cached: App | null = null;
/** Mémorise l'échec, pour ne pas retenter l'initialisation à chaque requête. */
let initFailed = false;

function adminApp(): App | null {
  if (cached) return cached;
  if (initFailed) return null;

  if (getApps().length) {
    cached = getApp();
    return cached;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const credential = credentials();

  // Sans clé de service mais avec émulateur, l'Admin SDK fonctionne en mode
  // non authentifié : c'est ce qui permet de développer sans projet Firebase.
  const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (!credential && !emulator) {
    initFailed = true;
    return null;
  }

  try {
    cached = initializeApp(
      credential
        ? { credential, projectId }
        : { projectId: projectId ?? 'akizit-local' },
    );
    return cached;
  } catch (error) {
    console.error('Initialisation Admin SDK impossible :', (error as Error).message);
    initFailed = true;
    return null;
  }
}

export function adminAuth(): Auth {
  const app = adminApp();
  if (!app) throw new Error('Admin SDK non configuré.');
  return getAuth(app);
}

export function adminDb(): Firestore {
  const app = adminApp();
  if (!app) throw new Error('Admin SDK non configuré.');

  const db = getFirestore(app);
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings() lève si déjà appelé : sans conséquence, on ignore.
  }
  return db;
}

/**
 * Le backend est-il réellement utilisable ?
 *
 * FONCTION et non constante : une constante est évaluée à l'import du module,
 * donc figée au moment du BUILD. Un build lancé sur un poste où `.env.local`
 * existe produirait un bundle persuadé que Firestore est disponible, et le
 * déploiement échouerait en tentant de joindre un émulateur inexistant.
 *
 * On vérifie que l'application s'initialise VRAIMENT, et pas seulement que la
 * variable existe : une clé mal formée fait alors basculer le site en mode
 * démonstration plutôt que de le rendre inaccessible.
 */
export function isAdminConfigured(): boolean {
  return adminApp() !== null;
}
