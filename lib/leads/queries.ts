import 'server-only';
import { isAdminConfigured, adminDb } from '../firebase/admin';
import { getDemoLeads } from './demo-data';
import type { LeadContactDoc, LeadDoc } from './types';

/**
 * Accès aux leads.
 *
 * Retombe sur le jeu de démonstration tant que Firebase n'est pas configuré :
 * le site reste navigable sur un poste vierge, et le basculement vers
 * Firestore ne demande que de renseigner les variables d'environnement.
 *
 * Toutes ces fonctions renvoient des LeadDoc bruts. La projection vers le
 * navigateur passe obligatoirement par toPublicLead() — voir mask.ts.
 */

export type LeadFilters = {
  vertical?: string;
  departement?: string;
  limit?: number;
};

const LEADS = 'leads';
const CONTACTS = 'leadContacts';

export async function listAvailableLeads(
  filters: LeadFilters = {},
): Promise<LeadDoc[]> {
  if (!isAdminConfigured()) {
    return getDemoLeads()
      .filter((l) => l.status !== 'archived')
      .filter((l) => !filters.vertical || l.vertical === filters.vertical)
      .filter((l) => !filters.departement || l.departement === filters.departement)
      .slice(0, filters.limit ?? 500);
  }

  let query = adminDb()
    .collection(LEADS)
    .where('status', 'in', ['available', 'reserved']);

  if (filters.vertical) query = query.where('vertical', '==', filters.vertical);
  if (filters.departement) {
    query = query.where('departement', '==', filters.departement);
  }

  const snapshot = await query
    .orderBy('capturedAtMs', 'desc')
    .limit(filters.limit ?? 500)
    .get();

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as LeadDoc);
}

export async function getLead(leadId: string): Promise<LeadDoc | null> {
  if (!isAdminConfigured()) {
    return getDemoLeads().find((l) => l.id === leadId) ?? null;
  }

  const snapshot = await adminDb().collection(LEADS).doc(leadId).get();
  if (!snapshot.exists) return null;

  return { id: snapshot.id, ...snapshot.data() } as LeadDoc;
}

/** Lecture groupée, pour le panier et le devis. */
export async function getLeadsByIds(ids: string[]): Promise<LeadDoc[]> {
  if (ids.length === 0) return [];

  if (!isAdminConfigured()) {
    const all = getDemoLeads();
    return ids
      .map((id) => all.find((l) => l.id === id))
      .filter((l): l is LeadDoc => Boolean(l));
  }

  // getAll accepte un nombre arbitraire de références et ne coûte qu'une
  // lecture par document, là où une requête `in` est limitée à 30 valeurs.
  const refs = ids.map((id) => adminDb().collection(LEADS).doc(id));
  const snapshots = await adminDb().getAll(...refs);

  return snapshots
    .filter((s) => s.exists)
    .map((s) => ({ id: s.id, ...s.data() }) as LeadDoc);
}

/**
 * Coordonnées d'un prospect.
 *
 * SEUL endroit du code qui lit cette collection. Toute fonction appelante doit
 * avoir vérifié le droit d'accès au préalable : l'Admin SDK contourne les
 * Security Rules, elles ne protègent donc rien ici.
 */
export async function getLeadContact(
  leadId: string,
): Promise<LeadContactDoc | null> {
  if (!isAdminConfigured()) {
    // En démonstration, aucune coordonnée n'existe : renvoyer un jeu factice
    // ferait croire au bon fonctionnement d'un chemin non testé.
    return null;
  }

  const snapshot = await adminDb().collection(CONTACTS).doc(leadId).get();
  if (!snapshot.exists) return null;

  return snapshot.data() as LeadContactDoc;
}

/** Le pro a-t-il acquis ce lead ? Un seul get() sur un identifiant connu. */
export async function hasEntitlement(
  proId: string,
  leadId: string,
): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const snapshot = await adminDb()
    .collection('entitlements')
    .doc(`${proId}_${leadId}`)
    .get();

  return snapshot.exists;
}

/** Identifiants des leads déjà acquis, pour les griser dans la liste. */
export async function listEntitlementLeadIds(proId: string): Promise<string[]> {
  if (!isAdminConfigured()) return [];

  const snapshot = await adminDb()
    .collection('entitlements')
    .where('proId', '==', proId)
    .get();

  return snapshot.docs.map((d) => d.data().leadId as string);
}
