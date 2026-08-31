import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

/**
 * Tests des règles de sécurité Firestore.
 *
 * Ils tournent contre l'émulateur : ce sont les seuls tests capables de
 * prouver qu'un navigateur ne peut pas atteindre les coordonnées d'un
 * prospect. Une relecture des règles ne le prouve pas — une règle mal placée
 * se lit très bien.
 *
 * Prérequis : `npm run emulators` dans un autre terminal.
 */

let env: RulesTestEnvironment;

const PRO_A = 'pro-a';
const PRO_B = 'pro-b';

/** Jetons : les claims reproduisent ceux posés par le serveur après onboarding. */
const onboardedPro = () => ({ onboarded: true, role: 'pro' });
const notOnboarded = { role: 'pro' };
const adminClaims = { onboarded: true, role: 'admin' };

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'akizit-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();

  // Jeu de données posé en contournant les règles, comme le ferait l'Admin SDK.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();

    await setDoc(doc(db, 'leads/lead-1'), {
      vertical: 'pac',
      city: 'Nantes',
      priceCents: 4500,
      status: 'available',
      soldCount: 0,
      maxBuyers: 3,
    });

    await setDoc(doc(db, 'leadContacts/lead-1'), {
      leadId: 'lead-1',
      nom: 'Dupont',
      telephone: '+33612345678',
      email: 'jean@example.com',
    });

    await setDoc(doc(db, `pros/${PRO_A}`), { uid: PRO_A, role: 'pro', siret: '12345678901234' });
    await setDoc(doc(db, `pros/${PRO_B}`), { uid: PRO_B, role: 'pro' });

    await setDoc(doc(db, 'orders/order-a'), { proId: PRO_A, totalCents: 4500 });
    await setDoc(doc(db, `entitlements/${PRO_A}_lead-1`), {
      proId: PRO_A,
      leadId: 'lead-1',
    });

    await setDoc(doc(db, 'config/pricing'), { pac: 4500 });
    await setDoc(doc(db, 'auditLogs/log-1'), { actorId: PRO_A, action: 'reveal' });
    await setDoc(doc(db, 'counters/invoices'), { seq: 1 });
  });
});

/* ==================================================================
   LE TEST QUI COMPTE : les coordonnées sont inatteignables.
   ================================================================== */
describe('leadContacts — verrou absolu', () => {
  it('refuse la lecture à un visiteur anonyme', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'leadContacts/lead-1')));
  });

  it('refuse la lecture à un pro onboardé', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(getDoc(doc(db, 'leadContacts/lead-1')));
  });

  it('refuse la lecture au pro qui a pourtant acheté le lead', async () => {
    // Même avec le droit d'accès, la lecture directe est refusée : le contact
    // ne s'obtient que par la route serveur, qui journalise l'accès.
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(getDoc(doc(db, 'leadContacts/lead-1')));
  });

  it("refuse la lecture à l'administrateur lui-même", async () => {
    const db = env.authenticatedContext('admin-1', adminClaims).firestore();
    await assertFails(getDoc(doc(db, 'leadContacts/lead-1')));
  });

  it('refuse toute écriture', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(setDoc(doc(db, 'leadContacts/lead-1'), { nom: 'Pirate' }));
  });

  it('refuse la lecture en masse de la collection', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(getDocs(collection(db, 'leadContacts')));
  });
});

/* ================================================================== */
describe('leads — vitrine', () => {
  it('refuse la lecture à un visiteur anonyme', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'leads/lead-1')));
  });

  it('refuse la lecture à un pro non onboardé', async () => {
    const db = env.authenticatedContext(PRO_B, notOnboarded).firestore();
    await assertFails(getDoc(doc(db, 'leads/lead-1')));
  });

  it('autorise la lecture à un pro onboardé', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertSucceeds(getDoc(doc(db, 'leads/lead-1')));
  });

  it('refuse à un pro de se déclarer acheteur', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(
      setDoc(doc(db, 'leads/lead-1'), { status: 'sold_out', soldTo: PRO_A }),
    );
  });

  it('refuse à un pro de modifier un prix', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(setDoc(doc(db, 'leads/lead-1'), { priceCents: 1 }));
  });
});

/* ================================================================== */
describe('pros — profils', () => {
  it('autorise la lecture de son propre profil', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertSucceeds(getDoc(doc(db, `pros/${PRO_A}`)));
  });

  it('refuse la lecture du profil d’un autre pro', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(getDoc(doc(db, `pros/${PRO_B}`)));
  });

  it('refuse de s’auto-attribuer le rôle administrateur', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(setDoc(doc(db, `pros/${PRO_A}`), { role: 'admin' }));
  });

  it('refuse de modifier son propre SIRET', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(setDoc(doc(db, `pros/${PRO_A}`), { siret: '00000000000000' }));
  });
});

/* ================================================================== */
describe('orders — commandes', () => {
  it('autorise la lecture de ses propres commandes', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertSucceeds(getDoc(doc(db, 'orders/order-a')));
  });

  it('refuse la lecture des commandes d’un autre pro', async () => {
    const db = env.authenticatedContext(PRO_B, onboardedPro()).firestore();
    await assertFails(getDoc(doc(db, 'orders/order-a')));
  });

  it('autorise une requête filtrée sur son propre identifiant', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertSucceeds(
      getDocs(query(collection(db, 'orders'), where('proId', '==', PRO_A))),
    );
  });

  it('refuse une requête sur les commandes d’autrui', async () => {
    const db = env.authenticatedContext(PRO_B, onboardedPro()).firestore();
    await assertFails(
      getDocs(query(collection(db, 'orders'), where('proId', '==', PRO_A))),
    );
  });

  it('refuse de créer une commande depuis le navigateur', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(
      setDoc(doc(db, 'orders/faux'), { proId: PRO_A, totalCents: 1 }),
    );
  });
});

/* ================================================================== */
describe('entitlements — droits d’accès', () => {
  it('autorise la lecture de ses propres droits', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertSucceeds(getDoc(doc(db, `entitlements/${PRO_A}_lead-1`)));
  });

  it('refuse la lecture des droits d’un autre pro', async () => {
    const db = env.authenticatedContext(PRO_B, onboardedPro()).firestore();
    await assertFails(getDoc(doc(db, `entitlements/${PRO_A}_lead-1`)));
  });

  it('refuse de s’octroyer un droit d’accès', async () => {
    const db = env.authenticatedContext(PRO_B, onboardedPro()).firestore();
    await assertFails(
      setDoc(doc(db, `entitlements/${PRO_B}_lead-1`), {
        proId: PRO_B,
        leadId: 'lead-1',
      }),
    );
  });
});

/* ================================================================== */
describe('collections internes', () => {
  it('refuse la lecture des journaux d’audit', async () => {
    const db = env.authenticatedContext('admin-1', adminClaims).firestore();
    await assertFails(getDoc(doc(db, 'auditLogs/log-1')));
  });

  it('refuse la lecture des compteurs', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(getDoc(doc(db, 'counters/invoices')));
  });

  it('autorise la lecture de la grille tarifaire', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, 'config/pricing')));
  });

  it('refuse la modification de la grille tarifaire', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(setDoc(doc(db, 'config/pricing'), { pac: 1 }));
  });

  it('refuse toute collection non déclarée', async () => {
    const db = env.authenticatedContext(PRO_A, onboardedPro()).firestore();
    await assertFails(getDoc(doc(db, 'inventee/doc-1')));
    await assertFails(setDoc(doc(db, 'inventee/doc-1'), { x: 1 }));
  });
});
