import type { Metadata } from 'next';
import { NewLeadForm } from './NewLeadForm';

export const metadata: Metadata = { title: 'Ajouter un lead' };

export default function NouveauLeadPage() {
  return (
    <>
      <h1 className="section-title">Ajouter un lead</h1>
      <p className="lede mt-3 max-w-2xl">
        Les champs proposés s’adaptent au métier choisi. Ils proviennent du même
        registre que les fiches publiques et l’import JSON.
      </p>

      <div className="mt-8">
        <NewLeadForm />
      </div>
    </>
  );
}
