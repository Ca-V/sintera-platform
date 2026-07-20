# ADR-007 — Monorepo com compartilhamento web↔mobile

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[ARCH-002]] · [[HIP-012]] §4

## Contexto
Web e mobile precisam compartilhar modelo de domínio (Observação), contratos de API, validações e regras de negócio para
evitar divergência (reforço do API-first).

## Decisão
Adotar um **monorepo**: `apps/mobile`, `apps/web`, `packages/core` (domínio/contratos/validações/regras), `packages/
api-client`, `packages/ui`, `packages/config`. Os apps orquestram UI; a lógica compartilhada vive nos pacotes.

## Alternativas consideradas
- **Repositórios separados:** rejeitada — divergência de contrato e duplicação de regra.
- **Copiar código entre projetos:** rejeitada — insustentável e propenso a drift.

## Consequências
Fonte única de tipos/regras; evolução sincronizada; setup de workspaces + versionamento interno. Governa a Onda 1 da
implementação ([[HIP-010]]/[[HIP-012]]).
