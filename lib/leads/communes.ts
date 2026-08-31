/**
 * Centroïdes de communes.
 *
 * Table volontairement réduite : elle sert au jeu de données de démonstration
 * et au repli quand un code postal importé n'est pas reconnu. En production,
 * l'import passera par la Base Adresse Nationale (api-adresse.data.gouv.fr)
 * pour couvrir les 35 000 communes ; cette table reste alors le filet de
 * sécurité hors ligne.
 *
 * Ce sont des centroïdes de commune, jamais des adresses : c'est précisément
 * ce qui permet de les publier sans exposer un domicile.
 */

export type Commune = {
  postalCode: string;
  city: string;
  departement: string;
  region: string;
  lat: number;
  lng: number;
};

export const COMMUNES: readonly Commune[] = [
  { postalCode: '75011', city: 'Paris', departement: '75', region: 'Île-de-France', lat: 48.8594, lng: 2.3765 },
  { postalCode: '92100', city: 'Boulogne-Billancourt', departement: '92', region: 'Île-de-France', lat: 48.8352, lng: 2.2409 },
  { postalCode: '93100', city: 'Montreuil', departement: '93', region: 'Île-de-France', lat: 48.8638, lng: 2.4485 },
  { postalCode: '95100', city: 'Argenteuil', departement: '95', region: 'Île-de-France', lat: 48.9472, lng: 2.2467 },
  { postalCode: '69003', city: 'Lyon', departement: '69', region: 'Auvergne-Rhône-Alpes', lat: 45.7554, lng: 4.8566 },
  { postalCode: '69100', city: 'Villeurbanne', departement: '69', region: 'Auvergne-Rhône-Alpes', lat: 45.7719, lng: 4.8902 },
  { postalCode: '38000', city: 'Grenoble', departement: '38', region: 'Auvergne-Rhône-Alpes', lat: 45.1885, lng: 5.7245 },
  { postalCode: '63000', city: 'Clermont-Ferrand', departement: '63', region: 'Auvergne-Rhône-Alpes', lat: 45.7772, lng: 3.0870 },
  { postalCode: '13006', city: 'Marseille', departement: '13', region: "Provence-Alpes-Côte d'Azur", lat: 43.2867, lng: 5.3806 },
  { postalCode: '06000', city: 'Nice', departement: '06', region: "Provence-Alpes-Côte d'Azur", lat: 43.7009, lng: 7.2683 },
  { postalCode: '83000', city: 'Toulon', departement: '83', region: "Provence-Alpes-Côte d'Azur", lat: 43.1242, lng: 5.9280 },
  { postalCode: '84000', city: 'Avignon', departement: '84', region: "Provence-Alpes-Côte d'Azur", lat: 43.9493, lng: 4.8055 },
  { postalCode: '31000', city: 'Toulouse', departement: '31', region: 'Occitanie', lat: 43.6045, lng: 1.4440 },
  { postalCode: '34000', city: 'Montpellier', departement: '34', region: 'Occitanie', lat: 43.6108, lng: 3.8767 },
  { postalCode: '30000', city: 'Nîmes', departement: '30', region: 'Occitanie', lat: 43.8367, lng: 4.3601 },
  { postalCode: '66000', city: 'Perpignan', departement: '66', region: 'Occitanie', lat: 42.6887, lng: 2.8948 },
  { postalCode: '33000', city: 'Bordeaux', departement: '33', region: 'Nouvelle-Aquitaine', lat: 44.8378, lng: -0.5792 },
  { postalCode: '87000', city: 'Limoges', departement: '87', region: 'Nouvelle-Aquitaine', lat: 45.8336, lng: 1.2611 },
  { postalCode: '64000', city: 'Pau', departement: '64', region: 'Nouvelle-Aquitaine', lat: 43.2951, lng: -0.3708 },
  { postalCode: '86000', city: 'Poitiers', departement: '86', region: 'Nouvelle-Aquitaine', lat: 46.5802, lng: 0.3404 },
  { postalCode: '44000', city: 'Nantes', departement: '44', region: 'Pays de la Loire', lat: 47.2184, lng: -1.5536 },
  { postalCode: '49000', city: 'Angers', departement: '49', region: 'Pays de la Loire', lat: 47.4784, lng: -0.5632 },
  { postalCode: '72000', city: 'Le Mans', departement: '72', region: 'Pays de la Loire', lat: 48.0061, lng: 0.1996 },
  { postalCode: '85000', city: 'La Roche-sur-Yon', departement: '85', region: 'Pays de la Loire', lat: 46.6705, lng: -1.4266 },
  { postalCode: '35000', city: 'Rennes', departement: '35', region: 'Bretagne', lat: 48.1173, lng: -1.6778 },
  { postalCode: '29200', city: 'Brest', departement: '29', region: 'Bretagne', lat: 48.3904, lng: -4.4861 },
  { postalCode: '56100', city: 'Lorient', departement: '56', region: 'Bretagne', lat: 47.7483, lng: -3.3702 },
  { postalCode: '59000', city: 'Lille', departement: '59', region: 'Hauts-de-France', lat: 50.6292, lng: 3.0573 },
  { postalCode: '80000', city: 'Amiens', departement: '80', region: 'Hauts-de-France', lat: 49.8941, lng: 2.2958 },
  { postalCode: '62100', city: 'Calais', departement: '62', region: 'Hauts-de-France', lat: 50.9513, lng: 1.8587 },
  { postalCode: '67000', city: 'Strasbourg', departement: '67', region: 'Grand Est', lat: 48.5734, lng: 7.7521 },
  { postalCode: '51100', city: 'Reims', departement: '51', region: 'Grand Est', lat: 49.2583, lng: 4.0317 },
  { postalCode: '54000', city: 'Nancy', departement: '54', region: 'Grand Est', lat: 48.6921, lng: 6.1844 },
  { postalCode: '68100', city: 'Mulhouse', departement: '68', region: 'Grand Est', lat: 47.7508, lng: 7.3359 },
  { postalCode: '76600', city: 'Le Havre', departement: '76', region: 'Normandie', lat: 49.4944, lng: 0.1079 },
  { postalCode: '14000', city: 'Caen', departement: '14', region: 'Normandie', lat: 49.1829, lng: -0.3707 },
  { postalCode: '76000', city: 'Rouen', departement: '76', region: 'Normandie', lat: 49.4432, lng: 1.0999 },
  { postalCode: '21000', city: 'Dijon', departement: '21', region: 'Bourgogne-Franche-Comté', lat: 47.3220, lng: 5.0415 },
  { postalCode: '25000', city: 'Besançon', departement: '25', region: 'Bourgogne-Franche-Comté', lat: 47.2378, lng: 6.0241 },
  { postalCode: '71100', city: 'Chalon-sur-Saône', departement: '71', region: 'Bourgogne-Franche-Comté', lat: 46.7806, lng: 4.8537 },
  { postalCode: '45000', city: 'Orléans', departement: '45', region: 'Centre-Val de Loire', lat: 47.9029, lng: 1.9093 },
  { postalCode: '37000', city: 'Tours', departement: '37', region: 'Centre-Val de Loire', lat: 47.3941, lng: 0.6848 },
  { postalCode: '18000', city: 'Bourges', departement: '18', region: 'Centre-Val de Loire', lat: 47.0810, lng: 2.3988 },
];

const BY_POSTAL_CODE = new Map(COMMUNES.map((c) => [c.postalCode, c]));

export function findCommune(postalCode: string): Commune | undefined {
  const exact = BY_POSTAL_CODE.get(postalCode);
  if (exact) return exact;

  // Repli sur le département : mieux vaut un point approximatif dans le bon
  // département qu'un lead absent de la liste.
  const dept = postalCode.slice(0, 2);
  return COMMUNES.find((c) => c.departement === dept);
}
