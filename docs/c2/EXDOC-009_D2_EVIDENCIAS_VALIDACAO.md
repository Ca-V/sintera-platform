# EXDOC-009 — D-2: Evidências da validação em ambiente isolado (dados sintéticos)

> **Fase D-2 — EXECUTADA em PostgreSQL isolado, dados 100% sintéticos.** **NÃO** produção, **NÃO** backfill de
> dados reais, **NÃO** wiring/UI, **NÃO** vínculo automático, **NÃO** camada FHIR, **NÃO** RNDS. PR #137 (migração
> 138) permanece **não mesclado**. Segue a spec `EXDOC-008 (D-1)`. **Data:** 2026-08-19.

## 1. Ambiente
PostgreSQL 16.13 efêmero (banco `d2test`), socket-only, encerrado ao fim. Branch Supabase de preview **não** usada (`[NC-infra]`: branching exige Pro) — validação em Postgres isolado com subconjunto de schema real (`exams`) + migração 138, conforme opção (b) do D-1 §3. Dados sintéticos sem PII (usuários `aaaa…`/`bbbb…`, `file_url` `synthetic://…`).

## 2. Resultado dos cenários (D-01..D-12 + projeção G) — TODOS ✅
| # | Cenário | Evidência |
|---|---|---|
| D-01/02/03 | Pedido bilateral: 2 `ServiceRequest`, mesmo `requisition_id`, lateralidade distinta, `coding` NULL | OK |
| D-04 | Pedido multi-procedimento: 2 SR `code_text` distintos, mesmo `requisition_id` | OK |
| D-05 | Resultado só do lado esquerdo (esquerdo cumprido, direito pendente) | OK |
| D-06 | Resultado posterior do direito (`linked_at` posterior; bilateral completo) | OK |
| D-07/08 | Vínculo ambíguo: 2 candidatos `auto_suggested`, **0 confirmados** (sem vínculo silencioso) | OK |
| D-09 | Confirmação explícita: 1 confirmado (`confirmed_by`+`confirmed_at`), rival descartado | OK |
| D-10 | Proveniência completa (todos com `linked_by`/`linked_at`/`link_method`; confirmados com confirmador/instante) | OK |
| G1 | Projeção conceitual `basedOn`: resultado→SR→`requisition` reconstrói o vínculo | OK |
| G2 | Projeção `DocumentReference`: `source_exam_id`→pedido com `file_url` preservado | OK |
| D-11a/b | RLS dois sentidos: U_A vê as próprias 4; U_B vê só a própria 1 | OK |
| D-12 | Pós-rollback: 138 removida; 7 linhas `exams` sintéticas intactas; legado inalterado | OK |

Resultado final da suíte: `D2_VALIDATION_OK`.

## 3. Coerência com o modelo canônico e o Protocolo v1.0 (checklist §7 do D-1)
- **Modelo canônico:** pedido→`ServiceRequest` (nunca resultado); resultado→`DiagnosticReport`/`Observation`; vínculo→`basedOn` (reconstruído em G1); documento→`DocumentReference` (G2); bilateral = 2 SR + `requisition`. `Procedure` não confundido (diferido). ✅
- **Protocolo v1.0:** display ≠ semântica; **nenhum código inventado** (`coding` NULL em todos os SR); **proveniência obrigatória**; **sem vínculo silencioso** (D-07/08/09); FHIR-first / não RNDS-dependent; nenhuma exigência RNDS não confirmada virou requisito. ✅
- **Matriz de conformidade:** P0 de semântica/persistência/identidade-estrutura representável; `[NC]` (LOINC/SNOMED/`bodySite`/perfil RNDS/imagem) **permanecem `[NC]`**, não populados. ✅

## 4. Projeção conceitual (mapa; sem implementar FHIR)
| Dado C-2 | FHIR | Verificado |
|---|---|---|
| `service_requests` | `ServiceRequest` | 1:1; `code`=text (coding NULL) |
| `requisition_id` | `ServiceRequest.requisition` | agrupa bilateral (2 SR) |
| `service_request_results` (confirmado) | `DiagnosticReport.basedOn → ServiceRequest` | G1 |
| `result_exam_id` | `DiagnosticReport`/`Observation` | resultado ≠ pedido |
| `source_exam_id.file_url` | `DocumentReference` | G2 |
| `subject_user_id` | `Patient` (id local) | identificadores nacionais diferidos `[NC]` |

## 5. Divergências
Nenhuma em relação à spec D-1. (A única divergência da fase C-2 — `chk_confirmation_provenance` — já aprovada em EXDOC-007.) Ajuste de harness: o resultado ambíguo (D-07) foi modelado como 2 sugestões `auto_suggested` sobre os 2 SR do pedido multi-procedimento — derivação técnica reversível, dentro do escopo.

## 6. Limites preservados (confirmação)
Sem merge do #137 · sem backfill de dados reais · sem wiring/UI · sem vínculo automático (toda sugestão exigiu confirmação explícita) · sem inventar `code`/`system`/`bodySite`/terminologia/identificador · sem FHIR/RNDS · baseline do Ciclo 1 intocado.

## 7. Riscos / `[NC]`
- `[NC-infra]` branch Supabase de preview indisponível → validação em Postgres isolado (equivalente para o objetivo estrutural).
- `[NC-artefato]` ValueSets/coding (LOINC/SNOMED/`bodySite`) — não populados.
- `[NC]` perfil/fluxo federal RNDS (imagem/pedido) — fora de escopo.

## 8. Estado do gate
D-2 **concluído** em ambiente isolado. A estrutura C-2 sustenta todos os cenários-alvo e permanece coerente com o modelo canônico e o Protocolo v1.0. **Próxima evolução estrutural** (#117 ajustada · identidade · terminologia · demais P0/P1) é **novo gate material** — requer aprovação/spec própria, conforme a matriz. PR #137 permanece **não mesclado** até decisão de merge.
