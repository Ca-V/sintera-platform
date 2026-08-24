# EXDOC-021 — Fase C (preparações read-only): fecha lacunas [a portar] + read-model source + runbook

> **Preparações read-only do EXDOC-020 §11.** Código puro + testes sintéticos. **Nenhum** dado real/infra real
> acessado. **Não** aplica Fase 0 em preview, **não** faz backfill, **não** toca produção/main/Ciclo 1/RNDS/OpenCare.
> Base: branch da Fase C (#147). **Data:** 2026-08-19.

## 1. O que foi feito (autônomo, dentro do escopo)
1. **`Provenance` por documento** portado ao projetor canônico (`prov-<doc>`: target→DocumentReference, agent=origem, entity=extraction_version; `recorded`=uploadedAt ou omitido `[NC]`).
2. **Status preliminar/final** portado: `DiagnosticReport.status` derivado dos papéis (`laudo_final`>`laudo_preliminar`>`registered`), **sem sobrescrever o evento** — preliminar e final coexistem como **N `presentedForm`** + **N `DocumentReference`** (nenhum apagado).
3. **`terminology_bindings`** ligados **só quando `status='confirmed'` com `system`+`code`** — `[NC]` **omitido**, LOINC/SNOMED/GAL **não** inferidos, códigos **não** criados; binding de outro alvo não vaza.
4. **read-model source abstrato** (`source.ts`): porta `CanonicalSource` + `loadCanonicalModel` + `createFakeSource` (sintético). **Adaptador real de banco NÃO incluído** (gate C).
5. **Runner de preview** (`preview.ts`): `runCanonicalPreview(source, scope)` puro (load→projeta→valida→sumariza). **Roteiro** em `docs/c2/preview_fhir_runbook.md` — **não executável** contra dados reais.
6. **Testes sintéticos** para tudo (`tests/fhir/canonical-fasec-extended.test.ts`).
7. **Documentação/evidências** (este EXDOC).

## 2. Arquivos alterados/criados (só novos; Ciclo 1 intocado)
- `src/lib/fhir/canonical/projector.ts` (estendido: Provenance, status prelim/final + presentedForm, terminologia confirmada)
- `src/lib/fhir/canonical/source.ts` (novo: porta + loader + fake)
- `src/lib/fhir/canonical/preview.ts` (novo: runner puro)
- `tests/fhir/canonical-fasec-extended.test.ts` (novo: 8 casos)
- `docs/c2/preview_fhir_runbook.md` (novo: roteiro, não executar)

## 3. Testes executados e resultados
| Suíte | Resultado |
|---|---|
| Fase C (projetor original + extensões) | **15/15** (7 + 8) |
| `tsc` (root) | **0** |
| `eslint` (arquivos novos) | **0** |
| **Suíte completa** | **1296 passed** (1281 + 15) · 0 falhas |

Cobertura sintética: Provenance (target/agent/entity/recorded) · preliminar+final (status=final, 2 presentedForm, 2 DocumentReference preservados) · só preliminar→preliminary · sem doc→registered · binding confirmado→coding · binding proposed→omitido · binding de outro alvo não vaza · loader compõe input · preview `approved` estrutural + counts (Provenance/ServiceRequest/DiagnosticReport) + bilateral agrupado.

## 4. Cobertura das lacunas `[a portar]` (EXDOC-020 §2)
| Lacuna | Estado |
|---|---|
| `Provenance` por documento | ✅ portado |
| status preliminar/final (sem sobrescrever) | ✅ portado (+ presentedForm) |
| terminologia ligada só se confirmada | ✅ (nunca `[NC]`/inferido) |
| read-model source + fakes | ✅ (adaptador real = gate C) |
| roteiro do preview | ✅ (não executado) |

## 5. Divergências
- Nenhuma semântica. Ajuste de processo: os arquivos foram realocados para a branch da Fase C (#147) — a base correta que contém `projector.ts`/`validate.ts` — em vez da branch de docs. Sem impacto de conteúdo.

## 6. Itens que permanecem `[NC]`
- **ValueSets/coding oficiais** (LOINC/SNOMED/GAL) — coding só entra por **binding confirmado**; sem curadoria, permanece omitido.
- **Identificadores oficiais** (CPF/CNS/CNES/CRM) — omitidos até `system` presente.
- **`recorded` de Provenance** quando não há `uploadedAt` — omitido `[NC]`.
- **Perfis BR-Core/RNDS, FHIR validator oficial, transporte** — Nível D (gate posterior).

## 7. Confirmação de não-acesso a dados reais/infra
- **Nenhum** dado real acessado; **nenhuma** conexão a banco/preview; **nenhuma** migração aplicada em preview; **nenhum** backfill; **produção/main/Ciclo 1 intocados**; **sem** RNDS/OpenCare. Tudo em **código puro + fixtures sintéticas**.

## 8. Separação A/B/C/D (mantida)
- **A (código × sintético):** ✅ ampliado (Provenance/status/terminologia/loader/preview).
- **B (modelo FHIR estrutural):** ✅ (invariantes) · perfil/validator oficial ❌.
- **C (dados reais em preview):** ⛔ **NÃO executado** — parado no gate.
- **D (RNDS/OpenCare):** ⛔ gate posterior.
> A/B **não** são evidência de C nem D.

## 9. Estado / gate
Preparações read-only **concluídas**. **Parado no Gate C** — não executo preview nem acesso dados reais sem sua autorização explícita.
