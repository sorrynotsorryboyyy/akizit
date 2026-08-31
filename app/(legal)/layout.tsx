import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { Container } from '@/components/ui/Card';

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
  return (
    <>
      <MarketingHeader />
      <main className="py-14">
        <Container className="max-w-3xl">
          <div className="mb-10 rounded-card border border-accent/40 bg-accent-tint px-5 py-4">
            <p className="text-sm font-semibold text-accent">
              Document de travail — à faire valider par un juriste
            </p>
            <p className="mt-1.5 text-sm text-ink-soft">
              Cette page est une trame destinée à être complétée et validée avant la
              mise en ligne publique. Elle n’a aucune valeur juridique en l’état.
            </p>
          </div>

          <article className="prose-akizit">{children}</article>
        </Container>
      </main>
      <MarketingFooter />
    </>
  );
}
