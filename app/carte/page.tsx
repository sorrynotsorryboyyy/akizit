import type { Metadata } from 'next';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { LeadsMap } from '@/components/map/LeadsMap';
import { getDemoLeads } from '@/lib/leads/demo-data';
import { toPublicLead } from '@/lib/leads/mask';

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
 */
export default function CartePage() {
  const leads = getDemoLeads().map((lead) => toPublicLead(lead));

  // Date de référence calculée une fois côté serveur et transmise, pour que
  // les « il y a 3 jours » soient identiques au rendu serveur et au client.
  const now = Date.now();

  return (
    <>
      <MarketingHeader />
      <main>
        <LeadsMap leads={leads} now={now} />
      </main>
    </>
  );
}
