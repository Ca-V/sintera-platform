// AI Gateway — tipos centrais
// DMEAV: Fase 1, F1-M1 (Gateway) + F1-M2 (Dual Pipeline)

export type ExtractionPath = 'text' | 'pdf_native'

export interface AIProvider {
  readonly name: string
  readonly model: string
  extractBiomarkers(input: ExtractionInput): Promise<ProviderResult>
}

export interface ExtractionInput {
  examId: string
  userId: string
  systemPrompt: string
  userTemplate: string
  temperature: number
  maxTokens: number
  // Path A — texto extraído do PDF
  examText?: string
  // Path B — PDF nativo Anthropic (F1-M2)
  // NOTA DMEAV: usa header beta 'anthropic-beta: pdfs-2024-09-25'
  // Dependência externa sujeita a alteração pela Anthropic.
  pdfBuffer?: Buffer
  extractionPath: ExtractionPath
}

export interface ProviderResult {
  rawResponse: string
  promptTokens: number
  completionTokens: number
  model: string
  durationMs: number
}

export interface ExtractedBiomarker {
  name: string
  value: number | null
  unit: string | null
  referenceMin: number | null
  referenceMax: number | null
  rangeExtracted: boolean
  referenceSource: 'laudo'
  rawText: string
  confidence: number
  extractionNotes: string | null
}

export interface ExtractionResult {
  biomarkers: ExtractedBiomarker[]
  examType: string
  extractionNotes: string | null
  aiLogId: string
  model: string
  provider: string
  promptVersion: string
  promptTokens: number
  completionTokens: number
  durationMs: number
  truncated: false
  parsedOk: boolean
  extractionPath: ExtractionPath
}

export type GatewayErrorCode =
  | 'RATE_LIMIT_EXCEEDED'
  | 'NO_ACTIVE_PROMPT'
  | 'PROMPT_INTEGRITY_VIOLATION'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_ERROR'
  | 'PARSE_FAILED'
  | 'NO_BIOMARKERS'
  | 'SCHEMA_INVALID'

export interface GatewayError {
  code: GatewayErrorCode
  message: string
  httpStatus: number
}

export interface RawAIResponse {
  exam_type?: unknown
  biomarkers?: unknown[]
  extraction_notes?: unknown
}

export interface RawBiomarker {
  name?: unknown
  value?: unknown
  unit?: unknown
  reference_min?: unknown
  reference_max?: unknown
  range_extracted?: unknown
  raw_text?: unknown
  confidence?: unknown
  extraction_notes?: unknown
}
