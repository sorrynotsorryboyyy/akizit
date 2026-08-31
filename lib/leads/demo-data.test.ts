import { describe, expect, it } from 'vitest';
import { generateDemoLeads, getDemoLeads } from './demo-data';
import { validateVerticalData } from '../verticals/schemas';
import { VERTICAL_KEYS } from '../verticals/registry';

describe('jeu de démonstration', () => {
  const leads = generateDemoLeads(240);

  it('produit le nombre demandé de leads', () => {
    expect(leads).toHaveLength(240);
  });

  /**
   * Le test le plus utile du fichier : il fait dialoguer le registre et les
   * schémas. Si un champ est ajouté d'un côté sans l'autre, il casse ici.
   */
  it('génère des données valides au regard des schémas', () => {
    for (const lead of leads) {
      const result = validateVerticalData(lead.vertical, lead.data);
      if (!result.success) {
        throw new Error(
          `${lead.id} (${lead.vertical}) invalide : ${JSON.stringify(result.error.issues)}`,
        );
      }
    }
  });

  it('couvre les sept verticales', () => {
    const seen = new Set(leads.map((l) => l.vertical));
    for (const v of VERTICAL_KEYS) expect(seen).toContain(v);
  });

  it('respecte la règle d’exclusivité', () => {
    for (const lead of leads) {
      const expected = lead.requestType === 'telephone' ? 1 : 3;
      expect(lead.maxBuyers).toBe(expected);
      expect(lead.soldCount).toBeLessThanOrEqual(lead.maxBuyers);
    }
  });

  it('marque comme épuisés les leads ayant atteint leur plafond', () => {
    for (const lead of leads) {
      if (lead.soldCount >= lead.maxBuyers) expect(lead.status).toBe('sold_out');
      else expect(lead.status).toBe('available');
    }
  });

  it('place les leads dans les bornes géographiques de la France', () => {
    for (const lead of leads) {
      expect(lead.lat).toBeGreaterThan(41);
      expect(lead.lat).toBeLessThan(51.5);
      expect(lead.lng).toBeGreaterThan(-5.5);
      expect(lead.lng).toBeLessThan(9.7);
    }
  });

  it('est déterministe : deux générations identiques à graine égale', () => {
    const a = generateDemoLeads(20, 42);
    const b = generateDemoLeads(20, 42);
    expect(a).toEqual(b);
  });

  it('produit des prix en centimes entiers et positifs', () => {
    for (const lead of leads) {
      expect(Number.isInteger(lead.basePriceCents)).toBe(true);
      expect(lead.basePriceCents).toBeGreaterThan(0);
    }
  });

  it('génère un résumé non vide pour chaque lead', () => {
    for (const lead of leads) {
      expect(lead.summary.trim().length).toBeGreaterThan(0);
      // Le résumé ne doit jamais contenir « undefined » : cela signalerait un
      // buildSummary lisant un champ optionnel absent.
      expect(lead.summary).not.toContain('undefined');
    }
  });

  it('trie du plus récent au plus ancien', () => {
    for (let i = 1; i < leads.length; i++) {
      expect(leads[i - 1].capturedAtMs).toBeGreaterThanOrEqual(leads[i].capturedAtMs);
    }
  });

  it('partage la même instance entre les appels', () => {
    expect(getDemoLeads()).toBe(getDemoLeads());
  });
});
