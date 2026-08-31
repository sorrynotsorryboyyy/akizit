import { describe, expect, it } from 'vitest';
import { computeTotals } from './totals';
import { discountRateFor, nextTier, MAX_CART_ITEMS } from './tiers';

const item = (unitPriceCents: number, leadId = 'l') => ({ leadId, unitPriceCents });
const items = (n: number, price = 1000) =>
  Array.from({ length: n }, (_, i) => item(price, `lead-${i}`));

describe('discountRateFor', () => {
  it('n’applique aucune remise en dessous de 3 leads', () => {
    expect(discountRateFor(0)).toBe(0);
    expect(discountRateFor(1)).toBe(0);
    expect(discountRateFor(2)).toBe(0);
  });

  it('applique les paliers annoncés', () => {
    expect(discountRateFor(3)).toBe(0.05);
    expect(discountRateFor(4)).toBe(0.05);
    expect(discountRateFor(5)).toBe(0.08);
    expect(discountRateFor(9)).toBe(0.08);
    expect(discountRateFor(10)).toBe(0.1);
  });

  it('conserve le meilleur palier au-delà de 10', () => {
    expect(discountRateFor(25)).toBe(0.1);
    expect(discountRateFor(MAX_CART_ITEMS)).toBe(0.1);
  });
});

describe('nextTier', () => {
  it('indique combien de leads manquent pour le palier suivant', () => {
    expect(nextTier(1)).toEqual({ tier: { minItems: 3, rate: 0.05 }, missing: 2 });
    expect(nextTier(4)).toEqual({ tier: { minItems: 5, rate: 0.08 }, missing: 1 });
    expect(nextTier(9)).toEqual({ tier: { minItems: 10, rate: 0.1 }, missing: 1 });
  });

  it('ne propose rien quand le meilleur palier est atteint', () => {
    expect(nextTier(10)).toBeNull();
    expect(nextTier(30)).toBeNull();
  });
});

describe('computeTotals', () => {
  it('calcule un panier sans remise', () => {
    const t = computeTotals([item(3500), item(1200)]);
    expect(t.subtotalCents).toBe(4700);
    expect(t.discountRate).toBe(0);
    expect(t.discountCents).toBe(0);
    expect(t.totalCents).toBe(4700);
  });

  it('applique la remise de 5 % à partir de 3 leads', () => {
    const t = computeTotals(items(3, 1000));
    expect(t.subtotalCents).toBe(3000);
    expect(t.discountRate).toBe(0.05);
    expect(t.discountCents).toBe(150);
    expect(t.totalCents).toBe(2850);
  });

  it('applique la remise de 10 % à partir de 10 leads', () => {
    const t = computeTotals(items(10, 4500));
    expect(t.subtotalCents).toBe(45000);
    expect(t.discountCents).toBe(4500);
    expect(t.totalCents).toBe(40500);
  });

  it('ajoute la TVA sur le montant remisé, pas sur le sous-total', () => {
    // Taux explicite : ce test vérifie la mécanique de l'assiette, pas le
    // taux du jour — qui est à 0 % en franchise en base.
    const t = computeTotals(items(5, 1000), 0.2);
    expect(t.totalCents).toBe(4600); // 5000 - 8 %
    expect(t.vatCents).toBe(920); // 20 % de 4600
    expect(t.totalWithVatCents).toBe(5520);
  });

  it('n’applique aucune TVA par défaut (franchise en base)', () => {
    const t = computeTotals(items(3, 1000));
    expect(t.vatCents).toBe(0);
    expect(t.totalWithVatCents).toBe(t.totalCents);
  });

  it('permet un taux de TVA nul (franchise en base)', () => {
    const t = computeTotals(items(3, 1000), 0);
    expect(t.vatCents).toBe(0);
    expect(t.totalWithVatCents).toBe(t.totalCents);
  });

  it('reste en centimes entiers malgré un arrondi défavorable', () => {
    // 3 × 3333 = 9999, remise 5 % = 499.95 → doit être arrondi, pas tronqué.
    const t = computeTotals(items(3, 3333));
    expect(Number.isInteger(t.discountCents)).toBe(true);
    expect(Number.isInteger(t.totalCents)).toBe(true);
    expect(Number.isInteger(t.vatCents)).toBe(true);
    expect(t.discountCents).toBe(500);
    expect(t.totalCents).toBe(9499);
  });

  it('gère un panier vide sans produire NaN', () => {
    const t = computeTotals([]);
    expect(t.itemCount).toBe(0);
    expect(t.subtotalCents).toBe(0);
    expect(t.totalWithVatCents).toBe(0);
  });
});
