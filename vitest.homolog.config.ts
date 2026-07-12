import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Suite de HOMOLOGAÇÃO — IA/serviços REAIS + documentos reais. Roda antes de
// merge/releases e no nightly (`npm run test:homolog`). NÃO roda em PR (lenta e
// não-determinística por depender da IA). Ver vitest.config.ts (suite rápida).
export default defineConfig({
  test: {
    include: ['tests/**/*.homolog.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    environment: 'node',
    testTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
