# EXDOC-013 — Governança estrutural (Consent + AuditEvent): design + evidências

> **Componente estrutural P1 · segurança/governança** (canônico §9; Protocolo §10). Migração **142**, aditiva/
> reversível, validada em **PostgreSQL isolado** (sintético). **Sem popular.** **Não** produção, backfill, wiring/UI,
> FHIR-serialização ou RNDS. **Não** toca tabelas existentes nem o Ciclo 1. Independente das demais. **Data:** 2026-08-19.

## 1. O que entra (142)
- **`consents`** (FHIR Consent + LGPD): `subject_user_id` (titular), `purpose` (enum de finalidade: interno/compartilhamento/transmissao/consulta/disponibilizacao/assistencial/secundario/pesquisa/analytics/ia/outro) + `purpose_detail`, **`legal_basis`** (hipótese LGPD — **consentimento ≠ base legal**), `scope`, `data_categories[]`, `source`, **`recipient`** (consentimento **por destinatário**), `policy_version`, `period_start/end`, `status` (proposed/active/revoked/expired/rejected), `granted_by/at`, `revoked_by/at`, `evidence`. Invariantes: **ativo ⇒ `granted_by`+`granted_at`**; **revogado ⇒ `revoked_by`+`revoked_at`** (nada silencioso). RLS user-scoped.
- **`audit_events`** (FHIR AuditEvent + LGPD): `action` (create/read/update/delete/link/confirm/transmit/export), `entity_type`/`entity_id`, `actor_id`, `occurred_at`, `source`, `purpose`, `outcome`, `session_ref`, `details jsonb`. **APPEND-ONLY**: só policies de `select`+`insert` (RLS nega update/delete). Índices por user/entity/actor.

## 2. Evidências (validação isolada — todos ✅)
| Seção | Verificação | Resultado |
|---|---|---|
| A | `consents` 4 policies + 2 CHECK; `audit_events` **2 policies (append-only)** | ✅ |
| B | Consent por **finalidade + destinatário**, ativo com **evidência de concessão** e `legal_basis` explícita | ✅ |
| C1 | ativo **sem** `granted_by/at` **FALHA** (`chk_consent_active_grant`) | ✅ |
| C2 | revogado **sem** `revoked_by/at` **FALHA** (`chk_consent_revocation`) | ✅ |
| D | `audit_events` **append-only**: `update`/`delete` afetam **0 linhas** (RLS nega) | ✅ |
| E | **RLS dois sentidos** em `consents` | ✅ |
| — | idempotência (8 objetos `already exists`) · rollback limpo | ✅ |

Resultado: `VALIDATION_142_OK`.

## 3. Regras respeitadas
- **Consentimento ≠ base legal** (LGPD): `legal_basis` separado do `Consent`; o Consent é o instrumento.
- **Consentimento por destinatário e finalidade** (não `consent = true`): `recipient` + `purpose` + `evidence`.
- **Nada silencioso:** concessão e revogação exigem autor+instante.
- **Auditoria imutável pelo cliente:** append-only via RLS (sem update/delete).

## 4. Gaps / `[NC]` / divergências
- Sem geração automática de eventos de auditoria (wiring de app) — próximo passo de integração (fora do schema).
- Base legal por fluxo/finalidade a ser preenchida por decisão jurídica (RIPD/controlador-operador) — gate de compliance, não schema.
- **Divergências:** nenhuma.

## 5. Estado
Componente **concluído** em ambiente isolado. Com isto, o **P1 estrutural (schema)** está coberto (terminologia + governança).
**Próximo componente (matriz):** **P2 · `Procedure`** (execução do procedimento — FHIR Procedure), última entidade estrutural aditiva do conjunto canônico mínimo. Aditivo/reversível, isolado.
> **Após Procedure**, os itens remanescentes são **gates materiais** (retrofit de enum `document_type`/`order_status`; ajustes de `exam_documents`/#117; populamento/curadoria; backfill/preview/RNDS) **ou código** (projetores FHIR — Fase C), que exigem decisão/gate próprios.
