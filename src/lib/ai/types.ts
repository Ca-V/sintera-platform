// AI Gateway — tipos centrais
// Referência DMEAV: Fase 1, F1-M1

export interface AIProvider {
  readonly name: string
  readonly model: string
  extractBiomarkers(input: ExtractionInput): Promise<ProviderResult>
}

export interface ExtractionInput {
  examText: string           // texto completo do PDF — sem truncamento
  examId: string
  userId: string
  systemPrompt: string       // injetado pelo Gateway via prompt_registry
  userTemplate: string       // template com {{examText}}
  temperature: number
  maxTokens: number
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
  rangeExtracted: boolean       // true somente se min E max são números do laudo
  referenceSource: 'laudo'      // sempre 'laudo' no Beta
  rawText: string               // trecho exato do laudo (máx 200 chars)
  confidence: number            // 0.0–1.0 — metadado informativo apenas
  extractionNotes: string | null // ambiguidade deste biomarcador específico
}

export interface ExtractionResult {
  biomarkers: ExtractedBiomarker[]
  examType: string
  extractionNotes: string | null  // ambiguidade do laudo inteiro
  // Rastreabilidade
  aiLogId: string
  model: string
  provider: string
  promptVersion: string
  promptTokens: number
  completionTokens: number
  durationMs: number
  truncated: false                // sempre false no Beta
  parsedOk: boolean
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

// Schema bruto retornado pela IA (antes de validação)
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
