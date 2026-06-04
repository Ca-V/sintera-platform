import { createHash } from 'crypto'
import { jsonrepair } from 'jsonrepair'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AnthropicProvider } from './providers/anthropic'
import { checkRateLimit } from './rate-limiter'
import { loadActivePrompt, verifyPromptIntegrity } from './prompt-loader'
import type {
  ExtractionResult,
  GatewayError,
  ExtractedBiomarker,
  RawAIResponse,
  RawBiomarker,
  ResultType,
  ReferenceSource,
} from './types'

type GatewayReturn = ExtractionResult | GatewayError

export function isGatewayError(r: GatewayReturn): r is GatewayError {
  return 'code' in r
}

// ── Validação e normalização do JSON bruto ────────────────────────────────────

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null
  // converte string com vírgula decimal brasileira
  if (typeof v === 'string') {
    const normalized = v.replace(',', '.').replace(/\./g, (m, o, s) =>
      s.indexOf('.') < o ? '' : m,
    )
    const n = parseFloat(normalized)
    return isNaN(n) ? null : n
  }
  if (typeof v === 'number' && !isNaN(v)) return v
  return null
}

function toStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null
  return typeof v === 'string' ? v.trim() || null : null
}

function toBoolean(v: unknown): boolean {
  return v === true
}

function clamp01(v: unknown): number {
  const n = typeof v === 'number' ? v : 0
  return Math.min(1, Math.max(0, n))
}

const VALID_RESULT_TYPES = new Set<string>(['numeric', 'qualitative', 'missing', 'extraction_failed'])
const VALID_REFERENCE_SOURCES = new Set<string>(['laudo', 'ausente', 'documental'])

function toResultType(v: unknown, derivedValue: number | null, derivedValueText: string | null): ResultType {
  if (typeof v === 'string' && VALID_RESULT_TYPES.has(v)) return v as ResultType
  // Fallback heurístico — compatibilidade com prompt anterior (sem result_type)
  if (derivedValue !== null) return 'numeric'
  if (derivedValueText !== null) return 'qualitative'
  return 'missing'
}

function toReferenceSource(v: unknown, refMin: number | null, refMax: number | null): ReferenceSource {
  if (typeof v === 'string' && VALID_REFERENCE_SOURCES.has(v)) return v as ReferenceSource
  // Fallback heurístico — compatibilidade com prompt anterior (sem reference_source)
  return refMin !== null || refMax !== null ? 'laudo' : 'ausente'
}

function parseBiomarker(raw: RawBiomarker): ExtractedBiomarker | null {
  const name = toStringOrNull(raw.name)
  if (!name) return null

  const refMin = toNumber(raw.reference_min)
  const refMax = toNumber(raw.reference_max)
  // range_extracted verdadeiro só quando ambos os limites são números (Prompt A4)
  const rangeExtracted = refMin !== null && refMax !== null
    ? true
    : toBoolean(raw.range_extracted) && refMin !== null && refMax !== null

  const value = toNumber(raw.value)
  const valueText = toStringOrNull(raw.value_text)?.slice(0, 200) ?? null
  const resultType = toResultType(raw.result_type, value, valueText)
  const referenceSource = toReferenceSource(raw.reference_source, refMin, refMax)

  return {
    name,
    value,
    valueText,
    unit: toStringOrNull(raw.unit),
    referenceMin: refMin,
    referenceMax: refMax,
    rangeExtracted,
    referenceSource,
    resultType,
    rawText: toStringOrNull(raw.raw_text)?.slice(0, 200) ?? '',
    confidence: clamp01(raw.confidence),  // informativo apenas (Ajuste A4 aprovado)
    extractionNotes: toStringOrNull(raw.extraction_notes),
  }
}

// Extrai o primeiro objeto JSON completo da resposta da IA via contagem de chaves balanceadas.
// Robusto para: markdown code fences, texto antes/depois do JSON, objetos aninhados.
// A estratégia de regex não-greedy foi descartada: (\{[\s\S]*?\}) para no primeiro }
// e extrai JSON incompleto. Contagem balanceada é O(n) e provadamente correta.
function extractJsonCandidate(raw: string): string | null {
  const start = raw.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < raw.length; i++) {
    const ch = raw[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return raw.slice(start, i + 1)
    }
  }
  return null
}

function parseAIResponse(raw: string): {
  parsed: RawAIResponse | null
  suspicious: boolean
  parseError?: string
  rawHash?: string
  repairedHash?: string
  repaired?: boolean
  parseErrorOriginal?: string
} {
  const candidate = extractJsonCandidate(raw)
  if (!candidate) return { parsed: null, suspicious: true }

  const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex')

  // Tentativa 1: parse direto
  try {
    const obj = JSON.parse(candidate) as RawAIResponse
    const suspicious = !Array.isArray(obj.biomarkers)
    return { parsed: obj, suspicious, rawHash: sha256(candidate) }
  } catch (err1) {
    const originalError = err1 instanceof Error ? err1.message : String(err1)
    // Tentativa 2: jsonrepair — corrige aspas não escapadas e outros erros sintáticos
    try {
      const repaired = jsonrepair(candidate)
      const obj = JSON.parse(repaired) as RawAIResponse
      const suspicious = !Array.isArray(obj.biomarkers)
      return {
        parsed: obj,
        suspicious,
        rawHash: sha256(candidate),
        repairedHash: sha256(repaired),
        repaired: true,
        parseErrorOriginal: originalError,
      }
    } catch (err2) {
      const msg = err2 instanceof Error ? err2.message : String(err2)
      return { parsed: null, suspicious: true, parseError: msg }
    }
  }
}

// ── Gateway principal ─────────────────────────────────────────────────────────

export async function extractBiomarkers(
  supabase: SupabaseClient,
  params: {
    examId: string
    userId: string
    pdfQualityDetected: string
    // Path A
    examText?: string
    // Path B
    pdfBuffer?: Buffer
  },
): Promise<GatewayReturn> {
  const { examId, userId, examText, pdfBuffer, pdfQualityDetected } = params
  const extractionPath: import('./types').ExtractionPath = pdfBuffer ? 'pdf_native' : 'text'

  // 1. Rate limit
  if (!checkRateLimit(userId)) {
    return { code: 'RATE_LIMIT_EXCEEDED', message: 'Limite de análises excedido. Aguarde 1 minuto.', httpStatus: 429 }
  }

  // 2. Carregar prompt ativo
  const prompt = await loadActivePrompt('extraction')
  if (!prompt) {
    return { code: 'NO_ACTIVE_PROMPT', message: 'Nenhum prompt de extração ativo configurado.', httpStatus: 500 }
  }

  // 3. Verificar integridade do prompt
  if (!verifyPromptIntegrity(prompt)) {
    console.error('[Gateway] PROMPT_INTEGRITY_VIOLATION — hash divergente detectado em runtime')
    return { code: 'PROMPT_INTEGRITY_VIOLATION', message: 'Falha de integridade do prompt.', httpStatus: 500 }
  }

  // 4. Instanciar provider
  const provider = new AnthropicProvider()

  // 5. Registrar início em ai_processing_log (status='processing')
  const inputChars = examText?.length ?? 0
  const logStart = {
    exam_id: examId,
    user_id: userId,
    provider: provider.name,
    model: provider.model,
    input_chars: inputChars,
    full_text_chars: inputChars,
    truncated: false,
    status: 'processing',
    extraction_path: extractionPath,
    pdf_quality_detected: pdfQualityDetected,
  }

  const { data: logRow, error: logErr } = await supabase
    .from('ai_processing_log')
    .insert(logStart as never)
    .select('id')
    .single()

  if (logErr || !logRow) {
    return { code: 'PARSE_FAILED', message: 'Falha ao registrar log de IA.', httpStatus: 500 }
  }

  const aiLogId = (logRow as { id: string }).id
  const startTime = Date.now()

  // 6. Chamar provider
  let providerResult
  try {
    providerResult = await provider.extractBiomarkers({
      examText,
      pdfBuffer,
      extractionPath,
      examId,
      userId,
      systemPrompt: prompt.systemPrompt,
      userTemplate: prompt.userTemplate,
      temperature: prompt.temperature,
      maxTokens: prompt.maxTokens,
    })
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.message.includes('timeout')
    const status = isTimeout ? 'timeout' : 'error'
    const code = isTimeout ? 'PROVIDER_TIMEOUT' : 'PROVIDER_ERROR'

    await supabase.from('ai_processing_log').update({
      status,
      parse_error: err instanceof Error ? err.message.slice(0, 500) : String(err),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    } as never).eq('id', aiLogId)

    return { code, message: `Erro no provider: ${code}`, httpStatus: isTimeout ? 504 : 502 }
  }

  // 7. Parsear e validar JSON
  const { parsed, suspicious, parseError, rawHash, repairedHash, repaired, parseErrorOriginal } = parseAIResponse(providerResult.rawResponse)

  if (!parsed || suspicious) {
    const rawLen = providerResult.rawResponse.length
    await supabase.from('ai_processing_log').update({
      status: 'error',
      raw_response: providerResult.rawResponse.slice(0, 15000),
      parsed_ok: false,
      parse_error: parseError
        ? `parse_error: ${parseError} | raw_len: ${rawLen} | candidate_null: ${!extractJsonCandidate(providerResult.rawResponse)}`
        : `suspicious_output | raw_len: ${rawLen}`,
      suspicious_output: true,
      raw_response_hash: rawHash ?? null,
      prompt_tokens: providerResult.promptTokens,
      completion_tokens: providerResult.completionTokens,
      completed_at: new Date().toISOString(),
      duration_ms: providerResult.durationMs,
    } as never).eq('id', aiLogId)

    return { code: suspicious ? 'SCHEMA_INVALID' : 'PARSE_FAILED', message: 'Falha ao parsear resposta da IA.', httpStatus: 500 }
  }

  // 8. Normalizar biomarcadores
  const biomarkers: ExtractedBiomarker[] = (parsed.biomarkers ?? [])
    .map(b => parseBiomarker(b as RawBiomarker))
    .filter((b): b is ExtractedBiomarker => b !== null)

  // 9. Atualizar log com resultado completo (status='success') + auditoria de reparo
  await supabase.from('ai_processing_log').update({
    status: 'success',
    raw_response: providerResult.rawResponse.slice(0, 15000),
    parsed_ok: true,
    biomarkers_extracted: biomarkers.length,
    prompt_tokens: providerResult.promptTokens,
    completion_tokens: providerResult.completionTokens,
    completed_at: new Date().toISOString(),
    duration_ms: providerResult.durationMs,
    // Auditoria de reparo sintático
    parse_repaired: repaired ?? false,
    parse_error_original: parseErrorOriginal ?? null,
    repair_method: repaired ? 'jsonrepair_v1' : null,
    raw_response_hash: rawHash ?? null,
    repaired_response_hash: repairedHash ?? null,
  } as never).eq('id', aiLogId)

  return {
    biomarkers,
    examType: typeof parsed.exam_type === 'string' ? parsed.exam_type : 'indeterminado',
    extractionNotes: toStringOrNull(parsed.extraction_notes),
    aiLogId,
    model: providerResult.model,
    provider: provider.name,
    promptVersion: prompt.version,
    promptTokens: providerResult.promptTokens,
    completionTokens: providerResult.completionTokens,
    durationMs: providerResult.durationMs,
    truncated: false,
    parsedOk: true,
    extractionPath,
  }
}
