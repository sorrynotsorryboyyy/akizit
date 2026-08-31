/**
 * Attribue le rôle administrateur à un compte.
 *
 * Le rôle vit dans un custom claim ET dans le document du professionnel :
 * le claim sert aux Security Rules sans coûter de lecture, le document sert
 * à l'affichage et à l'audit.
 *
 * Usage : npm run set-admin -- email@exemple.fr
 */
import { adminAuth, adminDb } from '../lib/firebase/admin';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage : npm run set-admin -- email@exemple.fr');
    process.exit(1);
  }

  const user = await adminAuth().getUserByEmail(email);
  const existing = user.customClaims ?? {};

  // On conserve les autres claims : écraser onboarded renverrait le compte
  // vers le formulaire d'activation.
  await adminAuth().setCustomUserClaims(user.uid, { ...existing, role: 'admin' });
  await adminDb().collection('pros').doc(user.uid).set({ role: 'admin' }, { merge: true });

  console.log(`${email} (${user.uid}) est désormais administrateur.`);
  console.log('Il doit se reconnecter pour que le rôle prenne effet.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
