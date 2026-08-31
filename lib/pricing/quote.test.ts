import { describe, expect, it } from 'vitest';
import { buildQuote } from './quote';
import { getDemoLeads } from '../leads/demo-data';

/**
 * Ces tests tournent sur le jeu de démonstration (Firebase non configuré en
 * test), ce qui suffit : buildQuote ne dépend de la source de données qu'à
 * travers getLeadsByIds.
 */
const leads = getDemoLeads();
const available = leads.filter((l) => l.status === 'available');
const soldOut = leads.filter((l) => l.status === 'sold_out');

describe('buildQuote', () => {
  it('calcule un devis à partir des seuls identifiants', async () => {
    const ids = available.slice(0, 2).map((l) => l.id);
    const quote = await buildQuote(ids);

    expect(quote.lines).toHaveLength(2);
    expect(quote.totals.subtotalCents).toBe(
      available[0].priceCents + available[1].priceCents,
    );
  });

  /** Le point essentiel : les prix viennent de la base, jamais du client. */
  it('ignore tout prix qui viendrait du client', async () => {
    const lead = available[0];
    const quote = await buildQuote([lead.id]);

    expect(quote.lines[0].unitPriceCents).toBe(lead.priceCents);
    // Le devis n'expose aucun champ modifiable qui ferait autorité.
    expect(quote.totals.totalCents).toBe(lead.priceCents);
  });

  it('applique les paliers de remise', async () => {
    const quote = await buildQuote(available.slice(0, 5).map((l) => l.id));
    expect(quote.totals.itemCount).toBe(5);
    expect(quote.totals.discountRate).toBe(0.08);
  });

  it('écarte les leads introuvables', async () => {
    const quote = await buildQuote([available[0].id, 'lead-inexistant']);

    expect(quote.lines).toHaveLength(1);
    expect(quote.unavailable).toEqual([
      { leadId: 'lead-inexistant', reason: 'introuvable' },
    ]);
  });

  it('écarte les leads épuisés', async () => {
    if (soldOut.length === 0) return;

    const quote = await buildQuote([soldOut[0].id]);
    expect(quote.lines).toHaveLength(0);
    expect(quote.unavailable[0].reason).toBe('epuise');
  });

  it('écarte un lead déjà acquis plutôt que de le refacturer', async () => {
    const lead = available[0];
    const quote = await buildQuote([lead.id], { ownedLeadIds: [lead.id] });

    expect(quote.lines).toHaveLength(0);
    expect(quote.unavailable[0].reason).toBe('deja_achete');
    expect(quote.totals.totalCents).toBe(0);
  });

  it('déduplique les identifiants répétés', async () => {
    const lead = available[0];
    const quote = await buildQuote([lead.id, lead.id, lead.id]);

    expect(quote.lines).toHaveLength(1);
    expect(quote.totals.totalCents).toBe(lead.priceCents);
  });

  it('plafonne le panier à la limite de la transaction Firestore', async () => {
    const quote = await buildQuote(available.slice(0, 80).map((l) => l.id));
    expect(quote.lines.length).toBeLessThanOrEqual(50);
  });

  it('rend un devis nul pour un panier vide', async () => {
    const quote = await buildQuote([]);
    expect(quote.lines).toHaveLength(0);
    expect(quote.totals.totalWithVatCents).toBe(0);
  });

  it('ne divulgue aucune coordonnée dans le devis', async () => {
    const quote = await buildQuote(available.slice(0, 5).map((l) => l.id));
    const serialized = JSON.stringify(quote);

    expect(serialized).not.toMatch(/telephone|email|prenom|"nom"/);
    // Les seuls champs de localisation sont la ville et le département.
    for (const line of quote.lines) {
      expect(Object.keys(line).sort()).toEqual([
        'departement',
        'leadId',
        'unitPriceCents',
        'vertical',
        'ville',
      ]);
    }
  });
});
