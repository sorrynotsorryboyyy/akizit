'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useCart } from '@/lib/cart/store';

export function SimulationForm({ token, suite }: { token: string; suite?: string }) {
  const router = useRouter();
  const clearCart = useCart((s) => s.clear);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);

    const response = await fetch('/api/checkout/confirm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error ?? 'La confirmation a échoué.');
      setPending(false);
      return;
    }

    // Le panier n'est vidé qu'après confirmation effective : le vider avant
    // ferait perdre la sélection si le paiement échouait.
    clearCart();

    router.push(
      suite ? new URL(suite).pathname + new URL(suite).search : '/mes-leads',
    );
    router.refresh();
  }

  return (
    <>
      <Button size="lg" className="w-full" onClick={confirm} disabled={pending}>
        {pending ? 'Confirmation…' : 'Simuler un paiement réussi'}
      </Button>

      <ButtonLink href="/panier" variant="ghost" className="mt-2 w-full">
        Annuler
      </ButtonLink>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-field bg-danger-tint px-3 py-2.5 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </>
  );
}
