// Clinical Processing Engine — CONTRATO dos processadores por modalidade.
//
// REGRA ARQUITETURAL (fundadora 13/07, garantida por ARCH-processor-decoupling): um processador conhece
// APENAS a CertifiedCDU. Nunca PDF, Bundle, OCR, páginas ou Segmentação. Por isso este módulo é a ÚNICA
// porta de importação dos processadores: ele RE-EXPORTA o contrato da CDU; os processadores concretos
// importam só daqui (`./types`). Isso preserva o desacoplamento para sempre — trocar a fonte (DICOM/HL7/
// FHIR) muda o adaptador de conteúdo, nunca o processador.

export type { CertifiedCDU, CduContent } from '../identity-validator'
import type { CertifiedCDU } from '../identity-validator'

/** Forma do resultado que uma modalidade produz — a heterogeneidade que o modelo universal acomoda. */
export type ResultKind =
  | 'structured'   // biomarcadores (valor + unidade + referência) — painéis laboratoriais
  | 'narrative'    // achados textuais/laudo — imagem, neurofisiologia, patologia
  | 'parametric'   // parâmetros/medidas por região/olho/derivação — tomografia de córnea, OCT, densitometria

// ─────────────────────────────────────────────────────────────────────────────────────────────────────
// MODELO CLÍNICO — a ESTRUTURA clínica de uma modalidade (CONHECIMENTO médico), separada do PROCESSADOR
// (implementação que a preenche). Fundadora (14/07): o Modelo descreve; o processador só preenche. Assim
// desacoplamos conhecimento médico de implementação — e o Modelo é uma MODALIDADE (Hemograma, Perfil
// Lipídico, Mamografia, Tomografia de Córnea, EEG…), nunca uma FAMÍLIA ("Laboratório" é família).
// ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Um campo da estrutura clínica (o que a modalidade contém), sem dizer COMO extrair. */
export interface ClinicalModelField {
  name: string
  unit?: string
  /** medido por região/olho/derivação/segmento (ex.: por olho OD/OE). */
  regionAware?: boolean
}

/** A ESTRUTURA clínica de uma modalidade. Declarativa; sem lógica de extração. */
export interface ClinicalModel {
  /** id do MODELO (modalidade), kebab — ex.: 'corneal-tomography', 'hemogram', 'lipid-panel'. */
  id: string
  /** rótulo humano — ex.: 'Tomografia de córnea'. */
  label: string
  /** FAMÍLIA clínica a que pertence (agrupamento, NÃO a unidade de medida) — ex.: 'Laboratório'. */
  family: string
  resultKind: ResultKind
  /** Versão do contrato da estrutura (estável/versionada). */
  contractVersion: string
  /** Campos da estrutura clínica (conhecimento). Vazio p/ narrativos (a estrutura é achados/conclusão). */
  fields: ClinicalModelField[]
}

/** Um parâmetro/medida por região (olho OD/OE, derivação, órgão…). Modalidades `parametric`. */
export interface ProcessedParameter {
  name: string
  value: string
  unit?: string
  /** Região/lateralidade (ex.: 'OD', 'OE') quando a medida é por olho/derivação/segmento. */
  region?: string
  /** Auditabilidade (Certificação §4): página de origem (1-based) e trecho-fonte exato. */
  page?: number
  excerpt?: string
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
