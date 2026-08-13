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

/** EVIDENCE — camada intermediária NORMALIZADA. A Decisão consome Evidence, NUNCA a observação crua — desacopla
 *  o motor de decisão da ORIGEM (DUE/OCR/DICOM/PDF/HL7/manual). Todos os detectores produzem Evidence. */
export interface Evidence {
  id: string
  observationId: string | null   // origem (null = não veio de observação; ex.: extração/entrada manual)
  source: string                 // 'due' | 'ocr' | 'extractor' | 'dicom' | 'pdf' | 'hl7' | 'manual'
  type: string                   // 'date' | 'patient_name' | 'physician' | …
  raw: string
  normalized: string | null      // valor normalizado (ex.: ISO para data)
  label: string | null
  region: string | null
  confidence: number | null
}

/** Código DETERMINÍSTICO de rejeição — base para métricas (quais detectores/fabricantes/layouts mais confundem). */
export type RejectionCode = 'BIRTH_DATE' | 'PRINT_DATE' | 'CALIBRATION_DATE' | 'PROTOCOL_DATE' | 'INCOMPLETE_DATE' | 'AMBIGUOUS' | 'NOT_ELIGIBLE'
export interface RejectedEvidence { evidenceId: string; reasonCode: RejectionCode; reason: string }

/** RESOLVED FACT — saída do motor GENÉRICO (Resolved Fact Engine): o MESMO mecanismo resolve data, paciente, médico,
 *  laboratório, modalidade, lateralidade… Registra ACEITA (chosenEvidenceId) E REJEITADAS (com CÓDIGO) — explica não
 *  só a decisão, mas POR QUE cada alternativa foi descartada (rastreabilidade completa + métricas). */
export interface ResolvedFact {
  attribute: string              // 'examDate' | 'patientName' | 'physician' | …
  value: string | null
  chosenEvidenceId: string | null
  considered: Evidence[]
  rejected: RejectedEvidence[]
  outcome: 'resolved' | 'reading_failure' | 'decision_ambiguous' | 'no_evidence'
  reason: string | null
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
  resolutions: ResolvedFact[]          // fatos resolvidos pelo motor genérico (hoje: data; amanhã: paciente, médico…)
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
