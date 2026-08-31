import { permanentRedirect } from 'next/navigation';

/**
 * Ancienne adresse de la carte.
 *
 * Redirection permanente : des liens ont pu être partagés vers /carte, et une
 * 301 transmet le référencement acquis à la nouvelle adresse.
 */
export default function CarteRedirect() {
  permanentRedirect('/leads');
}
