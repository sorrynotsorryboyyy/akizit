import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { Container } from '@/components/ui/Card';
import { champsManquants } from '@/lib/legal-config';

/**
 * Gabarit des pages légales.
 *
 * Le bandeau d'avertissement est volontairement visible : ces textes sont des
 * trames de travail, pas des documents juridiques validés. Ils doivent être
 * relus par un juriste avant l'ouverture au public — la revente de données
 * personnelles impose des mentions précises qu'il n'appartient pas au code de
 * décider.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  // Le bandeau disparaît de lui-même une fois lib/legal-config.ts renseigné.
  const manquants = champsManquants();

  return (
    <>
      <MarketingHeader />
      <main className="py-14">
        <Container className="max-w-3xl">
          {manquants.length > 0 && (
            <div className="mb-10 rounded-card border border-accent/40 bg-accent-tint px-5 py-4">
              <p className="text-sm font-semibold text-accent">
                Document de travail — informations manquantes
              </p>
              <p className="mt-1.5 text-sm text-ink-soft">
                À renseigner dans <code>lib/legal-config.ts</code> :{' '}
                {manquants.join(', ')}. Cette page n’a pas de valeur juridique
                tant qu’elle est incomplète, et le contenu reste à faire valider.
              </p>
            </div>
          )}

          <article className="prose-akizit">{children}</article>
        </Container>
      </main>
      <MarketingFooter />
    </>
  );
}
