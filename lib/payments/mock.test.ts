import { describe, expect, it } from 'vitest';
import { signMockToken, verifyMockToken } from './mock';

describe('jeton de paiement simulé', () => {
  it('vérifie un jeton qu’il a lui-même signé', () => {
    const token = signMockToken('order-123', 5520);
    expect(verifyMockToken(token)).toEqual({
      orderId: 'order-123',
      amountCents: 5520,
    });
  });

  /**
   * Le point qui compte : sans signature, appeler la route de confirmation
   * avec un identifiant deviné suffirait à valider une commande sans payer.
   */
  it('rejette un jeton forgé', () => {
    expect(verifyMockToken('order-123.5520.signaturebidon')).toBeNull();
  });

  it('rejette un montant modifié après signature', () => {
    const token = signMockToken('order-123', 5520);
    const [orderId, , signature] = token.split('.');
    // On tente de payer 1 centime pour une commande à 55,20 €.
    expect(verifyMockToken(`${orderId}.1.${signature}`)).toBeNull();
  });

  it('rejette un identifiant de commande modifié', () => {
    const token = signMockToken('order-123', 5520);
    const [, amount, signature] = token.split('.');
    expect(verifyMockToken(`order-999.${amount}.${signature}`)).toBeNull();
  });

  it('rejette un jeton mal formé', () => {
    expect(verifyMockToken('')).toBeNull();
    expect(verifyMockToken('nimportequoi')).toBeNull();
    expect(verifyMockToken('a.b')).toBeNull();
    expect(verifyMockToken('a.b.c.d')).toBeNull();
  });

  it('ne lève pas sur une signature de longueur inattendue', () => {
    // Une comparaison à temps constant échoue si les tampons diffèrent en
    // taille : le code doit le gérer sans exception.
    expect(verifyMockToken('order-1.100.ab')).toBeNull();
    expect(verifyMockToken('order-1.100.' + 'f'.repeat(200))).toBeNull();
  });
});
