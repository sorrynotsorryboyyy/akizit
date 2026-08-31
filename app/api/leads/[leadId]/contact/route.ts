import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminConfigured, adminDb } from '@/lib/firebase/admin';
import { currentUser } from '@/lib/firebase/session';
import { getLeadContact, hasEntitlement } from '@/lib/leads/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Révélation des coordonnées d'un prospect.
 *
 * Point le plus sensible de l'application. Quatre garde-fous :
 *
 *  1. Session vérifiée côté serveur, et onboarding exigé.
 *  2. Droit d'accès contrôlé dans `entitlements` — un seul get() sur un
 *     identifiant déterministe, donc ni requête ni index.
 *  3. Réponse 404 et non 403 lorsque le droit manque : un 403 confirmerait
 *     l'existence du lead et permettrait d'énumérer le stock.
 *  4. Chaque révélation est journalisée. C'est la contrepartie du fait que
 *     l'Admin SDK contourne les Security Rules.
 *
 * La réponse est construite champ par champ : aucun document Firestore brut
 * n'est renvoyé, afin qu'un champ ajouté plus tard ne parte pas au navigateur
 * sans décision explicite.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await params;

  const user = await currentUser({ checkRevoked: true });
  if (!user || !user.onboarded) {
    return NextResponse.json({ ok: false, error: 'Non autorisé.' }, { status: 401 });
  }

  if (!adminConfigured) {
    return NextResponse.json(
      { ok: false, error: 'Backend non configuré sur cet environnement.' },
      { status: 503 },
    );
  }

  const entitled = await hasEntitlement(user.uid, leadId);
  if (!entitled) {
    // 404 délibéré : ne pas révéler qu'un lead existe à qui n'y a pas droit.
    return NextResponse.json({ ok: false, error: 'Introuvable.' }, { status: 404 });
  }

  const contact = await getLeadContact(leadId);
  if (!contact) {
    return NextResponse.json({ ok: false, error: 'Introuvable.' }, { status: 404 });
  }

  await adminDb()
    .collection('auditLogs')
    .add({
      actorId: user.uid,
      action: 'contact.reveal',
      targetType: 'lead',
      targetId: leadId,
      atMs: Date.now(),
      at: FieldValue.serverTimestamp(),
    });

  return NextResponse.json({
    ok: true,
    contact: {
      prenom: contact.prenom,
      nom: contact.nom,
      telephone: contact.telephone,
      email: contact.email,
      adresse: contact.adresse ?? null,
      codePostal: contact.codePostalExact,
      ville: contact.villeExacte,
      notes: contact.notes ?? null,
    },
  });
}
