# Logos et assets

Déposez vos fichiers ici en respectant **exactement** les noms ci-dessous : le
code les référence par leur nom, sans configuration supplémentaire.

Tant qu'un fichier est absent, un repli typographique s'affiche (le nom du site
en toutes lettres). Rien ne casse, rien à modifier dans le code.

## akizit/ — identité Akizit

| Fichier | Format | Usage |
|---|---|---|
| `logo.svg` | SVG, hauteur de référence 32 px | En-tête du site |
| `logo-mono.svg` | SVG monochrome | Fonds sombres, impression, factures |
| `favicon.svg` | SVG carré | Onglet du navigateur |

## sources/ — sites d'acquisition

Un fichier par site, nommé d'après **son domaine sans extension** :

| Fichier | Site |
|---|---|
| `masolutionchaleur.svg` | masolutionchaleur.fr |
| `commentresilier.svg` | commentresilier.fr |

Pour ajouter un site, déposez `<domaine-sans-extension>.svg` — il apparaît
automatiquement partout où les sites sources sont listés.

## og/ — partage sur les réseaux

| Fichier | Format | Usage |
|---|---|---|
| `default.png` | **1200 × 630 px** | Aperçu lors du partage d'un lien |

## Recommandations

- **SVG de préférence** : net à toute taille, quelques kilooctets.
- Si PNG : fond transparent, et prévoir une version @2x pour les écrans Retina.
- Évitez les dégradés complexes dans les logos : ils rendent mal en très petit.
- Pour `logo-mono.svg`, une seule couleur unie (`currentColor` idéalement), afin
  que le logo s'adapte à son environnement.
