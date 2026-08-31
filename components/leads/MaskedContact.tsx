import { REQUEST_TYPE_LABELS, type RequestType } from '@/lib/leads/exclusivity';

/**
 * Aperçu verrouillé des coordonnées.
 *
 * Le texte flouté est du FAUX texte, écrit en dur ici. Les vraies coordonnées
 * ne sont jamais envoyées au navigateur avant achat : un flou CSS se retire en
 * deux clics dans l'inspecteur, ce ne serait donc pas une protection. La seule
 * protection réelle est que la donnée n'est pas là.
 */
export function MaskedContact({ requestType }: { requestType: RequestType }) {
  return (
    <div className="rounded-card border border-line bg-surface-muted p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Coordonnées du prospect</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-ink-soft">
          <LockIcon />
          Verrouillé
        </span>
      </div>

      <div className="mt-4 space-y-2.5" aria-hidden="true">
        <MaskedRow label="Nom" value="Jean-Michel Dupont" />
        <MaskedRow label="Téléphone" value="06 12 34 56 78" />
        <MaskedRow label="E-mail" value="jean.dupont@example.com" />
        <MaskedRow label="Adresse" value="14 rue des Lilas, 44000 Nantes" />
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        {REQUEST_TYPE_LABELS[requestType]} · Coordonnées complètes débloquées
        immédiatement après paiement.
      </p>
    </div>
  );
}

function MaskedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-20 shrink-0 text-xs text-ink-faint">{label}</span>
      <span className="blur-locked font-medium text-ink-soft select-none">{value}</span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" fill="currentColor" />
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
