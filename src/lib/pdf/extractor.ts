// pdf-parse é CommonJS — import via require para compatibilidade com ESM do Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>

export type PdfQuality =
  | 'good_text'          // texto limpo, Path A
  | 'corrupted_text'     // mapeamento de fontes quebrado, Path B
  | 'insufficient_text'  // texto extraído insuficiente (escaneado, híbrido, OCR ruim), Path B
  | 'password_protected' // erro — não processável
  | 'corrupted'          // erro — não processável
  | 'too_large'          // erro — não processável

export type PdfExtractionResult =
  | { ok: true;  quality: 'good_text' | 'corrupted_text' | 'insufficient_text'; text: string; pageCount: number }
  | { ok: false; quality: 'password_protected' | 'corrupted' | 'too_large' }

const MAX_PDF_BYTES  = 10 * 1024 * 1024 // 10 MB
const MIN_USEFUL_CHARS = 200

// Retorna true para caracteres fora dos ranges válidos em documentos médicos em português.
// Ranges válidos: ASCII básico, Latin-1 Supplement (inclui µ, á, é, ç, etc.), Latin Extended A/B,
// pontuação tipográfica comum (aspas, travessão, grau).
function isGarbledChar(cp: number): boolean {
  if (cp >= 0x0020 && cp <= 0x007E) return false // ASCII
  if (cp >= 0x00A0 && cp <= 0x024F) return false // Latin-1 + Extended A/B (cobre µ, diacríticos PT)
  if (cp === 0x2013 || cp === 0x2014) return false // en/em dash
  if (cp === 0x2018 || cp === 0x2019) return false // aspas simples tipográficas
  if (cp === 0x201C || cp === 0x201D) return false // aspas duplas tipográficas
  if (cp === 0x2022) return false                  // bullet
  return true
}

// Avalia a qualidade do texto extraído.
// Critério de corrupted_text (Ajuste 1 aprovado):
//   >= 15% chars fora dos ranges válidos  AND  >= 10 chars suspeitos consecutivos.
// Isso evita falsos positivos para exames com µg/dL, acentos e símbolos médicos legítimos.
function assessQuality(text: string): 'good_text' | 'corrupted_text' | 'insufficient_text' {
  const useful = text.replace(/\s+/g, ' ').trim()
  if (useful.length < MIN_USEFUL_CHARS) return 'insufficient_text'

  let garbledCount = 0
  let consecutiveRun = 0
  let maxConsecutiveRun = 0

  for (const char of useful) {
    const cp = char.codePointAt(0) ?? 0
    if (isGarbledChar(cp)) {
      garbledCount++
      consecutiveRun++
      if (consecutiveRun > maxConsecutiveRun) maxConsecutiveRun = consecutiveRun
    } else {
      consecutiveRun = 0
    }
  }

  const garbledRatio = garbledCount / useful.length
  if (garbledRatio >= 0.15 && maxConsecutiveRun >= 10) return 'corrupted_text'

  return 'good_text'
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  if (buffer.byteLength > MAX_PDF_BYTES) {
    return { ok: false, quality: 'too_large' }
  }

  let parsed: { text: string; numpages: number }
  try {
    parsed = await pdfParse(buffer)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : ''
    if (msg.includes('password') || msg.includes('encrypt')) {
      return { ok: false, quality: 'password_protected' }
    }
    return { ok: false, quality: 'corrupted' }
  }

  const useful = parsed.text.replace(/\s+/g, ' ').trim()
  const quality = assessQuality(useful)

  return { ok: true, quality, text: useful, pageCount: parsed.numpages }
}
