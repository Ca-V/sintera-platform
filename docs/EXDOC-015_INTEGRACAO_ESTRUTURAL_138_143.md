# EXDOC-015 — Auditoria de integração estrutural do conjunto 137→143 (Gate Material: Integração)

> **Gate Material · Integração Estrutural — AUDITORIA READ-ONLY.** Verifica o conjunto **137 (#117) + 138→143**
> como **arquitetura única**, aplicado/reversível em **PostgreSQL isolado** (sintético). **NÃO faz merge**, não toca
> produção, dados reais, backfill, preview real, Ciclo 1, UI ou RNDS. **Fonte governante:** Protocolo v1.0 → modelo
> canônico → matriz. **Data:** 2026-08-19.

## 1. Mapa de dependências
```
exams, extraction_versions, biomarkers, clinical_results (legado)
      ▲                         ▲
      │ (137 altera/estende)    │ (137 add exam_document_id)
137 exam_documents ──ref──► exams ;  exams.primary_document_id ──► exam_documents ;  exams.fulfills_order_id ──► exams (self)
139 patients / practitioners / organizations / party_identifiers      (independente; auth.uid)
138 service_requests ──ref──► exams ;  service_request_results ──► service_requests, exams
140 service_requests ──(add FK)──► patients / practitioners / organizations        (DEPENDE de 138 + 139)
141 terminology_bindings            (independente)
142 consents / audit_events         (independente)
143 procedures ──ref──► service_requests, patients, practitioners, organizations, exams   (DEPENDE de 138 + 139)
```
**Independentes:** 137, 139, 141, 142. **Dependentes:** 138→(exams); 140→(138,139); 143→(138,139,exams).

## 2. Ordem de aplicação (validada)
**137 → 138 → 139 → 140 → 141 → 142 → 143** (a ordem numérica **satisfaz** todas as dependências topológicas).
Evidência: aplicação em ordem **sem erro** (7/7); **idempotência** confirmada (reaplicação 7/7 sem erro).

## 3. Conflitos
**Nenhum.** Sem colisão de nomes de tabela/tipo/constraint/índice entre as migrações. `document_type`/`order_status` não recebem CHECK (evita conflito com dados legados). Enums todos com nomes distintos. Aplicação e reaplicação limpas.

## 4. Duplicidades semânticas
- **Vínculo pedido→resultado:** `exams.fulfills_order_id` (137, grão de **pedido**, ponteiro nu) **coexiste** com `service_request_results` (138, grão de **solicitação/lado**, com **proveniência** e confirmação). ⇒ **`service_request_results` é o canônico**; `fulfills_order_id` fica **legado** (não é a fonte da verdade do vínculo). É a duplicidade já prevista no EXDOC-005 — **gerenciável**, não bloqueante.
- **Documento:** `exam_documents` (137) projeta para `DocumentReference`; não conflita com `Procedure.report_exam_id` (143, que aponta ao **evento-resultado**, não ao documento). Sem duplicidade.
- Nenhuma outra.

## 5. Riscos
- **R1 (médio):** se a aplicação passar a gravar `fulfills_order_id` (137) como vínculo primário, institucionaliza-se o vínculo sem proveniência. **Mitigação:** adotar `service_request_results` como canônico; `fulfills_order_id` só leitura/legado. (Decisão de wiring — Fase C, gate próprio.)
- **R2 (baixo):** `exam_documents.issuer` é texto livre (137) — superfície não estruturada; **mitigação:** caminho `Organization` (139) em ajuste posterior.
- **R3 (baixo):** dependência de `auth.uid()` (schema `auth`) nas policies — presente no Supabase real; em teste exige stub. Não é risco de produção.
- **R4 (gate):** retrofit de enum em `document_type`/`order_status` sobre dados legados — **fora** deste conjunto; permanece gate material.

## 6. Compatibilidade com o modelo canônico (confirmada por cadeia end-to-end)
Cadeia executada e **coerente** (evidência `INTEG_138_143_OK`):
```
Patient (139) → ServiceRequest (138) → [basedOn] resultado (exams+service_request_results) → Procedure (143) → DocumentReference (137/exam_documents)
                         ▲                          ▲
      Consent + AuditEvent (142)      Terminologia (141, coding NULL)     Provenance (exam_documents.source + srr.linked_by + party_identifiers)
```
- **Separação preservada:** solicitação ≠ resultado ≠ execução ≠ documento (entidades distintas; sem colisão de identidade).
- **`ServiceRequest` = representação canônica da solicitação.**
- **Bilateral preservado:** 2 `ServiceRequest` + **mesmo `requisition`** + **lateralidade individual** + **vínculo de resultado por solicitação** (só o lado com resultado é vinculado). ✅
- **`[NC]` preservados:** coding NULL em toda parte; nenhum código/identificador inventado.

## 7. Situação da #117 (137)
- **exam_documents / proveniência por documento / `exam_document_id` nos resultados / `primary_document_id`:** **compatíveis** com o modelo canônico (→ `DocumentReference`). Integram sem conflito.
- **`fulfills_order_id` / `order_status` (formalização):** **superados** pelo modelo de 1ª classe (138) — devem ficar **legado**, não canônico.
- **Ajustes recomendados (EXDOC-005 §9, não bloqueantes):** `content_type`/mime em `exam_documents`; papel `'solicitacao'`; `issuer`→`Organization`; enum de `order_status`/`document_type` (este último = gate de dados legados).
- **Veredito da #117 mantido: AJUSTAR** — **não** mesclar "como está" sem a decisão de que `fulfills_order_id` é legado; a porção documental é aproveitável.

## 8. VEREDITO — **APTO PARA MERGE (com condições)**
- **138→143 como conjunto: APTO PARA MERGE.** Aplicação ordenada limpa, idempotente, reversível (rollback reverso 143→137 sem perda; legado intacto), grafo de FKs íntegro, cadeia semântica coerente, sem conflitos.
- **Condições (deriváveis, não materiais):**
  1. **Ordem de merge = 137 → 138 → 139 → 140 → 141 → 142 → 143** (respeitando dependências).
  2. **#117 = AJUSTAR:** mesclar a porção `exam_documents`; **`fulfills_order_id` tratado como legado** (canônico = `service_request_results`).
  3. Wiring de aplicação (gravar por `service_request_results`, não por `fulfills_order_id`) fica para a Fase C (código), gate próprio.
- **Sem bloqueadores.** Nenhuma decisão material nova exigida para a integração estrutural em si.

## 9. Plano do próximo gate
```
(agora) EXDOC-015 — auditoria de integração → APTO PARA MERGE (condições §8)
   ↓ SUA decisão de merge (GATE MATERIAL — não autônomo)
Merge controlado 137→143 em preview/staging (com #117 AJUSTADA) — sem dados reais
   ↓
Fase C — projetores FHIR (código): serializar ServiceRequest/DiagnosticReport/Observation/Procedure/DocumentReference a partir deste schema
   ↓ testes com dados SINTÉTICOS (FHIR validator estrutural)
   ↓
(gates materiais posteriores) retrofit de enum legado · curadoria/terminologia · backfill de dados reais · RNDS/OpenCare
```

> **Nenhum merge nesta etapa.** Evidência entregue; a **decisão de merge** é gate material seu. Ao autorizar, executo o merge controlado na ordem §8 (preview/staging, dados sintéticos) e preparo a spec da Fase C (projetores FHIR).
