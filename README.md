# Akizit

Place de marché de leads B2B. Les demandes de devis générées par nos sites
d'acquisition (masolutionchaleur.fr, commentresilier.fr…) sont revendues à des
professionnels du bâtiment, à l'unité et sans abonnement.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript
- **Tailwind v4** — tokens dans `app/globals.css`, pas de `tailwind.config.js`
- **Firebase** — Auth (Google) + Firestore + Admin SDK côté serveur
- **Zod 4** pour la validation · **Vitest** pour les tests

> ⚠️ Next 16 comporte des ruptures d'API. Lire `node_modules/next/dist/docs/`
> avant d'écrire du code — voir `AGENTS.md`.

## Démarrage

```bash
npm install
cp .env.local.example .env.local   # puis compléter
npm run dev
```

Sans configuration Firebase, le site tourne sur un jeu de démonstration : les
écrans sont navigables, mais la connexion et la persistance sont inactives.

### Avec les émulateurs Firebase

```bash
npm run emulators   # dans un terminal
npm run seed        # peuple la base locale
npm run dev
```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (ce que Vercel exécute) |
| `npm run check` | typecheck + lint + tests — à faire passer avant tout commit |
| `npm test` | Tests unitaires |
| `npm run test:rules` | Tests des règles Firestore (démarre l'émulateur) |
| `npm run emulators` | Émulateurs Auth + Firestore |
| `npm run seed` | Alimente l'émulateur avec des leads de démonstration |
| `npm run set-admin -- email@x.fr` | Donne le rôle administrateur à un compte |

## Variables d'environnement

La liste complète est dans `.env.local.example`, commentée. À renseigner sur
Vercel avant le premier déploiement :

- les 6 `NEXT_PUBLIC_FIREBASE_*` (console Firebase → Paramètres du projet)
- `FIREBASE_SERVICE_ACCOUNT_KEY` — clé de compte de service **encodée en base64
  sur une seule ligne** (les variables Vercel sont mono-ligne, et bricoler les
  `\n` de la clé privée est une source d'échecs silencieux)
- `PAYMENT_PROVIDER=mock` tant que Stripe n'est pas branché
- `CRON_SECRET` et `MOCK_PAYMENT_SECRET` — deux valeurs aléatoires

## Architecture

### Les 7 verticales sont une donnée, pas du code

`lib/verticals/registry.ts` décrit chaque métier : ses champs, ses libellés,
son prix de base, ses signaux de qualité. Le même registre alimente la liste,
les fiches, le formulaire d'administration, l'import et les pages SEO.

**Ajouter un métier = un fichier de champs + une entrée au registre.** Aucun
composant, aucun schéma Zod, aucun formulaire à écrire.

### Les coordonnées ne fuient pas

C'est la garantie centrale du produit, tenue par quatre mécanismes :

1. **Séparation physique** — la vitrine (`leads`) et les coordonnées
   (`leadContacts`) sont deux collections distinctes.
2. **Verrou Firestore** — `leadContacts` est refusé à *tous* les clients, y
   compris l'administrateur, qui passe par une route serveur journalisant
   chaque consultation.
3. **Projection en liste blanche** — `lib/leads/mask.ts` construit l'objet
   public champ par champ. Une ligne oubliée retire un champ d'affichage ; une
   liste noire oubliée aurait provoqué une fuite.
4. **Aucun champ de saisie libre** dans les données métier — un champ
   « précisions » finirait par contenir un numéro de téléphone, publié avant
   achat.

Ces garanties sont **testées**, pas seulement documentées : voir
`lib/leads/mask.test.ts` et `tests/rules/`.

### Le prix est recalculé, jamais figé

`lib/pricing/dynamic.ts` : prix = base × exclusivité × fraîcheur × qualité.

La fraîcheur évoluant chaque jour, un prix stocké en base vieillirait faux. Il
est donc recalculé à chaque lecture, et **gelé uniquement à la réservation**
dans `OrderItem.unitPriceCents`.

### L'argent se calcule côté serveur

Le navigateur n'envoie que des identifiants de leads. `lib/pricing/quote.ts`
relit les prix, applique les remises et rend le montant qui fait foi. Un panier
falsifié ne peut qu'ajouter ou retirer des leads, jamais changer un tarif.

### Un lead ne peut pas être survendu

`lib/orders/reserve.ts` réserve les leads 15 minutes dans une transaction
Firestore unique. `fulfillOrder` est idempotent : un rejeu de webhook Stripe ne
double pas les compteurs.

## TVA

Akizit relève de la **franchise en base** (art. 293 B du CGI) : `VAT_RATE` vaut
0 dans `lib/pricing/totals.ts`. En cas de dépassement de seuil, changer cette
seule constante suffit à basculer tout le système.

## Assets

Déposer les logos dans `public/logos/` en respectant les noms décrits par le
README de ce dossier. Tant qu'un fichier est absent, le nom du site s'affiche en
typographie — aucune modification de code n'est nécessaire.

## Déploiement

Vercel, avec les variables ci-dessus. `npm run build` doit passer localement
avant tout push : c'est exactement ce que Vercel exécute.

Les règles et index Firestore se déploient à part :

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```
