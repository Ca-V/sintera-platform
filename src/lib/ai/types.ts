// AI Gateway — tipos centrais
// DMEAV: Fase 1, F1-M1 (Gateway) + F1-M2 (Dual Pipeline)

export type ExtractionPath = 'text' | 'pdf_native' | 'image'

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
  // Path imagem — foto do laudo (câmera do celular). Modelo multimodal lê a imagem.
  imageBuffer?: Buffer
  imageMediaType?: string
  extractionPath: ExtractionPath
}

export interface ProviderResult {
  rawResponse: string
  promptTokens: number
  completionTokens: number
  model: string
  durationMs: number
  // PR1 1.3 — motivo de parada do modelo. 'max_tokens' indica resposta truncada.
  stopReason: string | null
}

export type ResultType = 'numeric' | 'qualitative' | 'missing' | 'extraction_failed'
export type ReferenceSource = 'laudo' | 'ausente' | 'documental'

export interface ExtractedBiomarker {
  name: string
  value: number | null
  valueText: string | null
  unit: string | null
  referenceMin: number | null
  referenceMax: number | null
  rangeExtracted: boolean
  referenceSource: ReferenceSource
  resultType: ResultType
  rawText: string
  confidence: number
  extractionNotes: string | null
  // Fidelidade da Ingestão (RF-01/RF-02): contexto do laudo, texto ORIGINAL, sem
  // normalização/inferência. null quando o laudo não informa (não inventar contexto).
  // Prefixo `source` explicita a proveniência (laudo, não catálogo/normalizado).
  sourceMaterial: string | null
  sourceExamName: string | null
}

export interface ExtractionResult {
  biomarkers: ExtractedBiomarker[]
  examType: string
  /** Data de realização/coleta extraída do laudo (YYYY-MM-DD) ou null se ausente. */
  examDate: string | null
  /** Nome do paciente extraído do laudo (para conferência de identidade) ou null. */
  patientName: string | null
  extractionNotes: string | null
  aiLogId: string
  model: string
  provider: string
  promptVersion: string
  promptTokens: number
  completionTokens: number
  durationMs: number
  // PR1 1.3 — true quando o modelo parou por max_tokens (output cortado).
  // Distinto de exams.text_truncated, que se refere à truncagem do INPUT (texto do PDF).
  truncated: boolean
  stopReason: string | null
  parsedOk: boolean
  extractionPath: ExtractionPath
}

export type GatewayErrorCode =
  | 'RATE_LIMIT_EXCEEDED'       // limite interno do app (rate-limiter em memória)
  | 'NO_ACTIVE_PROMPT'
  | 'PROMPT_INTEGRITY_VIOLATION'
  | 'PROVIDER_TIMEOUT'          // timeout/erro de conexão com a API Anthropic
  | 'PROVIDER_RATE_LIMITED'     // PR1 1.2 — 429 retornado pela API Anthropic
  | 'PROVIDER_OVERLOADED'       // PR1 1.2 — 529 (Overloaded) retornado pela API Anthropic
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
  exam_date?: unknown
  patient_name?: unknown
  biomarkers?: unknown[]
  extraction_notes?: unknown
}

export interface RawBiomarker {
  name?: unknown
  value?: unknown
  value_text?: unknown
  unit?: unknown
  reference_min?: unknown
  reference_max?: unknown
  range_extracted?: unknown
  reference_source?: unknown
  result_type?: unknown
  raw_text?: unknown
  confidence?: unknown
  extraction_notes?: unknown
  source_material?: unknown
  source_exam_name?: unknown
}
