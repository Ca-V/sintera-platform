# ADR-CP-001 — Clinical Pipeline: Clinical Identity, orquestração e contratos CONGELADOS

**Status:** decisão registrada — contratos **congelados**. Origem: fundadora 13/08. Relaciona: ADR-DUE-001 ·
ADR-CK-001 · ADR-ARCH-002.

## Decisão

O pipeline clínico produz uma ENTIDADE oficial — **Clinical Identity** — consumida por **toda** a plataforma
(linha do tempo · Insights · IA · Busca · Agenda · Relatórios · Mobile). Nenhum módulo reinterpreta o documento.

```
Documento → OCR/IA → DUE (observa) → Terminology Service (oficial) → Internal Clinical Catalog (lacuna) → [Clinical Knowledge] → [Evidence]
                                        └──────────── ORQUESTRAÇÃO (decisões + Clinical Identity + Pipeline Audit) ────────────┘
```

### Fronteiras (quem faz o quê)

- **DUE** — só OBSERVA (fatos + evidências + razão de ausência). Não decide nome, não conhece terminologia/KB.
- **Terminology Service** — AUTORIDADE oficial (LOINC · SNOMED CT · TUSS · RNDS). Stub até C7 → "sem conceito oficial".
- **Internal Clinical Catalog** — **≠ Terminologia**. Catálogo INTERNO curado que preenche LACUNAS (nome canônico
  PROVISÓRIO + sinônimos) quando não há conceito oficial. Nunca chamado de "terminologia".
- **Orquestração (Clinical Pipeline)** — chama as camadas, registra as DECISÕES (Decision Log) e emite a
  **Clinical Identity** + o **Pipeline Audit**. As decisões pertencem AQUI, não ao DUE nem à Terminologia.
- **Clinical Knowledge / Evidence** — etapas futuras (C6/C8), registradas como `pending`.

## Contratos CONGELADOS (`src/lib/clinical-pipeline/contracts.ts`)

- **`ClinicalIdentity`** — resolução oficial: `resolutionId · name · category · modality · codes[] · aliases ·
  equipment · examDate · patientName · issuer · provisional · nameSource · basis · confidence`.
- **`ConfidenceProfile`** — confiança por atributo (0..1) + **`overall`** + **`autoAcceptable`** (aceite
  automático × revisão).
- **`DecisionStep`** — log ESTRUTURADO (não textual): `{ step, status, rule?, detector?, input?, output?,
  confidence?, reason? }` → auditoria/filtros/métricas/analytics sem interpretar texto.
- **`PipelineAudit`** — `{ pipeline: { resolutionId, startedAt, finishedAt, versions, decisionLog, finalStatus },
  due, terminology, internalCatalog, knowledge, evidence }`. Persistido em `exams.understanding_report`.
- **`resolution_id`** (`exams.resolution_id`, ex.: `RES-2026-00001983`) — id ESTÁVEL da decisão, independente do
  exame (replay/auditoria; sequência `next_resolution_id()`).
- **`NameSource`** — `terminology-official | internal-catalog | document | pending`. Nunca "kb".
- **`PIPELINE_VERSIONS`** — versões dos componentes persistidas → "por que este nome? DUE x + Terminologia y em <data>".

## Congelamento

A partir daqui, **toda evolução futura** (novos exames, IA, Insights, Mobile, Relatórios, Busca) **consome estes
contratos sem alterá-los**. Mudança de contrato exige novo ADR. Mudança que faça uma camada assumir responsabilidade
de outra viola ADR-ARCH-002. Evolução de CONTEÚDO (ancorar catálogo a LOINC/SNOMED, curadoria do Knowledge/Evidence)
ocorre atrás dos contratos, governada, sem quebrar consumidores.
