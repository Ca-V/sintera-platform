# EXDOC-016 — Revisão final de pré-merge estrutural (137→143 + #117)

> **Gate de Merge Controlado — REVISÃO READ-ONLY.** Transforma "APTO PARA MERGE (com condições)" (EXDOC-015) em
> decisão inequívoca. **NÃO faz merge**, backfill, remoção de legado, alteração destrutiva, produção, RNDS ou
> mudança do Ciclo 1. Apoia-se na evidência de integração `INTEG_138_143_OK` (EXDOC-015). **Data:** 2026-08-19.
> **Fonte governante:** Protocolo v1.0 → modelo canônico → matriz → EXDOC-015.

## 1. Reconciliação da #117 (migração 137) — partes
| Parte da 137 | Decisão | Justificativa |
|---|---|---|
| `exam_documents` (tabela + RLS + índices + único primário) | **ENTRA sem alteração** | Fundação do documento por evento → projeta `DocumentReference`; sem conflito. |
| `exams.primary_document_id` (FK → exam_documents) | **ENTRA sem alteração** | Documento primário/derivação. Compatível. |
| `exam_document_id` em `extraction_versions`/`biomarkers`/`clinical_results` (+ índices) | **ENTRA sem alteração** | Proveniência/resultado por documento (→ `Observation.derivedFrom`). Compatível. |
| `exams.fulfills_order_id` + `order_status` (+ FK self + índice) | **ENTRA, reclassificado LEGADO** | DDL aditivo, sem conflito; porém **não é o vínculo canônico** (ver §2). Nenhuma alteração de DDL necessária. |
| CHECK/enum em `document_type`/`order_status` | **FICA FORA** (não existe na 137) | Retrofit sobre dados legados = **gate material** à parte; a 137 corretamente **não** o faz. |
| `content_type`/mime em `exam_documents`; papel `'solicitacao'`; `issuer`→`Organization` | **AJUSTE ADITIVO DEFERIDO** (migração posterior) | Melhorias aditivas do EXDOC-005 §9; **não bloqueiam** o merge; entram como migração 144+ (spec, não agora). |

**Projeção `exam_documents` → `DocumentReference`:** `content.attachment.url`←`file_url`; `attachment.hash`←`document_sha256`; `type`←`document_role`; `date`←`uploaded_at`; autor/proveniência←`source`/`current_extraction_version_id`; `context.related`←`exam_id` (evento). (Confirmado também pelo projetor #119.)

## 2. Coexistência semântica — decisão explícita (sem alteração destrutiva)
| Papel | Mecanismo |
|---|---|
| **Fonte de verdade (canônico)** | `service_request_results → service_requests` (**ServiceRequest**) → projeta **`DiagnosticReport.basedOn`**. Vínculo por **solicitação/lado**, com **proveniência** e confirmação. |
| **Mecanismo de compatibilidade (legado)** | `exams.fulfills_order_id` (grão de pedido) **permanece** — **não removido**, **não backfillado**. |
| **Mecanismo de leitura (coexistência)** | Ler o vínculo por `service_request_results` (confirmado); usar `fulfills_order_id` **apenas** como fallback de leitura para registros **legados** sem `service_request_results`. |
| **Mecanismo de escrita futuro (Fase C)** | **Toda nova escrita** de vínculo vai para `service_request_results` (com proveniência). **`fulfills_order_id` NÃO recebe novas escritas** como mecanismo de vínculo. |
| **Convergência (gate futuro)** | Eventual backfill legado→canônico é **gate material** separado (não agora). |

**Invariante de governança:** o sistema tem **um único** mecanismo de verdade (`service_request_results`); `fulfills_order_id` é compatibilidade de leitura para o legado, nunca um segundo mecanismo de escrita. Confirmado: **`fulfills_order_id` não será usado como novo mecanismo de vínculo.**

## 3. Verificação do conjunto 137→143 (evidência EXDOC-015 · `INTEG_138_143_OK`)
| Item | Resultado |
|---|---|
| Ordem de aplicação | **137→138→139→140→141→142→143** (topológica; aplicação sem erro) |
| FKs / cardinalidades | grafo íntegro (srr→SR/exams; wiring 140→identidade ×3; procedures ×5; exam_documents→exams; primary_document_id; fulfills_order_id self) |
| RLS | habilitada nas 11 entidades (+ audit_events append-only) |
| `ON DELETE` | `set null` (atores/origem) e `cascade` (owner→dependentes) conforme spec |
| Índices / enums | presentes; enums sem colisão de nome |
| Idempotência | reaplicação 7/7 sem erro |
| Rollback | reverso 143→137 reversível; **legado intacto** |
| Ciclo 1 | **intocado** (nenhum `.ts/.tsx`; nenhuma tabela homologada alterada) |

## 4. Semântica FHIR suportada pela estrutura final (confirmada)
```
Patient (139) ─► ServiceRequest (138) ─► DiagnosticReport.basedOn (service_request_results→exams) ─► Observation (biomarkers/clinical_results, derivedFrom exam_documents)
                         └─► Procedure.basedOn (143)  (quando há execução)
DocumentReference (137/exam_documents) ─► documento original + proveniência (source/extraction_version)
```
- **Bilateral preservado:** **2 `ServiceRequest`** → **mesmo `requisition`** → **lateralidade individual** → **vínculo de resultado por solicitação** (evidência §C do EXDOC-015).
- **Separação canônica:** solicitação ≠ resultado ≠ execução ≠ documento (entidades distintas, sem colisão).
- **`[NC]` preservados:** coding NULL; nenhum código/identificador inventado.

## 5. VEREDITO ÚNICO — **MERGE AUTORIZÁVEL**
O conjunto **137→143 é MERGE AUTORIZÁVEL** na ordem §3, **sem** alteração estrutural obrigatória antes do merge, **desde que** adotada a **política de coexistência §2** (documental, sem DDL):
- **Nenhum ajuste de DDL é pré-requisito do merge.** A "condição AJUSTAR" da #117 resolve-se por **política** (`fulfills_order_id` legado; canônico = `service_request_results`) + **follow-ups aditivos deferidos** (content_type / papel 'solicitacao' / issuer→Organization) — que **não** bloqueiam.
- **Sem bloqueadores.** Sem duplicidade de fonte de verdade (garantida pela política §2). Sem destrutivo. Ciclo 1 intocado.

### 5.1 Ajustes registrados (spec, NÃO implementar agora — não bloqueiam o merge)
Migração aditiva **144** (futura, gate próprio): `exam_documents.content_type text`; `document_role` aceitar `'solicitacao'`; caminho `exam_documents.issuer`→`organizations`. Puramente aditivo/reversível.

## 6. Plano exato de merge (a executar SOMENTE após sua autorização final)
```
Pré: base = feat/mobile-inc4-perfil (integração). Merge em preview/staging — SEM dados reais.
Ordem de merge (respeita dependências):
  1. PR #117  (137 exam_documents/#117)  — com a POLÍTICA §2 registrada (fulfills_order_id = legado)
  2. PR #137  (138 service_requests + service_request_results)
  3. PR #138  (validação D-1/D-2 — empilhada em 138)
  4. PR #139  (139 identidade)
  5. PR #140  (140 wiring — depende de 138+139)
  6. PR #141  (141 terminologia)
  7. PR #142  (142 Consent/AuditEvent)
  8. PR #143  (143 Procedure — depende de 138+139)
  9. PR #144  (EXDOC-015 auditoria) + EXDOC-016 (este)
Pós-merge (Fase C, gate próprio): projetores FHIR sobre dados SINTÉTICOS; sem backfill/produção/RNDS.
```
> **Nota:** cada PR permanece **draft** até sua autorização; o merge é **gate material**. Não executo nenhum merge nesta etapa.

## 7. Fora de escopo (permanecem gates materiais)
Backfill real · retrofit de enum legado (`document_type`/`order_status`) · convergência legado→canônico · produção · RNDS · OpenCare · alteração do baseline do Ciclo 1.

> **Nenhum merge nesta etapa.** Veredito **MERGE AUTORIZÁVEL** entregue; aguardo sua **autorização final de merge** (gate material).
