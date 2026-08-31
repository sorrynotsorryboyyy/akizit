'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { validateImportAction, type ImportReport } from './actions';

const EXEMPLE = `[
  {
    "vertical": "pac",
    "source": "masolutionchaleur.fr",
    "codePostal": "44000",
    "ville": "Nantes",
    "requestType": "devis",
    "capturedAt": "2026-08-30T09:00:00.000Z",
    "data": {
      "typePac": "air_eau",
      "surfaceM2": 120,
      "chauffageActuel": "fioul",
      "proprietaire": true,
      "delaiProjet": "moins_3_mois"
    },
    "contact": {
      "prenom": "Jean",
      "nom": "Dupont",
      "telephone": "06 12 34 56 78",
      "email": "jean.dupont@example.com",
      "codePostalExact": "44100",
      "villeExacte": "Nantes",
      "consentement": {
        "collecteLe": "2026-08-30T09:00:00.000Z",
        "urlSource": "https://masolutionchaleur.fr/devis-pac"
      }
    }
  }
]`;

export function ImportPanel() {
  const [raw, setRaw] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      setReport(await validateImportAction(raw));
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card className="p-6">
        <label htmlFor="json" className="font-semibold">
          Contenu JSON
        </label>
        <p className="mt-1 text-sm text-ink-soft">
          Collez un tableau de leads, ou un objet <code>{'{ "leads": [...] }'}</code>.
        </p>

        <textarea
          id="json"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          spellCheck={false}
          rows={18}
          placeholder="[ … ]"
          className="mt-4 w-full rounded-field border border-line-strong bg-surface p-3 font-mono text-xs leading-relaxed focus:border-brand focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={submit} disabled={pending || raw.trim() === ''}>
            {pending ? 'Validation…' : 'Valider le fichier'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setRaw(EXEMPLE);
              setReport(null);
            }}
          >
            Charger un exemple
          </Button>
          {raw !== '' && (
            <button
              type="button"
              onClick={() => {
                setRaw('');
                setReport(null);
              }}
              className="text-sm text-ink-faint underline-offset-4 hover:text-danger hover:underline"
            >
              Effacer
            </button>
          )}
        </div>

        {report && <Report report={report} />}
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="font-semibold">Règles appliquées</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">Validation ligne à ligne.</strong> Un lot
              partiellement invalide importe malgré tout les lignes correctes.
            </li>
            <li>
              <strong className="text-ink">Champ inconnu = rejet.</strong> Un champ non
              déclaré dans <code>data</code> fait échouer la ligne, ce qui empêche
              qu’un numéro de téléphone se retrouve dans la vitrine publique.
            </li>
            <li>
              <strong className="text-ink">Coordonnées séparées.</strong> Le bloc{' '}
              <code>contact</code> part dans un document privé, jamais dans le
              document consultable.
            </li>
            <li>
              <strong className="text-ink">Position floutée.</strong> Seul le centroïde
              de la commune est publié, jamais l’adresse.
            </li>
            <li>
              <strong className="text-ink">Exclusivité déduite.</strong>{' '}
              <code>telephone</code> → 1 acheteur, <code>devis</code> → 3, sauf
              surcharge explicite.
            </li>
            <li>
              <strong className="text-ink">Consentement obligatoire.</strong> Date et
              URL du formulaire d’origine sont exigées.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Report({ report }: { report: ImportReport }) {
  if (report.message) {
    return (
      <div className="mt-5 rounded-field border border-danger/40 bg-danger-tint p-4">
        <p className="font-semibold text-danger">Fichier illisible</p>
        <p className="mt-1 text-sm text-ink-soft">{report.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-line pt-5">
      <div className="flex flex-wrap gap-3">
        <Chip label="Lignes" value={report.total} />
        <Chip label="Valides" value={report.imported} tone="brand" />
        <Chip
          label="Rejetées"
          value={report.rejected}
          tone={report.rejected > 0 ? 'danger' : 'neutral'}
        />
      </div>

      {report.errors.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Erreurs détectées</p>
          <div className="mt-2 max-h-64 overflow-y-auto rounded-field border border-line">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Ligne</th>
                  <th className="px-3 py-2 font-semibold">Champ</th>
                  <th className="px-3 py-2 font-semibold">Message</th>
                </tr>
              </thead>
              <tbody>
                {report.errors.map((e, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-3 py-2 font-mono text-xs">
                      {e.index === -1 ? '—' : e.index + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-soft">
                      {e.path}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report.preview.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold">
            Aperçu des leads acceptés ({report.preview.length} sur {report.imported})
          </p>
          <ul className="mt-2 space-y-1.5">
            {report.preview.map((p) => (
              <li key={p.id} className="rounded-field bg-surface-muted px-3 py-2 text-sm">
                <span className="font-medium">{p.ville}</span>
                <span className="text-ink-faint"> · {p.vertical} · </span>
                <span className="text-ink-soft">{p.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.imported > 0 && (
        <p className="mt-5 rounded-field bg-brand-tint px-3 py-2.5 text-sm text-brand">
          Fichier conforme. L’enregistrement en base sera activé en phase 2 : aucune
          donnée n’est persistée pour l’instant.
        </p>
      )}
    </div>
  );
}

function Chip({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'brand' | 'danger';
}) {
  const tones = {
    neutral: 'bg-surface-sunken text-ink-soft',
    brand: 'bg-brand-tint text-brand',
    danger: 'bg-danger-tint text-danger',
  } as const;

  return (
    <span className={`rounded-field px-3 py-2 text-sm font-semibold ${tones[tone]}`}>
      {label} : {value}
    </span>
  );
}
