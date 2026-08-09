// Sistema de textos — FONTE ÚNICA de frases canônicas da SINTERA (PS-3).
// A copy canônica agora vive no @sintera/core (consumida por Web E Mobile). Este arquivo
// re-exporta para manter estáveis os imports da Web (`@/lib/ui/copy`) e os testes de contrato.
// Ver tests/contracts/_invariants.contract.test.ts (texto canônico) e Claude/MAPA_DE_ESTADOS.md.
export {
  COPY,
  FORBIDDEN_VARIANTS,
  copy,
  DISCLAIMERS,
  type CopyKey,
  type DisclaimerVariant,
} from '@sintera/core'
