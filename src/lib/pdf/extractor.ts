// pdf-parse é CommonJS — import via require para compatibilidade com ESM do Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>

export type PdfExtractionResult =
  | { ok: true; text: string; pageCount: number }
  | { ok: false; reason: 'pdf_no_text_layer' | 'pdf_password_protected' | 'pdf_corrupted' | 'pdf_too_large' }

const MAX_PDF_BYTES = 10 * 1024 * 1024 // 10 MB
const MIN_USEFUL_CHARS = 200

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  if (buffer.byteLength > MAX_PDF_BYTES) {
    return { ok: false, reason: 'pdf_too_large' }
  }

  let parsed: { text: string; numpages: number }
  try {
    parsed = await pdfParse(buffer)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : ''
    if (msg.includes('password') || msg.includes('encrypt')) {
      return { ok: false, reason: 'pdf_password_protected' }
    }
    return { ok: false, reason: 'pdf_corrupted' }
  }

  // Texto útil: remove espaços/quebras excessivos antes de medir
  const useful = parsed.text.replace(/\s+/g, ' ').trim()
  if (useful.length < MIN_USEFUL_CHARS) {
    return { ok: false, reason: 'pdf_no_text_layer' }
  }

  return { ok: true, text: useful, pageCount: parsed.numpages }
}
