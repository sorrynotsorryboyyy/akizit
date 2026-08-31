import type { Metadata } from 'next';
import { ImportPanel } from './ImportPanel';

export const metadata: Metadata = { title: 'Import JSON' };

export default function AdminImportPage() {
  return (
    <>
      <h1 className="section-title">Import JSON</h1>
      <p className="lede mt-3 max-w-2xl">
        Validez un export de leads avant son intégration. Chaque ligne est contrôlée
        indépendamment : un fichier partiellement invalide reste exploitable.
      </p>

      <div className="mt-8">
        <ImportPanel />
      </div>
    </>
  );
}
