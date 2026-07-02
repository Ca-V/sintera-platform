# SINTERA — Máquinas de Estado do Domínio (DOMAIN_STATE_MACHINE)

**Status:** Etapa 6 do fechamento do Domain Model (fundadora, 02/07/2026). Define **estados válidos e transições permitidas** de cada entidade relevante — elimina estados inconsistentes. Conceitual. Cada transição é disparada por um evento de `DOMAIN_EVENTS.md` e preserva as invariantes de `DOMAIN_INVARIANTS.md`. Ver `ADR-014`.
**Regra:** só as transições listadas são válidas. Qualquer outro caminho é um bug de domínio.

---

## Documento
```
RECEIVED → OCR_PENDING → OCR_COMPLETED → PARSER_COMPLETED → CATALOG_MATCHED
         → REVIEW_PENDING → APPROVED → PROJECTED → ARCHIVED
```
- Ramos: qualquer etapa de IA pode ir a `FAILED` (reprocessável → volta a `OCR_PENDING`). `REPLACED` (substituído) → o novo documento entra em `RECEIVED`; o antigo vai a `ARCHIVED` (preservado). Duplicado → `REJECTED_DUPLICATE` (não cria exame).
- Transições disparadas por: `DocumentUploaded`, `OCRCompleted`, `ParserCompleted`, `CatalogMatched`, `DocumentReviewed`, `DocumentApproved`, `DocumentReplaced`, `DocumentDuplicateDetected`.

## Exame
```
CREATED → INDEXED → VISIBLE → (REPLACED) → ARCHIVED
                          → DELETED
```
- `VISIBLE` é o estado corrente na Timeline. `REPLACED` = novo laudo → reprocessa (nova versão de medições). `DELETED` reprojetará séries.
- Disparos: `ExamCreated`, `MeasurementsExtracted`, `DocumentReplaced`, `ExamDeleted`.

## Medição
```
EXTRACTED → NORMALIZED → CATALOG_LINKED → PERSISTED → PROJECTED
                       → CATALOG_UNMATCHED (pendência de cobertura)
```
- `CATALOG_UNMATCHED` é terminal-temporário: aguarda curadoria; visível em "Outros" com nome cru; nunca some silenciosamente. Valor bruto é imutável em qualquer estado.

## Biomarcador (Catálogo)
```
DRAFT → CURATED → APPROVED → PUBLISHED → DEPRECATED
```
- Só `PUBLISHED` é consumível pela UI. `DEPRECATED` não apaga séries históricas (identidade `catalog_id` preservada). Reclassificação (painel/material) ocorre em `CURATED→APPROVED→PUBLISHED` de uma nova versão; dispara `CatalogUpdated` (reprojeta consumidores).

## Diretriz / Protocolo (Knowledge)
```
NEW → REVIEWED → PUBLISHED → SUPERSEDED
```
- `SUPERSEDED` mantém histórico. `PUBLISHED` é o que pode ser referenciado. Disparos: `GuidelineRevised`/`ProtocolUpdated`, `DocumentReviewed`, `DocumentApproved`.

## Produto (Medicamento / Suplemento / Dispositivo)
```
ACTIVE → SUSPENDED → RESUMED → ENDED → ARCHIVED
Dispositivo: CONNECTED ↔ DISCONNECTED
```
- Projeta para Timeline/Histórico/Gastos enquanto `ACTIVE`. Disparos: `MedicationAdded`/`SupplementAdded`, `DeviceConnected`.

---
## Regras gerais das máquinas de estado
1. **Transições explícitas** — apenas as listadas são válidas; o resto é inconsistência.
2. **Estados terminais preservam histórico** (`ARCHIVED`/`SUPERSEDED`/`DEPRECATED` não apagam auditoria nem quebram séries).
3. **Toda transição de estado gera `AuditRecorded`.**
4. **Falhas de IA são reprocessáveis**, nunca perdem o documento original.
5. **`CATALOG_UNMATCHED` é visível e monitorado** (cobertura), nunca silencioso.

---
**Fechamento:** os estados e transições acima são suficientes e corretos? Falta algum estado/ramo? Com o seu "ok", o Domain Model está **encerrado**.
