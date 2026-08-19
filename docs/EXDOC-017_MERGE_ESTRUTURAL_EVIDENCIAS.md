# EXDOC-017 — Merge controlado do gate estrutural (137→143) em preview/staging: evidências

> **Gate de Merge — EXECUTADO** na linha de **preview/staging** (`feat/mobile-inc4-perfil`), conforme EXDOC-016.
> **NÃO** toca `main`/produção. **Sem** dados reais, backfill, retrofit de enum legado, wiring extra, RNDS/OpenCare
> ou alteração do Ciclo 1. **Data:** 2026-08-19.

## 1. O que foi feito
Merge em ordem (dependências) das 7 migrações + validações/pareceres na linha de preview, via `git merge --no-ff`
(rastreável e reversível), pois a API do GitHub estava em rate limit — mecanismo derivado, mesmo resultado do plano.

| Ordem | Origem | Conteúdo |
|---|---|---|
| 1 | docs/fase0-migration (#117) | 137 `exam_documents` (+ `fulfills_order_id` **legado**) |
| 2 | feat/c2-servicerequest-138 (#137) | 138 `service_requests` + `service_request_results` |
| 3 | feat/c2-d-validation (#138) | validação D-1/D-2 (docs) |
| 4 | feat/p0-identity-139 (#139) | 139 identidade |
| 5 | feat/p0-actor-wiring-140 (#140) | 140 wiring |
| 6 | feat/p1-terminology-141 (#141) | 141 terminologia |
| 7 | feat/p1-governance-142 (#142) | 142 `Consent`/`AuditEvent` |
| 8 | feat/p2-procedure-143 (#143) | 143 `Procedure` |
| 9 | docs/exdoc-015-integracao (#144) | EXDOC-015 |
| 10 | docs/exdoc-016-pre-merge (#145) | EXDOC-016 |

## 2. Evidências objetivas
- **Conflitos: nenhum** — 10/10 merges limpos (arquivos aditivos; nomes distintos).
- **Migrações presentes após merge:** 137, 138, 139, 140, 141, 142, 143 (todas em `supabase/migrations/`).
- **Estado mesclado migra do zero:** aplicação das 7 migrações do *working tree* mesclado em PostgreSQL isolado → **7/7 OK**; validação de integração → **`INTEG_138_143_OK`** (11 entidades com RLS; grafo de FKs; cadeia `Patient→ServiceRequest→resultado→Procedure→DocumentReference`; bilateral por solicitação; separação canônica).
- **Ciclo 1 intacto:** **0** arquivos `.ts/.tsx` alterados pelos merges; **`tsc` 0**; regressão PEDIDO-002 (`FUNC-order-title`) **14/14**.
- **Reversibilidade:** SHA pré-merge de `feat/mobile-inc4-perfil` = **`e8ee47b3f34f2586dc877a4b04598418ffbae05a`**. Reverter = `git reset --hard e8ee47b` (ou `git revert -m 1` de cada merge) — preview/staging, sem produção.

## 3. Condições mantidas (verificado)
- ✅ Nenhum dado real; nenhum backfill.
- ✅ Nenhum retrofit de `document_type`/`order_status` (137 mantém texto).
- ✅ Nenhum wiring adicional fora do escopo (só o 140 já aprovado).
- ✅ Nenhuma integração RNDS/OpenCare.
- ✅ Nenhum impacto no baseline/Ciclo 1.
- ✅ `fulfills_order_id` permanece **legado/fallback**, sem novas escritas.
- ✅ `service_request_results → ServiceRequest → DiagnosticReport.basedOn` = **fonte canônica**.
- ✅ Migração **144** (`content_type`, papel `solicitacao`, `issuer→Organization`) permanece **deferida**.

## 4. Estado e próximo gate
Conjunto estrutural **integrado em preview/staging**. **NÃO** avançar automaticamente para backfill/produção/RNDS/OpenCare/retrofit.
**Próximo gate (com spec e validação próprias, antes de qualquer execução):** **Fase C — projetores FHIR sobre dados sintéticos** (serializar `ServiceRequest`/`DiagnosticReport`/`Observation`/`Procedure`/`DocumentReference` a partir deste schema; FHIR validator estrutural). Aguarda autorização.
