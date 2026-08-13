# ADR-CK-001 — Arquitetura de Conhecimento Clínico (camadas DUE · Terminologia · Conhecimento)

**Status:** decisão registrada (implementação faseada, governada). Origem: fundadora 13/08.
**Relaciona:** ADR-DUE-001 · backlog C6 (Clinical Knowledge Service) · C7 (Terminology Service).

## Contexto

A proposta inicial fundia **Terminologia** (qual o código/nome oficial) e **Conhecimento Clínico** (o que o exame
significa). São responsabilidades distintas. Sem essa separação, cada superfície (Web, Mobile, IA, Insights,
Relatórios) tenderia a reimplementar "o que é este exame", com risco de inconsistência e de IA gerando conteúdo livre.

## Decisão — 4 camadas, responsabilidade única

```
Documento → OCR/IA → Document Understanding Engine → Terminology Service → Clinical Knowledge Service → Superfícies
                       "o que EXISTE no doc?"          "qual o CÓDIGO         "o que SIGNIFICA?"        (Web · Mobile ·
                       (fatos + evidências)             oficial?" (LOINC/       (objeto padronizado,      IA · Insights ·
                                                        SNOMED/RNDS)            educacional, com fontes)  Relatórios)
```

- **DUE** (existe): metadados + evidências do documento. **Não** possui conhecimento clínico. (Implementado — ADR-DUE-001.)
- **Terminology Service** (código): resolve nome canônico + código oficial (LOINC lab/observações · SNOMED CT
  procedimentos · RNDS/MS-FHIR BR); cache versionado; IA só propõe candidatos, a terminologia decide. (Backlog C7.)
- **Clinical Knowledge Service** (significado): dado um conceito, devolve um **objeto padronizado** reutilizável por
  TODAS as superfícies. (Backlog C6 — inclui "O que é este exame?".)

## Contrato do Clinical Knowledge Service (contrato-primeiro)

Cada ATRIBUTO carrega sua própria proveniência (`Sourced<T>`) — não uma proveniência única do objeto:

```ts
interface Sourced<T> { value: T; source: string; version: string | null; confidence: 'high'|'medium'|'low'; lastReviewed: string | null }
interface ClinicalKnowledge {
  canonicalName: Sourced<string>      // fonte: LOINC/SNOMED
  aliases:       Sourced<string[]>
  purpose:       Sourced<string>      // fonte: diretrizes/sociedades (AAO, ESCRS, SBO…)
  bodySystem:    Sourced<string>
  specialty:     Sourced<string>
  measures:      Sourced<string[]>    // o que normalmente avalia
  whenIndicated: Sourced<string>
  limitations:   Sourced<string>
  references:    Sourced<string[]>    // fontes científicas (diretrizes; PubMed via CURADORIA, não runtime)
  terminology:   { system: 'LOINC'|'SNOMEDCT'|'RNDS'; code: string; version: string } | null
}
```

## Princípios (permanentes)

1. **Proveniência por atributo.** Terminologia ← LOINC/SNOMED; explicação ← diretrizes/sociedades; evidência ←
   PubMed/revisões (via curadoria); classificação ← terminologia oficial/Base SINTERA. Cada campo diz sua origem.
2. **IA só identifica/mapeia candidatos** — nunca é a autoridade do nome nem autora do conteúdo educativo.
3. **Governança maior no Conhecimento que na Terminologia:** conteúdo educativo exige **revisão clínica + fonte +
   data + responsável técnico** (mais perto da linha RDC-657). PubMed alimenta a **curadoria**, não o runtime.
4. **Cache versionado nos DOIS serviços** (nunca muta versão antiga) → reprodutibilidade do que o usuário viu.
5. **Consumo único:** Web, Mobile, IA, Insights e Relatórios usam a MESMA resposta → consistência + auditabilidade.

## Estado da implementação (migração estrutural INICIADA)

As três camadas já existem como componentes de responsabilidade única (contrato-primeiro, sem quebra de compat.):
- **DUE** — `src/lib/capture/document-understanding.ts`: devolve **só fatos + evidências**. **Não** decide o nome.
- **Terminology Service** — `src/lib/terminology/terminology-service.ts`: `resolveTerminology(du)` decide o nome
  canônico/provisório + proveniência. O `EXAM_CATALOG` (binding equipamento→exame) **migrou do DUE para cá**.
- **Clinical Knowledge Service** — `src/lib/clinical-knowledge/clinical-knowledge-service.ts`: contrato público
  (`ClinicalKnowledge`, `Sourced<T>`, `getClinicalKnowledge()`), stub retorna null até a curadoria (backlog C6).
- **Consumo:** a rota de análise (`analyze`) consome o Terminology Service para o nome do exame de imagem.

## Evolução (governada, incremental — NÃO bloqueia entrega)

O que falta é evolução de conteúdo/integração, não estrutura: ancorar entradas do catálogo a LOINC/SNOMED
(`ExamCatalogEntry.terminology`), cache versionado, e curadoria do Clinical Knowledge (C6/C7). É governado
(licença SNOMED, revisão clínica) e ocorre **em paralelo** à estabilização — sem interromper o fluxo. Todo novo
desenvolvimento documental já programa contra estes contratos; nada cresce dentro do DUE para depois ser desmontado.
