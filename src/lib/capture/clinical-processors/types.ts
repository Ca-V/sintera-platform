// Clinical Processing Engine — CONTRATO dos processadores por modalidade.
//
// REGRA ARQUITETURAL (fundadora 13/07, garantida por ARCH-processor-decoupling): um processador conhece
// APENAS a CertifiedCDU. Nunca PDF, Bundle, OCR, páginas ou Segmentação. Por isso este módulo é a ÚNICA
// porta de importação dos processadores: ele RE-EXPORTA o contrato da CDU; os processadores concretos
// importam só daqui (`./types`). Isso preserva o desacoplamento para sempre — trocar a fonte (DICOM/HL7/
// FHIR) muda o adaptador de conteúdo, nunca o processador.

export type { CertifiedCDU, CduContent } from '../identity-validator'
import type { CertifiedCDU } from '../identity-validator'

/** Um parâmetro/medida por região (olho OD/OE, derivação, órgão…). Modalidades `parametric`. */
export interface ProcessedParameter {
  name: string
  value: string
  unit?: string
  /** Região/lateralidade (ex.: 'OD', 'OE') quando a medida é por olho/derivação/segmento. */
  region?: string
}

/** Resultado paramétrico (Pentacam, OCT, densitometria, ECG…). */
export interface ParametricOutput { kind: 'parametric'; parameters: ProcessedParameter[] }
/** Resultado narrativo/achados (imagem, neurofisiologia, patologia). */
export interface NarrativeOutput { kind: 'narrative'; findings: string[]; conclusion?: string }
/** Resultado estruturado/biomarcadores (laboratório). */
export interface StructuredOutput { kind: 'structured'; biomarkers: { name: string; value: string; unit?: string }[] }

export type ProcessorOutput = ParametricOutput | NarrativeOutput | StructuredOutput

export interface ProcessorResult {
  /** Saída da modalidade, ou null quando nada foi extraível com confiança → document_only (preserva o doc). */
  output: ProcessorOutput | null
  clinicalModel: string
  contractVersion: string
  /** Unidades que o processador estruturou — alimenta a COBERTURA (descoberto × estruturado). */
  extractedUnits: number
  /** Auditoria: o que foi extraído e ressalvas (nunca inventar; honestidade sobre incerteza). */
  notes: string[]
}

/** Um processador é uma função PURA CertifiedCDU → ProcessorResult. Determinística; sem I/O. */
export type ClinicalProcessorFn = (cdu: CertifiedCDU) => ProcessorResult
