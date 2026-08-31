/**
 * Informations légales de l'éditeur.
 *
 * Source unique : les mentions légales, les CGV, la politique de
 * confidentialité et les factures lisent toutes ce fichier. Une information
 * corrigée ici l'est partout.
 *
 * ⚠️ Les valeurs `À COMPLÉTER` font échouer un test (legal-config.test.ts) :
 * il est donc impossible de mettre le site en ligne avec des mentions
 * incomplètes, ce qui serait une non-conformité.
 */

export const TO_FILL = 'À COMPLÉTER';

export const LEGAL = {
  /** Nom commercial ou « Prénom NOM » pour un entrepreneur individuel. */
  raisonSociale: TO_FILL,

  /** Auto-entreprise = entrepreneur individuel. */
  statut: 'Entrepreneur individuel',

  /** Adresse du siège, obligatoire dans les mentions légales. */
  adresse: TO_FILL,
  codePostal: TO_FILL,
  ville: TO_FILL,

  /** 14 chiffres. Le SIREN (9 premiers) en est déduit automatiquement. */
  siret: TO_FILL,

  /**
   * Directeur de la publication : le représentant légal, donc vous-même pour
   * une entreprise individuelle.
   */
  directeurPublication: TO_FILL,

  email: 'contact@akizit.com',
  telephone: '' as string,

  /**
   * Numéro de TVA intracommunautaire.
   *
   * `null` en franchise en base : il ne faut alors surtout PAS afficher de
   * numéro, même fictif — ce serait une fausse déclaration.
   */
  tvaIntracom: null as string | null,

  /**
   * Médiateur de la consommation.
   *
   * Obligatoire uniquement en B2C. Akizit ne vendant qu'à des professionnels,
   * ce n'est pas requis — laissé vide, prêt si l'activité évoluait.
   */
  mediateur: { nom: '', url: '' },

  /** Hébergeur, à mentionner obligatoirement. */
  hebergeur: {
    nom: 'Vercel Inc.',
    adresse: '340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis',
    url: 'https://vercel.com',
  },

  /** Hébergeur des données, distinct de celui du site. */
  hebergeurDonnees: {
    nom: 'Google Ireland Limited',
    adresse: 'Gordon House, Barrow Street, Dublin 4, Irlande',
    region: 'europe-west1',
  },

  /** Durée de conservation d'un lead invendu, en mois. */
  retentionLeadsMois: 6,
} as const;

/** SIREN : les 9 premiers chiffres du SIRET. */
export function siren(): string {
  const digits = LEGAL.siret.replace(/\s/g, '');
  return /^\d{14}$/.test(digits) ? digits.slice(0, 9) : TO_FILL;
}

/** Adresse sur une ligne, pour les factures et le pied de page. */
export function adresseComplete(): string {
  return [LEGAL.adresse, `${LEGAL.codePostal} ${LEGAL.ville}`]
    .filter((p) => p && !p.includes(TO_FILL))
    .join(', ');
}

/**
 * Champs encore à renseigner.
 *
 * Utilisé par le test de complétude et par le bandeau d'avertissement affiché
 * sur les pages légales tant que la configuration est incomplète.
 */
export function champsManquants(): string[] {
  const manquants: string[] = [];

  const obligatoires: [string, string][] = [
    ['raisonSociale', LEGAL.raisonSociale],
    ['adresse', LEGAL.adresse],
    ['codePostal', LEGAL.codePostal],
    ['ville', LEGAL.ville],
    ['siret', LEGAL.siret],
    ['directeurPublication', LEGAL.directeurPublication],
  ];

  for (const [nom, valeur] of obligatoires) {
    if (!valeur || valeur.includes(TO_FILL)) manquants.push(nom);
  }

  return manquants;
}

export const legalComplet = () => champsManquants().length === 0;
