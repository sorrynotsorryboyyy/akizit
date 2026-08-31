import { defineConfig } from 'vitest/config';

/**
 * Configuration dédiée aux tests de règles Firestore.
 *
 * Séparée de la configuration principale : ces tests exigent l'émulateur, et
 * les faire tourner dans `npm test` casserait la suite sur une machine qui ne
 * l'a pas démarré. Ils s'exécutent via `npm run test:rules`, qui démarre
 * l'émulateur puis lance cette configuration.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    // Les règles sont évaluées par l'émulateur : plus lent qu'un test unitaire.
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // Exécution sérielle : tous les fichiers partagent la même base émulée et
    // appellent clearFirestore(), ce qui les ferait s'écraser mutuellement.
    fileParallelism: false,
  },
});
