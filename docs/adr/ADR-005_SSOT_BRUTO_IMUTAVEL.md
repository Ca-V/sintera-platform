# ADR-005 — SSOT bruto imutável + reconciliação na projeção

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[HIP-009]] · complementa [[adr_001_projecao_ssot|ADR-001]]

## Contexto
Observações vêm de múltiplas fontes/dispositivos, com correções, equivalências e concorrência. É preciso rastreabilidade
total e reconciliação sem perder origem.

## Decisão
O **SSOT bruto** de Observações é **append-only, idempotente e versionado** (correção = nova versão com `supersedes`). A
**reconciliação acontece na PROJEÇÃO, nunca no bruto**; projeções/indicadores são **recomputáveis** (self-healing).

## Alternativas consideradas
- **Sobrescrever no bruto:** rejeitada — perde origem e histórico; impede auditoria.
- **Dedup destrutivo entre fontes:** rejeitada — apaga proveniência de origens equivalentes.

## Consequências
Rastreabilidade ponta a ponta; auto-cura de dados atrasados/corrigidos; a política de precedência vive na projeção.
Governa [[HIP-009]] §1–§9.
