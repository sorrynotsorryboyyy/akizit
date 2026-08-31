/**
 * Alimente l'émulateur Firestore avec le jeu de démonstration.
 *
 * Écrit les deux documents de chaque lead — vitrine et coordonnées — dans
 * leurs collections respectives, exactement comme le fera l'import réel.
 *
 * Usage : npm run seed (émulateurs démarrés au préalable)
 */
import { adminDb } from '../lib/firebase/admin';
import { getDemoLeads } from '../lib/leads/demo-data';
import { VERTICALS, VERTICAL_LIST } from '../lib/verticals/registry';

const PRENOMS = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc', 'Claire', 'Paul', 'Anne'];
const NOMS = ['Martin', 'Bernard', 'Dubois', 'Petit', 'Durand', 'Leroy', 'Moreau'];

async function main() {
  const db = adminDb();
  const leads = getDemoLeads();

  console.log(`Insertion de ${leads.length} leads…`);

  // Firestore limite un lot à 500 opérations ; on écrit deux documents par
  // lead, d'où des lots de 200 leads maximum.
  const CHUNK = 200;

  for (let start = 0; start < leads.length; start += CHUNK) {
    const batch = db.batch();

    for (const lead of leads.slice(start, start + CHUNK)) {
      batch.set(db.collection('leads').doc(lead.id), lead);

      // Coordonnées factices mais réalistes, dans la collection privée.
      const seed = Number(lead.id.replace(/\D/g, ''));
      const prenom = PRENOMS[seed % PRENOMS.length];
      const nom = NOMS[seed % NOMS.length];

      batch.set(db.collection('leadContacts').doc(lead.id), {
        leadId: lead.id,
        prenom,
        nom,
        telephone: `+336${String(10_000_000 + (seed * 7919) % 89_999_999)}`,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}${seed}@example.com`,
        adresse: `${1 + (seed % 90)} rue de la République`,
        codePostalExact: lead.postalCode,
        villeExacte: lead.city,
        buyerIds: [],
        consentement: {
          collecteLeMs: lead.capturedAtMs,
          urlSource: `https://${lead.source}/formulaire`,
        },
        purgeAfterMs: lead.capturedAtMs + 180 * 86_400_000,
      });
    }

    await batch.commit();
    console.log(`  ${Math.min(start + CHUNK, leads.length)}/${leads.length}`);
  }

  // Grille tarifaire, éditable depuis l'administration.
  await db
    .collection('config')
    .doc('pricing')
    .set(
      Object.fromEntries(VERTICAL_LIST.map((v) => [v.key, v.defaultPriceCents])),
    );

  const counts = VERTICAL_LIST.map(
    (v) => `${VERTICALS[v.key].shortLabel}: ${leads.filter((l) => l.vertical === v.key).length}`,
  );

  console.log('\nTerminé.');
  console.log(counts.join(' · '));
  console.log(
    `Disponibles : ${leads.filter((l) => l.status === 'available').length} / ${leads.length}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
