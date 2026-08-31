import 'server-only';
import { connection } from 'next/server';

/**
 * Horodatage courant, lu hors du rendu.
 *
 * Appeler `Date.now()` dans le corps d'un composant le rend impur : React 19
 * le signale, et surtout la valeur serait figée au moment de la compilation
 * pour une page prérendue — les « il y a 3 jours » vieilliraient alors sans
 * jamais être recalculés.
 *
 * `connection()` marque explicitement le point où le rendu dépend de la
 * requête, ce qui sort la page du prérendu statique de façon lisible.
 */
export async function currentTimestamp(): Promise<number> {
  await connection();
  return Date.now();
}
