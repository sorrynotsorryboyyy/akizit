'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from './AuthProvider';

export function GoogleSignInButton({ suite }: { suite?: string }) {
  const { signIn, configured } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    const result = await signIn();

    if (!result.ok) {
      setError(result.error ?? 'La connexion a échoué.');
      setPending(false);
      return;
    }

    // Un compte sans onboarding ne peut rien acheter : on l'y envoie
    // directement plutôt que de le laisser buter sur une garde.
    const destination = result.onboarded
      ? (suite ?? '/leads')
      : `/onboarding${suite ? `?suite=${encodeURIComponent(suite)}` : ''}`;

    router.push(destination);
    router.refresh();
  }

  if (!configured) {
    return (
      <>
        <Button variant="secondary" size="lg" className="w-full" disabled>
          <GoogleIcon />
          Continuer avec Google
        </Button>
        <p className="mt-4 rounded-field bg-surface-sunken px-3 py-2.5 text-center text-xs text-ink-soft">
          Authentification non configurée sur cet environnement. Renseignez les
          variables Firebase dans <code>.env.local</code> pour l’activer.
        </p>
      </>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleClick}
        disabled={pending}
      >
        <GoogleIcon />
        {pending ? 'Connexion…' : 'Continuer avec Google'}
      </Button>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-field bg-danger-tint px-3 py-2.5 text-center text-sm text-danger"
        >
          {error}
        </p>
      )}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.4 7.6 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.6 0 3.7 2.6 1.8 6.4l3.8 3c.9-2.7 3.4-4.6 6.4-4.6z"
      />
    </svg>
  );
}
