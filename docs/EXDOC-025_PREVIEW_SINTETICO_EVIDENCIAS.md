# EXDOC-025 — Preview Sintético (Nível C-ambiente, dados 100% sintéticos): evidências + veredito

> **Gate de Preview não produtivo — EXECUTADO.** Ambiente **Supabase separado da produção** (projeto descartável),
> **dados 100% sintéticos**, **zero acesso a produção/dados reais**, **zero backfill**, **sem RNDS/OpenCare**, sem
> `document_type`/`order_status` retrofit, sem migração 144, **sem `audit_events` persistente de auditoria**.
> **Data:** 2026-08-19.

## 1. Ambiente
- **Projeto de preview:** `sintera-fhir-preview` (`xfrlbtchkerhavqregeq`), free tier (US$0), região us-east-2 — **separado da produção** (`SINTERA`/`pxiglvrgxooawetboglb`, intocada).
- Branching (Pro) indisponível → optou-se por **projeto descartável** (autorizado). Stack Supabase real (auth/RLS/PostgREST).
- **Descarte:** projeto **pausado** ao fim; objetos canônicos removidos por rollback. (MCP só oferece `pause`; deleção definitiva pelo dashboard, se desejado — ref acima.)

## 2. Passos executados (1–11) — todos ✅
1. Provisionado preview separado. 2. Aplicadas 137→143 (real Supabase). 3. Reversibilidade validada. 4. Só dados sintéticos. 5. RLS via role `authenticated`+`auth.uid()` (**não** service_role). 6. Fluxo completo Supabase→canônico→projetor→validação. 7. RLS A×B. 8. Refs/bilateral/parcial/docs/Provenance/prelim-final/terminologia/casos. 9. Leitura read-only pós-setup; **sem `audit_events` de auditoria** (a linha inserida foi dado de teste, removida no rollback). 10. `file_url` não baixado; Bundle (sintético) não exportado. 11. Evidência agregada; artefatos descartados.

## 3. Evidências objetivas
| Verificação | Evidência | Resultado |
|---|---|---|
| Migrações 137→143 no Supabase real | `137_ok`…`143_ok` | ✅ aplicadas |
| **Reversibilidade** | rollback reverso 143→137: `canonicos_removidos=true`, `legado_intacto=true` | ✅ |
| **Read-set (13 tabelas)** | contagens: service_requests=2, resultEvents=1 (pedido excluído), demais=1 | ✅ colunas existem |
| Divergência `content_type` | não selecionado (é a 144, diferida) — adapter já corrigido (EXDOC-024) | ✅ sem erro |
| **RLS efetiva (authenticated)** | A vê 2 SR · B vê 1 · **B→A cross = 0** | ✅ isolado |
| **E2E projetor** (input extraído do Supabase) | `validateStructural.ok`, 0 refs não resolvidas; teste `preview-e2e` 5/5 | ✅ |
| Bilateral | 2 `ServiceRequest`, mesmo `requisition`, lateralidade esq/dir | ✅ |
| Resultado parcial | `basedOn` só do lado esquerdo (confirmado) | ✅ |
| Documento + Provenance | 1 `DocumentReference` + 1 `Provenance` (agente/entidade) | ✅ |
| Preliminar/final | `DiagnosticReport.status=final` (laudo_final) | ✅ |
| Terminologia confirmada | `Observation.code.coding` LOINC aplicado (binding confirmed) | ✅ |
| `[NC]` | CPF sem `system` → identificador oficial omitido (só id local) | ✅ nada inventado |

## 4. Checklist de risco (solicitado) — mapeamento
| Item | Resultado |
|---|---|
| RLS | ✅ efetiva (authenticated, não service_role); A×B isolados |
| Cardinalidade | ✅ 2 SR/requisition; 1 resultado→1 evento; vínculo por lado |
| Referências FHIR | ✅ 0 não resolvidas (`unresolvedReferences=[]`) |
| Documentos | ✅ `DocumentReference` + preservação (N presentedForm no projetor) |
| Provenance | ✅ por documento |
| Bilateralidade | ✅ 2 SR + requisition + lateralidade |
| ServiceRequest ↔ DiagnosticReport | ✅ `basedOn` só confirmado |
| Procedure | ✅ `basedOn`→SR, `report`→exame |
| Terminologia | ✅ coding só de binding confirmado; `[NC]` omitido |
| Dados incompletos | ✅ nulls omitidos; valueNum null → sem valueQuantity |
| Exposição de PII | ✅ dados sintéticos; Bundle não exportado; `file_url` não baixado; evidência agregada |
| Performance do read-set | ✅ 13 SELECTs escopados por `user_id` com índices; volume trivial (sintético) |
| Isolamento entre usuários | ✅ B→A cross = 0 |

## 5. VEREDITO — **APROVADO** (Preview Sintético / Nível C-ambiente)
O adapter + projetor + validação operam corretamente sobre um **Supabase real separado da produção**, com **RLS efetiva** e **dados sintéticos**, sem escrita funcional persistente e sem exposição de PII. Nenhuma inconsistência; nenhum caso exigiu correção (fail-safe não acionado).

**Ressalva de fidelidade (transparência):** o transporte usou o MCP (`execute_sql`) como executor; o mapeamento TS do `CanonicalSource` foi provado em `canonical-sqlsource.test` e o projetor rodou sobre o **input extraído do Supabase** (`preview-input.json`). A composição está provada; o wire final (cliente Supabase autenticado no app) é item do próximo gate.

## 6. O que falta para o **Gate de DADOS REAIS** (separado — NÃO abrir agora)
Conforme sua orientação, backfill é mudança material de dados e fica em **gate próprio**. Para o Nível C com dados reais:
1. **Ambiente**: preview com o **schema real de produção** (não stubs) — requer Pro/branching ou clone controlado.
2. **Backfill legado→canônico** (limitado/selecionado) — as tabelas 137→143 nascem vazias; sem isto não há dados canônicos reais.
3. **Cliente Supabase autenticado** no app (não service_role) para RLS efetiva em runtime.
4. **Revisão de privacidade** (PII real) + os controles de segurança do **Plano Mestre de Segurança** (gap assessment em curso).
5. Só então: validação com dados reais → evidências → decisão de expansão.

## 7. Estado
Preview sintético **APROVADO**. Produção intocada; ambiente descartado. **Não avanço** para dados reais/backfill/produção/RNDS sem seu gate específico.
