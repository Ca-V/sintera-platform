# FHIR-005 — Adaptador Supabase do loader + validação com dado real (preview isolado)

**Status:** adaptador IMPLEMENTADO e testado (mock, sem banco). Migração Fase 0 + loader + projeção FHIR **validados com DADO REAL** num Postgres **local isolado** (efêmero) — **produção intocada; nada aplicado no Supabase**. Sem RNDS, sem #118, sem ampliar escopo. Congelados intocados.

## 1. Adaptador (`src/lib/fhir/supabaseExamSource.ts`)
`createSupabaseExamSource(db)` implementa `ExamReadModelSource` sobre um **cliente mínimo** (subset PostgREST). Mappers **puros** (`mapExamRow`/`mapDocumentRow`/`mapResultFromBiomarker`/`mapResultFromClinical`) — testados com cliente fake (`FUNC-fhir-supabase-source.test.ts`, 9 casos). O `SupabaseClient` real é passado (com cast) só no **wiring gated**; este módulo **não conecta nem executa** nada ao importar. Pré-check confirmou que os mappers batem com o schema real (`biomarkers`/`clinical_results`/`profiles`).

## 2. Runbook da validação (o que foi executado — e onde)
Executado num **Postgres 16 local isolado** (não Supabase), semeado com **cópia read-only** de um exame REAL não-congelado (id `33670c0b`, laboratorial, 1 resultado):
1. **Migração 137** aplicada (DDL aditivo). ✓
2. **Backfill** aplicado (exclui congelados). ✓ — criou 1 `exam_document` (`is_primary=true`, `document_role=laudo_final`), setou `primary_document_id`, propagou `exam_document_id` ao resultado.
3. **Validação estrutural** (`validation_137.sql`): tabela/colunas/RLS ✓; **`file_url` do exame == documento primário** (0 divergências) ✓; 0 exame sem documento; 0 com >1 primário; 0 FK órfã; 0 resultado inconsistente; **congelados sem `exam_documents`/`primary_document_id`** ✓.
4. **Rollback** testado (em execuções anteriores): reverte tabela/colunas, **preserva `fulfills_order_id`**. ✓
5. **Loader → mapeador → projetor FHIR** sobre o dado real backfillado:
   - **um `DiagnosticReport`** (evento único), `status=final` (documento `laudo_final`), `code` = nome do exame; 1 `presentedForm`.
   - 1 `DocumentReference` + 1 `Provenance` com a `extraction_version` real (rastreabilidade).
   - `Observation` do resultado real (`valueQuantity` + unidade) com `derivedFrom` = documento primário.
   - **referências internas todas consistentes**; **zero acoplamento RNDS**; `Patient` com id **local** (cai para `user_id`, sem CPF/CNS).
6. Teste temporário + dado real: **removidos** (não commitados — privacidade); pg local **limpo**.

## 3. Divergências (a reportar — conforme regra do gate)
1. **Ambiente:** a validação foi feita em **Postgres local isolado**, **não** num branch Supabase. Motivo: (a) produção não pode ser tocada; (b) **não existe branch Supabase com o dado real** (previews Vercel usam a mesma base de produção); (c) um branch Supabase teria **custo** e **não** traria o dado de produção. O local deu validação com dado real, sem custo nem risco. Se você quiser o apply canônico num **branch Supabase**, é autorização à parte.
2. **Caso Doppler com dado real:** **não é demonstrável** hoje — `0f5ec205` (laudo "Ultrassom") e `ab5b5816` (pedido) estão **congelados** (excluídos do backfill), e o **laudo formal ainda não existe** nos dados. O cenário preliminar+final multi-documento permanece **fixture** (já validado) até o laudo formal ser anexado e/ou os congelados serem backfillados (gate próprio). A validação com dado real usou, por isso, um exame laboratorial real equivalente.

## 4. Recomendação para o próximo gate
- **Nada em produção** ainda. O DDL é aditivo/reversível e já validado (local + estrutural + real-data).
- Próximo gate = **sua autorização para aplicar a Fase 0 no Supabase** — preferencialmente num **branch** (preview canônico) ou, se aceitar, direto na base com snapshot (isso já seria "produção" → gate separado explícito). Depois: ligar o `createSupabaseExamSource` ao `SupabaseClient` real, carregar um exame real e reprojetar.
- RNDS e #118 permanecem fora.
