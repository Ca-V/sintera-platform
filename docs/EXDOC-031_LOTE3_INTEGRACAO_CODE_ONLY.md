# EXDOC-031 — Lote 3: reconciliação git + enforcement FHIR + guarda AI gateway (code-only)

> **Natureza:** implementação **code-only** (sem banco/produção/infra/secrets). RNDS **BLOCKED/EXTERNAL** (não tocado).
> **Baseline preservado:** `feat/fase-c-sql-source @ d440b64` (frozen); `main` intocada; 2 commits EAS de `main` **preservados**
> na linha de integração. **Branch:** `feat/lote3-integ` (de `feat` @ `2bf18cf` + merge de `main`). **PR draft; sem merge.**
> **Data:** 2026-08-19. Nenhum controle promovido a 🟢 VERDE.

## 1. O que foi implementado
- **ETAPA 2 — Reconciliação git:** merge **não-destrutivo** de `origin/main` na linha de dev → traz `eas-build.yml` (CI/EAS mobile, commits #126/#127) **sem perder** FHIR/segurança/testes/migrations/produto/docs. Sem conflito (feat não tocava o arquivo).
- **ETAPA 3A — FHIR enforcement (SEC-014):**
  - `src/lib/fhir/canonical/validate.ts` — `CanonicalInvariantError` + `assertCanonicalValid(bundle)` (fronteira de emissão: **lança** se violar invariantes internas). *(O adaptador RNDS, quando existir, deve passar por aqui.)*
  - `src/lib/fhir/canonical/preview.ts` — `runCanonicalPreview` agora roda `validateInvariants` e **`approved = structural.ok && invariants.ok`** (gate ligado à fronteira interna; antes era só estrutural).
- **ETAPA 3B — Segurança (SEC-011):** `tests/security/ARCH-SEC011-ai-gateway.test.ts` — guarda estática que fixa os **10 bypasses conhecidos** do AI gateway como allowlist e **bloqueia novos bypasses**. **Não** reroteia chamadas (caminhos clínicos do Ciclo 1 = refatoração gated) → **consolidação de política, não de runtime**.
- **ETAPA 3D — CI:** **sem mudança** (security-scan permanece informativo; SEC-016 já triado em EXDOC-028).

## 2. O que foi validado
- `npm run typecheck` → **0** · eslint (arquivos do lote) → **0**.
- `tests/fhir` + `tests/security` → **77 passed**.
- **Suíte completa → 1358 passed** · 11 skipped · 126 todo · 0 falhas (era 1352 → +6).
- Contrato preservado: único consumidor de `runCanonicalPreview` (`canonical-fasec-extended`) segue verde; `approved` continua `true` na fonte sintética (projetor já omite identificador sem `system` → `invariants.ok=true`).

## 3. Identificação do Supabase de produção
```
PROD_SUPABASE_ID    = NÃO COMPROVADO
PREVIEW_SUPABASE_ID = NÃO COMPROVADO
Classificação       = CONFLITANTE / NÃO RESOLVIDO
```
- Vercel CLI **Logged out** (sem `VERCEL_TOKEN`, sem `.vercel/`); não autentiquei. `vercel env pull` **não executável** neste ambiente.
- MCP mostra `pxiglvrgxooawetboglb` (SINTERA, ACTIVE) + `xfrlbtchkerhavqregeq` (preview, pausado); você relatou **outro** Project ID no dashboard. `NEXT_PUBLIC_SUPABASE_URL` é **Sensitive/ilegível**. **Não adivinho.**
- **Ação do owner (read-only, fecha o gap):** `vercel env pull --environment=production` (local) → extrair só o `ref` do host e comparar com `pxiglvrgxooawetboglb` e com o ID do dashboard.

## 4. Estado main × feat
- `main @ 632bd91` (produção) · `feat/fase-c-sql-source @ 2bf18cf` (dev, +59/−2). Após reconciliação: `feat/lote3-integ` = dev + EAS.
- **`main` NÃO contém** FHIR canônico (137–143), lotes de segurança (S0-A/L2) nem `security-scan.yml`. *Arquitetura definida ≠ em produção.*
- Divergência por categoria (127 arquivos): FHIR 5+7mig · Segurança 6+23docs · Produto 22 · Testes 19 · Infra 2 · Docs 10.

## 5. Testes executados e resultados
| Suíte | Resultado |
|---|---|
| typecheck (web) | 0 erros |
| eslint (lote) | 0 |
| tests/fhir + tests/security | 77 passed |
| Suíte completa | **1358 passed**, 0 falhas |

## 6. O que ainda bloqueia STAGING
- **Identidade do prod NÃO COMPROVADA** (§3) — pré-condição absoluta.
- **Sem STAGING isolado** (só PROD ativo + preview pausado; branching Supabase `MIGRATIONS_FAILED`).
- Owner de Cloud + autorização do C1 (material).

## 7. O que ainda bloqueia PRODUÇÃO
- Tudo do §6 **+** migrations 137–143 não aplicadas (VERIFY schema 136) · prova operacional de RLS (E5) · advisors ERROR abertos (views `SECURITY DEFINER`) · secrets/rotação/KMS · rede/egress. **Nada disso é executado sem as pré-condições.**

## 8. O que já está pronto para homologação (code-only, nível não-prod)
- Enforcement de invariantes FHIR na fronteira interna (SEC-014) + testes.
- Guarda de superfície do AI gateway (SEC-011) — impede novos bypasses.
- Reconciliação EAS/CI preservada.
- Suíte 1358 verde, typecheck/lint limpos.
> **Homologação code-only ≠ prova operacional de produção.** Nenhum SEC vira 🟢 VERDE aqui.

## 9. Próximo lote recomendado
1. **(Owner) Fechar a identidade do Supabase** via `vercel env pull` → destrava STAGING.
2. **Lote 4 (code-only, paralelo):** curadoria de terminologia (só bindings comprovados), enforcement adicional onde houver fronteira interna, testes de rotas afetadas.
3. **Gate S0/C1 (material):** provisionar STAGING isolado — **exige sua autorização + owner de Cloud**.

---

## Apêndice A — Análise estática das migrations 137→143 (ETAPA 5; read-only, NÃO aplicar)
| Mig | Objetos criados | Refs base | DROP real | Depende de | Rollback |
|---|---|---|---|---|---|
| 137 exam_documents | 1 tabela + 6 ALTER ADD (exams) + 4 policies + RLS | `exams` | **0** | schema ≤136 (`exams`) | reverso (EXDOC-016) |
| 138 service_requests_c2 | 2 tabelas + 8 policies + RLS | `exams` | **0** | 137 | reverso |
| 139 identity_fhir | 4 tabelas (patient/practitioner/org/identifier) + 4 policies | — | **0** | — | reverso |
| 140 actor_wiring | FKs nullable (wiring 138→139) | — | **0** | 138, 139 | reverso |
| 141 terminology_bindings | 1 tabela + 4 policies | — | **0** | — | reverso |
| 142 consent_audit | 2 tabelas (consents/audit_events) + 6 policies | — | **0** | — | reverso |
| 143 procedures | 1 tabela + 4 policies | `exams` | **0** | 138 | reverso |

- **Todas ADITIVAS** — nenhum `DROP TABLE/COLUMN`, nenhum `DELETE`/`TRUNCATE`. Os "drop" do scan bruto são `DROP POLICY/TRIGGER IF EXISTS` (idempotência).
- **Ordem:** 137→138→139→140→141→142→143 (sequencial; 140 exige 138+139; 143 exige 138).
- **Pré-condição:** schema base **≤136** com `exams`/`biomarkers`/`profiles`/`auth.users` — **VERIFY** (list_migrations do prod foi negado).
- **Teste que comprova cada etapa:** aplicar em **STAGING** → contagem de objetos + `get_advisors` sem novos ERROR + prova de RLS cross-tenant (E4) → validação pós-migration.

## Apêndice B — Classificação dos 22 arquivos de "produto" (ETAPA 6; não descartados)
| Bucket | Arquivos | Nota |
|---|---|---|
| **1. Produto necessário** | mobile: exams (List/Detail/Upload + uploadController + useExamUpload), TimelineScreen, ComposicaoScreen, RelatorioScreen, RegistrationHubSheet, QuickActionsSlot; web: dashboard/exams, relatorio, timeline | evolução Ciclo 1 — promover por lote |
| **2. Suporte FHIR (read-model)** | RelatorioScreen, relatorio/page, timeline/page, ExamDetailScreen | refletem read-model canônico — **podem depender de 137–143** (VERIFY) |
| **3. Segurança** | rotas `events`, `feedback`, `insights/[id]/feedback` (SEC-006), `exams/[id]/analyze` (IA) | já cobertos por testes do lote |
| **4. UI** | Sidebar, primitives/Select, navigation (MinhaSaudeStack/types) | **Regra 11**: navegação congelada — **não alterar** aqui; revisar só para promoção |
| **5. Depende de banco** | telas/páginas que leem `service_requests`/`procedures` (ExamDetail, relatorio, timeline) | **BLOQUEADO** até STAGING + migrations |

> Nenhum arquivo descartado por estar em `feat`. Promoção será por lotes, separando o que depende de banco.

## 10. Estado
Lote 3 (code-only) implementado, validado (1358 verde), documentado. **Sem merge; sem toque em banco/produção/infra.**
Baseline e `main` intocados; EAS preservado. RNDS BLOCKED/EXTERNAL. Parado para sua revisão do PR draft.
