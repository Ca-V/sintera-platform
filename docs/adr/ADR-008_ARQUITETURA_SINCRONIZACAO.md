# ADR-008 — Arquitetura de Sincronização

**Status:** Accepted · **Architectural Baseline** · 2026-07-20 · **Ref:** [[HIP-009]]

## Contexto
Usuários têm múltiplos dispositivos e fontes simultâneas, uso offline, observações equivalentes de origens diferentes e
fontes concorrentes — exigindo idempotência, reconciliação e rastreabilidade.

## Decisão
Ingestão canônica única para **push (mobile), pull (web/fabricante) e batch/stream (agregador)**; **idempotência** por
chave determinística `(user, source, deviceId, metric, recordedAt[, externalId])`; **cursores por (usuário×fonte×
dispositivo)**; **equivalência + precedência** decididas na **projeção** (por evidência/confiança/directness/recência);
SSOT append-only versionado ([[adr_005_ssot_bruto_imutavel|ADR-005]]).

## Alternativas consideradas
- **Last-write-wins global:** rejeitada — perde origem e confiabilidade.
- **Dedup no bruto:** rejeitada — apaga proveniência; impede recompute.

## Consequências
Robustez universal (serve wearables, dispositivos médicos, FHIR, documentos); self-healing; complexidade concentrada na
política de precedência (configurável). Base do `/mobile/ingest` ([[HIP-012]] §9).
