import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { LeadsMap } from '@/components/map/LeadsMap';
import { getDemoLeads } from '@/lib/leads/demo-data';
import { toPublicLead } from '@/lib/leads/mask';
import { currentTimestamp } from '@/lib/now';

export const metadata: Metadata = {
  title: 'Leads disponibles',
  description:
    'Consultez les demandes de devis disponibles partout en France et choisissez ' +
    'celles qui correspondent à votre zone d’intervention.',
};

/**
 * Carte publique.
 *
 * Les leads passent par toPublicLead() avant d'atteindre le navigateur : même
 * en phase de démonstration, aucune donnée de contact ne transite. La règle
 * vaut dès maintenant pour qu'aucun raccourci ne s'installe.
 *
 * Rendu à la requête : l'ancienneté affichée serait figée à la date du build
 * si la page était prérendue statiquement.
 */
export const dynamic = 'force-dynamic';

export default async function CartePage() {
  const leads = getDemoLeads().map((lead) => toPublicLead(lead));

  // Lu depuis la requête, pas pendant le rendu : appeler Date.now() dans le
  // corps du composant le rendrait impur (React 19 le signale).
  const now = await currentTimestamp();

  return (
    <>
      <MarketingHeader />
      <main>
        <LeadsMap leads={leads} now={now} />
      </main>
    </>
  );
}
