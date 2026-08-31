import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { currentUser } from '@/lib/firebase/session';
import { isValidSiret, normalizeFrenchPhone } from '@/lib/validation/siret';
import { VERTICAL_KEYS } from '@/lib/verticals/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Onboarding professionnel.
 *
 * Le SIRET et le rôle sont écrits ICI, côté serveur, jamais par le navigateur :
 * ce sont eux qui conditionnent l'accès au produit. Les Security Rules
 * interdisent d'ailleurs toute écriture directe sur `pros`.
 */
const schema = z.object({
  raisonSociale: z.string().trim().min(2).max(160),
  siret: z
    .string()
    .trim()
    .refine(isValidSiret, 'SIRET invalide : 14 chiffres et clé de contrôle correcte.'),
  secteur: z.enum(VERTICAL_KEYS),
  telephone: z
    .string()
    .trim()
    .refine((v) => normalizeFrenchPhone(v) !== null, 'Numéro de téléphone invalide.'),
});

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Non connecté.' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Formulaire incomplet.',
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const { raisonSociale, siret, secteur, telephone } = parsed.data;
  const now = Date.now();

  const db = adminDb();
  const proRef = db.collection('pros').doc(user.uid);
  const existing = await proRef.get();

  // Le rôle n'est jamais réinitialisé : un compte promu administrateur ne doit
  // pas redevenir simple pro en repassant par l'onboarding.
  const role = (existing.data()?.role as string) ?? 'pro';

  await proRef.set(
    {
      uid: user.uid,
      email: user.email,
      displayName: user.name,
      photoURL: user.picture,
      raisonSociale,
      siret: siret.replace(/\s/g, ''),
      secteur,
      telephone: normalizeFrenchPhone(telephone),
      role,
      status: 'active',
      onboardedAtMs: existing.data()?.onboardedAtMs ?? now,
      createdAtMs: existing.data()?.createdAtMs ?? now,
      updatedAtMs: now,
      stats: existing.exists
        ? existing.data()?.stats
        : { leadsPurchased: 0, totalSpentCents: 0 },
    },
    { merge: true },
  );

  // Le claim évite un get() sur `pros` dans chaque règle Firestore : un get()
  // en règle est facturé et compte dans la limite de 10 accès par évaluation.
  await adminAuth().setCustomUserClaims(user.uid, { onboarded: true, role });

  await db.collection('auditLogs').add({
    actorId: user.uid,
    action: existing.exists ? 'pro.update' : 'pro.onboard',
    targetType: 'pro',
    targetId: user.uid,
    atMs: now,
    at: FieldValue.serverTimestamp(),
  });

  // Le client doit rafraîchir son jeton : sans cela le nouveau claim
  // n'apparaîtrait qu'à l'expiration naturelle, jusqu'à une heure plus tard.
  return NextResponse.json({ ok: true, refreshToken: true });
}
