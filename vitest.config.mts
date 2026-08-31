import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      /**
       * Vitest résout `server-only` vers sa variante « client », qui lève
       * volontairement une erreur à l'import. On pointe vers l'entrée serveur
       * pour pouvoir tester les modules serveur.
       *
       * La protection réelle n'est pas affaiblie : c'est le bundler de Next
       * qui refuse l'import depuis un composant client, et ce comportement-là
       * n'est pas touché par cet alias de test.
       */
      'server-only': path.resolve(__dirname, 'node_modules/server-only/empty.js'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**'],
  },
});
