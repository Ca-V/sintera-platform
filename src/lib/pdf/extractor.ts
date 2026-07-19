import { MAX_UPLOAD_BYTES } from '@/lib/capture/limits'
// pdf-parse é CommonJS — import via require para compatibilidade com ESM do Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buf: Buffer,
  options?: { pagerender?: (pageData: unknown) => Promise<string> }
) => Promise<{ text: string; numpages: number }>

export type PdfQuality =
  | 'good_text'          // texto limpo, Path A
  | 'corrupted_text'     // mapeamento de fontes quebrado, Path B
  | 'insufficient_text'  // texto extraído insuficiente (escaneado, híbrido, OCR ruim), Path B
  | 'password_protected' // erro — não processável
  | 'corrupted'          // erro — não processável
  | 'too_large'          // erro — não processável

export type PdfExtractionResult =
  | { ok: true;  quality: 'good_text' | 'corrupted_text' | 'insufficient_text'; text: string; pageCount: number; pageTexts: string[] }
  | { ok: false; quality: 'password_protected' | 'corrupted' | 'too_large' }

// ── Epic 1.4A — Filtro de conteúdo pré-IA ────────────────────────────────────

const LAB_UNIT_PATTERN = /\b\d+[,.]?\d*\s*(g\/dL|mg\/dL|g\/L|ng\/mL|ng\/dL|pg\/mL|pg\/dL|mcg\/dL|µg\/dL|U\/L|U\/mL|UI\/L|UI\/mL|mUI\/mL|mIU\/mL|IU\/L|IU\/mL|kU\/L|mmol\/L|µmol\/L|nmol\/L|pmol\/L|mEq\/L|%|\/mm3|\/µL|cells\/µL|fl|fL|mg\/L|µg\/L|ng\/L|mOsm\/kg|mmHg|seg)\b/i

const REF_RANGE_PATTERN = /(VR|Ref|Referência|Referencia|V\.R\.)\s*[:]\s*[\d,.]/i

const QUALITATIVE_TERMS = [
  'negativo', 'positivo', 'reagente', 'não reagente', 'nao reagente',
  'reativo', 'não reativo', 'nao reativo', 'detectado', 'não detectado',
  'nao detectado', 'detectável', 'detectavel', 'não detectável', 'nao detectavel',
  'indetectável', 'indetectavel', 'ausente', 'presente', 'normal', 'alterado',
  'elevado', 'baixo', 'traços', 'tracos', 'raro', 'escasso', 'moderado',
  'intenso', 'inconclusivo',
]

const KNOWN_BIOMARKERS = [
  'hemoglobina', 'hematócrito', 'hematocrito', 'leucócitos', 'leucocitos',
  'plaquetas', 'hemácias', 'hemacias', 'vcm', 'hcm', 'chcm', 'rdw',
  'neutrófilos', 'neutrofilos', 'linfócitos', 'linfocitos', 'monócitos',
  'monocitos', 'eosinófilos', 'eosinofilos', 'basófilos', 'basofilos',
  'glicose', 'insulina', 'hba1c', 'colesterol', 'ldl', 'hdl', 'vldl',
  'triglicerídeos', 'triglicerideos', 'tsh', 't4 livre', 't3 livre', 't4', 't3',
  'fsh', 'lh', 'estradiol', 'progesterona', 'prolactina', 'amh',
  'testosterona', 'dhea', 'cortisol', 'ferritina', 'ferro', 'transferrina',
  'vitamina d', 'vitamina b12', 'folato', 'ácido fólico', 'acido folico',
  'creatinina', 'ureia', 'ácido úrico', 'acido urico', 'tgo', 'tgp', 'ggt',
  'fosfatase alcalina', 'bilirrubina', 'albumina', 'proteína c reativa',
  'proteina c reativa', 'pcr', 'vhs', 'beta-hcg', 'hcg', 'fan', 'psa',
  'ige', 'iga', 'igg', 'igm', 'potássio', 'potassio', 'sódio', 'sodio',
  'cálcio', 'calcio', 'magnésio', 'magnesio', 'fósforo', 'fosforo',
]

export interface PageFilterResult {
  filteredText: string
  pagesTotal:   number
  pagesRelevant: number
  pagesFiltered: number
  fallbackUsed:  boolean
  filterApplied: boolean
}

export function scorePageRelevance(pageText: string): { score: number; signals: string[] } {
  const lower = pageText.toLowerCase()
  const signals: string[] = []
  let score = 0

  if (LAB_UNIT_PATTERN.test(pageText)) { signals.push('lab_unit');    score += 2 }
  if (REF_RANGE_PATTERN.test(pageText)) { signals.push('ref_range');   score += 2 }
  if (QUALITATIVE_TERMS.some(t => lower.includes(t))) { signals.push('qualitative'); score += 2 }
  if (KNOWN_BIOMARKERS.some(b => lower.includes(b)))  { signals.push('biomarker');   score += 3 }

  return { score, signals }
}

export function filterRelevantPages(pageTexts: string[], threshold = 3): PageFilterResult {
  const pagesTotal = pageTexts.length
  if (pagesTotal === 0) {
    return { filteredText: '', pagesTotal: 0, pagesRelevant: 0, pagesFiltered: 0, fallbackUsed: false, filterApplied: false }
  }

  const relevant = pageTexts.filter(pt => scorePageRelevance(pt).score >= threshold)
  const fallbackUsed = relevant.length === 0
  const finalPages   = fallbackUsed ? pageTexts : relevant

  return {
    filteredText:  finalPages.join('\n'),
    pagesTotal,
    pagesRelevant: fallbackUsed ? pagesTotal : relevant.length,
    pagesFiltered: fallbackUsed ? 0 : pagesTotal - relevant.length,
    fallbackUsed,
    filterApplied: !fallbackUsed,
  }
}

const MAX_PDF_BYTES  = MAX_UPLOAD_BYTES // alinhado ao limite de upload (SSOT @/lib/capture/limits)
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

// ── Reparo de texto UTF-16 com bytes trocados ───────────────────────────────
// Alguns PDFs devolvem o texto com a ordem de bytes de cada unidade UTF-16 trocada:
// 'C' (0x0043) chega como '䌀' (0x4300), "CARINA" vira "䌀䄀刀䤀一䄀". É recuperável —
// basta trocar os bytes de volta. Sem isso, o exam_text fica ilegível (quebra a
// rastreabilidade) e o texto é classificado como corrompido, forçando a via de visão.

function swapBytes(cp: number): number {
  return ((cp & 0x00ff) << 8) | ((cp >> 8) & 0x00ff)
}

// Após a troca, o code point cai em ASCII imprimível ou Latin-1 (acentos PT, µ)?
function isRecoverableSwapped(cp: number): boolean {
  if (cp <= 0x00ff) return false
  const s = swapBytes(cp)
  return (s >= 0x0020 && s <= 0x007e) || (s >= 0x00a0 && s <= 0x00ff)
}

// Repara o texto SÓ quando a maioria dos caracteres significativos é claramente
// byte-swapped (evita mexer em texto normal ou em CJK legítimo).
export function repairByteSwappedText(text: string): { text: string; repaired: boolean } {
  if (!text) return { text, repaired: false }

  let swappable = 0
  let significant = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp <= 0x20) continue // ignora espaços/controle na proporção
    significant++
    if (isRecoverableSwapped(cp)) swappable++
  }
  if (significant === 0 || swappable / significant < 0.6) return { text, repaired: false }

  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    out += isRecoverableSwapped(cp) ? String.fromCodePoint(swapBytes(cp)) : ch
  }
  return { text: out, repaired: true }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  if (buffer.byteLength > MAX_PDF_BYTES) {
    return { ok: false, quality: 'too_large' }
  }

  const pageTexts: string[] = []

  const options = {
    pagerender: async (pageData: unknown): Promise<string> => {
      try {
        const pd = pageData as { getTextContent: () => Promise<{ items: Array<{ str?: string }> }> }
        const content = await pd.getTextContent()
        const text = content.items.map(item => item.str ?? '').join(' ')
        pageTexts.push(text)
        return text
      } catch {
        pageTexts.push('')
        return ''
      }
    },
  }

  let parsed: { text: string; numpages: number }
  try {
    parsed = await pdfParse(buffer, options)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message.toLowerCase() : ''
    if (msg.includes('password') || msg.includes('encrypt')) {
      return { ok: false, quality: 'password_protected' }
    }
    return { ok: false, quality: 'corrupted' }
  }

  // Repara texto UTF-16 byte-swapped ANTES de avaliar a qualidade — recupera o
  // conteúdo real (âncora de rastreabilidade) e pode reabilitar o Path A.
  const mainText = repairByteSwappedText(parsed.text).text

  // Fallback: se pagerender não foi chamado (versão sem suporte), tratar como página única
  const finalPageTexts = (pageTexts.length > 0 ? pageTexts : [parsed.text])
    .map(pt => repairByteSwappedText(pt).text)

  const useful = mainText.replace(/\s+/g, ' ').trim()
  const quality = assessQuality(useful)

  return { ok: true, quality, text: useful, pageCount: parsed.numpages, pageTexts: finalPageTexts }
}
