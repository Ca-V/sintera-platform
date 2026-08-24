# EXDOC-019 — Fase C: projetores FHIR (camada pura) + evidências

> **Fase C — IMPLEMENTADA em camada PURA, validada com DADOS SINTÉTICOS.** Sem IO/rede/DB real, sem RNDS/OpenCare,
> sem backfill, sem alteração de `document_type`/`order_status` legados, sem produção, **Ciclo 1 intocado**.
> Segue a spec EXDOC-018. **Data:** 2026-08-19.

## 1. O que entra (código puro)
- `src/lib/fhir/canonical/projector.ts` — `projectCanonicalToFhir(input)`: projeta o schema canônico (137→143) para um **Bundle FHIR R4** (collection), determinístico e puro. Recursos: **Patient, Practitioner, Organization, ServiceRequest, DiagnosticReport, Observation, Procedure, DocumentReference**.
- `src/lib/fhir/canonical/validate.ts` — `validateStructural(bundle)`: invariantes estruturais (referências resolvem; ids de DiagnosticReport únicos; sem acoplamento RNDS; coding honesto) + `requisitionGroups`.
- `tests/fhir/canonical-projector.test.ts` — 7 casos com fixtures **sintéticas**.

## 2. Regras aplicadas (Protocolo v1.0 / modelo canônico)
- **Vínculo canônico:** `DiagnosticReport.basedOn` vem **só** de `service_request_results` **confirmados**. `fulfills_order_id` **não** é usado.
- **Bilateral:** 2 `ServiceRequest` com o **mesmo `requisition`**; `basedOn` por **lado** (só o lado com resultado confirmado).
- **`[NC]` omitido, nunca inventado:** `coding` só quando `system`+`code` reais; identificador oficial só quando `system` presente (senão, apenas id local `urn:sintera:local`).
- **Separação:** `ServiceRequest` (solicitação) ≠ `DiagnosticReport`/`Observation` (resultado) ≠ `Procedure` (execução) ≠ `DocumentReference` (documento).
- **`Observation.derivedFrom → DocumentReference`** (via `exam_document_id`); **`Procedure.basedOn → ServiceRequest`**, `report → DiagnosticReport`.
- **Pureza:** sem `Date.now`, sem IO, sem rede, sem RNDS.

## 3. Evidências
| Verificação | Resultado |
|---|---|
| Projeta todos os recursos canônicos + grafo valida (`validateStructural.ok`) | ✅ |
| Bilateral: 2 `ServiceRequest`, mesmo `requisition`, lateralidade individual | ✅ |
| `basedOn` só do lado confirmado (parcial: esquerdo sim, direito não) | ✅ |
| `[NC]`: `coding` **não** inventado (system NULL ⇒ só `text`); identificador oficial omitido (só id local) | ✅ |
| `Procedure.basedOn`/`report` e `Observation.derivedFrom` resolvem; **0 referências não resolvidas** | ✅ |
| Coding **honesto**: com `system`+`code` reais, o `coding` é emitido | ✅ |
| Sem acoplamento RNDS no grafo | ✅ |
| **tsc 0 · lint 0 · teste Fase C 7/7 · suíte completa 1288 passed** (era 1281 + 7) | ✅ |
| **Ciclo 1 intocado** (só arquivos novos em `src/lib/fhir/canonical/` e `tests/fhir/`) | ✅ |

## 4. Reconciliação com #119
Esta camada **canônica** (sobre 137→143) supera o projetor do #119 (fixture da Fase 0, baseado em `fulfills_order_id`). Recomenda-se **fechar/superar o #119** por esta implementação. A fonte de solicitação é agora `service_requests`; o vínculo, `service_request_results`.

## 5. Gaps / `[NC]` / divergências
- **Read-model source (banco → input):** ainda **não** implementado — a projeção opera sobre o **input canônico normalizado**; ligar à leitura read-only do banco (queries) é o próximo passo (código puro de leitura, sem escrita). Mantido fora deste componente para não acoplar a fonte de dados agora.
- `[NC]` ValueSets/coding oficiais — omitidos até curadoria.
- Sem serialização/transporte RNDS, Bundle-document, Composition ou perfis — **fora de escopo** (gates materiais).
- **Divergências:** nenhuma.

## 6. Estado / próximo passo
Fase C (projetores + validação estrutural sobre sintético) **concluída**. Próximo passo **derivável e dentro do escopo da Fase C**: **read-model source** (leitura read-only do schema canônico → `CanonProjectionInput`) + testes de fim-a-fim com fixtures do schema (ainda sintético). **Gate material** permanece para: dados reais/backfill, retrofit de enum legado, perfis/transporte RNDS/OpenCare, produção. Prossigo no read-model source sob o regime autônomo, salvo redirecionamento.
