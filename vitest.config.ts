import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Suíte reutilizável do Capture Hub (CAP-002). Dois conjuntos:
//  • Suite rápida       — IA MOCKADA, roda em TODO PR (`npm test`). Determinística.
//  • Suite de homologação — IA/serviços REAIS, roda antes de merge/releases/nightly
//    (`npm run test:homolog`). Os testes de homologação se auto-pulam sem HOMOLOG=1.
// Convenção de nomes dos testes: RI (reference impl) · ARCH (arquitetural, reutilizável)
//  · FUNC (funcional do módulo) · INT (integração) · E2E (fluxo completo).
export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.ts'],
    // Fast suite: exclui os testes de homologação (IA/serviços reais).
    exclude: ['node_modules/**', '.next/**', '**/*.homolog.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
