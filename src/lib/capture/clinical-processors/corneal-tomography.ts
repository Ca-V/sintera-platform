// Modelo Clínico "corneal-tomography" — 1º processador do Clinical Processing Engine, DIRIGIDO PELO CRC
// (GS-004). Organizado por MODELO CLÍNICO, não por fabricante: OCULUS Pentacam, Galilei, Orbscan… todos
// usam ESTE modelo por representarem a mesma modalidade (tomografia de córnea).
//
// Resultado = PARÂMETROS tomográficos por olho (K1/K2/Kmax/espessura mínima/BAD-D/elevações). NÃO são
// biomarcadores. RDC 657: transcreve os valores medidos, não interpreta (não diz "ceratocone"; só reporta
// os números que o documento traz).
//
// Consome APENAS a CertifiedCDU (o seu `content.text`). Puro/determinístico. Sem PDF/Bundle/OCR/páginas.

import type { CertifiedCDU, ClinicalProcessorFn, ProcessedParameter, ProcessorResult } from './types'

const CLINICAL_MODEL = 'corneal-tomography'
const CONTRACT = 'v1'

// Rótulo → regex do valor numérico logo após o rótulo (tolera separadores e unidade). Determinístico.
const PARAM_LABELS: { name: string; unit?: string; re: RegExp }[] = [
  { name: 'K1',                 unit: 'D',  re: /\bK\s*1\b\D{0,8}(\d{2}[.,]\d)/i },
  { name: 'K2',                 unit: 'D',  re: /\bK\s*2\b\D{0,8}(\d{2}[.,]\d)/i },
  { name: 'Kmax',               unit: 'D',  re: /\bK\s*(?:max|máx)\b\D{0,8}(\d{2}[.,]\d)/i },
  { name: 'Espessura mínima',   unit: 'µm', re: /(?:thinnest|espessura\s+m[íi]nima|pachy(?:metry)?\s*(?:min|apex))\D{0,10}(\d{3})\b/i },
  { name: 'BAD-D',                          re: /\bBAD-?\s*D\b\D{0,8}(\d[.,]\d{1,2})/i },
  { name: 'Elevação anterior',  unit: 'µm', re: /(?:ele(?:va[çc][ãa]o|vation|\.)?\s*(?:ant(?:erior)?|front))\D{0,8}(\d{1,3})\b/i },
  { name: 'Elevação posterior', unit: 'µm', re: /(?:ele(?:va[çc][ãa]o|vation|\.)?\s*(?:post(?:erior)?|back))\D{0,8}(\d{1,3})\b/i },
]

// Olho da linha (lateralidade). OD = direito; OS/OE = esquerdo. Ausência → região indefinida.
function eyeOf(line: string): string | undefined {
  if (/\bOD\b|olho\s+direito/i.test(line)) return 'OD'
  if (/\bO[SE]\b|olho\s+esquerdo/i.test(line)) return 'OE'
  return undefined
}

/**
 * Extrai os parâmetros tomográficos da CDU (por olho quando a linha indica lateralidade). Puro.
 * Nada extraível com confiança → output null (document_only; preserva o documento, não inventa).
 */
export const runCornealTomography: ClinicalProcessorFn = (cdu: CertifiedCDU): ProcessorResult => {
  const text = cdu.content.text ?? ''
  const notes: string[] = []
  const parameters: ProcessedParameter[] = []
  const seen = new Set<string>()

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, ' ').trim()
    if (!line) continue
    const region = eyeOf(line)
    for (const p of PARAM_LABELS) {
      const m = line.match(p.re)
      if (!m) continue
      const key = `${p.name}|${region ?? ''}`
      if (seen.has(key)) continue // 1 valor por parâmetro/olho (o 1º da leitura) — determinístico
      seen.add(key)
      parameters.push({ name: p.name, value: m[1].replace(',', '.'), ...(p.unit ? { unit: p.unit } : {}), ...(region ? { region } : {}) })
    }
  }

  if (parameters.length === 0) {
    notes.push('nenhum parâmetro tomográfico reconhecido no texto → document_only (preserva o documento)')
    return { output: null, clinicalModel: CLINICAL_MODEL, contractVersion: CONTRACT, extractedUnits: 0, notes }
  }

  const eyes = new Set(parameters.map(p => p.region).filter(Boolean))
  notes.push(`${parameters.length} parâmetro(s)${eyes.size ? ` em ${[...eyes].join('/')}` : ''}`)
  return {
    output: { kind: 'parametric', parameters },
    clinicalModel: CLINICAL_MODEL,
    contractVersion: CONTRACT,
    extractedUnits: parameters.length,
    notes,
  }
}
