// Clinical Pipeline — CONTRATOS CONGELADOS (ADR-CP-001). O que nasce do pipeline é uma ENTIDADE: Clinical Identity.
// Toda a plataforma (linha do tempo · Insights · IA · Busca · Agenda · Relatórios · Mobile) consome ESTES contratos
// sem alterá-los — nenhum módulo reinterpreta o documento. Cada camada tem responsabilidade única (ADR-ARCH-002):
//   DUE (observa) → Terminology Service (oficial: LOINC/SNOMED/TUSS/RNDS) → Internal Clinical Catalog (preenche
//   lacunas com nome canônico provisório + sinônimos) → Clinical Knowledge → Evidence. A ORQUESTRAÇÃO registra as
//   decisões (Decision Log) e produz a Clinical Identity — não o DUE, não a Terminologia.
import type { UnderstandingReport } from '@/lib/capture/document-understanding'
import type { PIPELINE_VERSIONS } from '@/lib/capture/pipeline-versions'

/** Origem do NOME (proveniência): oficial (terminologia) · mapeamento interno (provisório) · documento · pendente. */
export type NameSource = 'terminology-official' | 'internal-mapping' | 'document' | 'pending'

/** Referência a uma terminologia clínica OFICIAL (autoridade — LOINC/SNOMED/TUSS/RNDS). */
export interface TerminologyRef { system: 'LOINC' | 'SNOMEDCT' | 'TUSS' | 'RNDS'; code: string; version: string }

/** Passo de decisão ESTRUTURADO (não textual) — auditoria/filtros/métricas/analytics sem interpretar texto. */
export interface DecisionStep {
  step: 'due' | 'terminology' | 'mapping' | 'knowledge' | 'evidence'
  status: string                 // ex.: 'ok'|'matched'|'not_available'|'provisional'|'pending'|'not_found'|'illegible'
  rule?: string                  // ex.: 'CAT-017'
  detector?: string              // ex.: 'date'
  input?: string
  output?: string
  confidence?: number            // 0..1
  reason?: string                // ex.: 'illegible'
}

/** Perfil de confiança: por atributo (0..1) + GLOBAL + se pode ser aceito automaticamente ou requer revisão. */
export interface ConfidenceProfile {
  attributes: Record<string, number>
  overall: number
  autoAcceptable: boolean
}

/** CLINICAL IDENTITY — resultado OFICIAL do pipeline, consumido por toda a plataforma. */
export interface ClinicalIdentity {
  resolutionId: string           // ex.: 'RES-2026-00001983' — estável, independente do exame
  name: string | null            // nome de exibição (oficial quando `codes`≠[]; senão provisório)
  category: string | null
  modality: string | null
  codes: TerminologyRef[]        // códigos oficiais quando resolvidos (vazio enquanto provisório)
  aliases: string[]
  equipment: string | null       // guardado SEPARADAMENTE — nunca é o nome
  examDate: string | null
  patientName: string | null
  issuer: string | null
  provisional: boolean
  nameSource: NameSource
  basis: string[]                // fontes do nome provisório (ex.: 'AAO','SBO','fabricante')
  confidence: ConfidenceProfile
}

/** DECISÃO da data — INTERPRETAÇÃO determinística (Pipeline), sobre as OBSERVAÇÕES do DUE. Classifica cada data
 *  pelo rótulo/região OBSERVADOS (não pela IA), escolhe a de realização, descarta as demais com motivo. Auditável. */
export type DateSemantics = 'realization' | 'print' | 'birth' | 'calibration' | 'protocol' | 'unknown'
export interface DateDecision {
  considered: { value: string; iso: string | null; label: string | null; region: string | null; semantics: DateSemantics; confidence: number | null }[]
  chosen: { value: string; iso: string; reason: string } | null
  discarded: { value: string; semantics: DateSemantics; reason: string }[]
  outcome: 'resolved' | 'reading_failure' | 'decision_ambiguous' | 'no_date'
}

/** PIPELINE AUDIT — orquestração + saídas por camada. Persistido por documento (rastreabilidade). */
export interface PipelineAudit {
  pipeline: {
    resolutionId: string
    startedAt: string
    finishedAt: string
    versions: typeof PIPELINE_VERSIONS
    decisionLog: DecisionStep[]
    finalStatus: 'resolved' | 'provisional' | 'pending'
  }
  due: UnderstandingReport | null
  terminology: { official: TerminologyRef | null }
  mapping: { matched: boolean; equipment: string | null }
  dateDecision: DateDecision           // interpretação determinística da data (sobre as observações do DUE)
  knowledge: { status: 'pending' | 'resolved' }
  evidence: { status: 'pending' | 'resolved' }
}

/** CLINICAL CONTEXT — CRESCIMENTO natural da Clinical Identity (o "O que é este exame?"). Contrato CONGELADO,
 *  populado no futuro pelo Clinical Knowledge + Evidence Services (C6/C8). Cada campo com PROVENIÊNCIA (fonte). */
export interface ClinicalContext {
  suggestedPeriodicity: string | null
  specialty: string | null
  organ: string | null
  bodySystem: string | null
  group: string | null
  explanation: string | null       // "o que é / para que serve / como funciona"
  evidenceLevel: string | null
  sources: string[]                // fontes reconhecidas (AAO, SBO, ESCRS, diretrizes, LOINC…)
  lastReviewed: string | null
}
