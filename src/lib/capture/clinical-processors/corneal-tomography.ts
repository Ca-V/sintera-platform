// PROCESSADOR do Modelo Clínico "corneal-tomography" — DIRIGIDO PELO CRC (GS-004).
//
// Separação (fundadora 14/07): o MODELO CLÍNICO (models.ts) descreve a ESTRUTURA (quais campos, unidades, se
// é por olho) — conhecimento médico. Este PROCESSADOR só PREENCHE essa estrutura: para cada campo do modelo,
// aplica a sua regra de extração (COMO achar no texto). Trocar/afinar a estrutura não mexe aqui; trocar a
// forma de extrair não mexe no modelo. Organizado por MODELO, não por fabricante (Oculus/Galilei/Orbscan).
//
// RDC 657: transcreve os valores medidos, não interpreta. Consome APENAS a CertifiedCDU (`content.text`).
// Puro/determinístico. Sem PDF/Bundle/OCR/páginas.

import type { CertifiedCDU, ClinicalProcessorFn, ProcessedParameter, ProcessorResult } from './types'
import { getClinicalModel } from './models'

const CLINICAL_MODEL = 'corneal-tomography'
const model = getClinicalModel(CLINICAL_MODEL)

// COMO extrair cada campo (implementação) — chaveado pelo NOME do campo do modelo. A estrutura (nomes/
// unidades/por-olho) vem do modelo; aqui está só a regra de leitura. Determinístico.
const RULES: Record<string, RegExp> = {
  'K1':                 /\bK\s*1\b\D{0,8}(\d{2}[.,]\d)/i,
  'K2':                 /\bK\s*2\b\D{0,8}(\d{2}[.,]\d)/i,
  'Kmax':               /\bK\s*(?:max|máx)\b\D{0,8}(\d{2}[.,]\d)/i,
  'Espessura mínima':   /(?:thinnest|espessura\s+m[íi]nima|pachy(?:metry)?\s*(?:min|apex)|paquimetria)\D{0,10}(\d{3})\b/i,
  'BAD-D':              /\bBAD-?\s*D\b\D{0,8}(\d[.,]\d{1,2})/i,
  'Elevação anterior':  /(?:ele(?:va[çc][ãa]o|vation|\.)?\s*(?:ant(?:erior)?|front))\D{0,8}(\d{1,3})\b/i,
  'Elevação posterior': /(?:ele(?:va[çc][ãa]o|vation|\.)?\s*(?:post(?:erior)?|back))\D{0,8}(\d{1,3})\b/i,
}

// Olho da linha (lateralidade). OD = direito; OS/OE = esquerdo. Ausência → região indefinida.
function eyeOf(line: string): string | undefined {
  if (/\bOD\b|olho\s+direito/i.test(line)) return 'OD'
  if (/\bO[SE]\b|olho\s+esquerdo/i.test(line)) return 'OE'
  return undefined
}

/**
 * PREENCHE a estrutura do modelo corneal-tomography a partir da CDU (por olho quando a linha indica
 * lateralidade). Puro. Nada extraível → output null (document_only; preserva o documento, não inventa).
 */
export const runCornealTomography: ClinicalProcessorFn = (cdu: CertifiedCDU): ProcessorResult => {
  const text = cdu.content.text ?? ''
  const notes: string[] = []
  const parameters: ProcessedParameter[] = []
  const seen = new Set<string>()
  const fields = model?.fields ?? []

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, ' ').trim()
    if (!line) continue
    const region = eyeOf(line)
    for (const field of fields) {
      const rule = RULES[field.name]
      if (!rule) continue
      const m = line.match(rule)
      if (!m) continue
      // região só quando o modelo diz que o campo é por região
      const regionForField = field.regionAware ? region : undefined
      const key = `${field.name}|${regionForField ?? ''}`
      if (seen.has(key)) continue // 1 valor por campo/olho (o 1º da leitura) — determinístico
      seen.add(key)
      parameters.push({
        name: field.name,
        value: m[1].replace(',', '.'),
        ...(field.unit ? { unit: field.unit } : {}),
        ...(regionForField ? { region: regionForField } : {}),
      })
    }
  }

  if (parameters.length === 0) {
    notes.push('nenhum parâmetro tomográfico reconhecido no texto → document_only (preserva o documento)')
    return { output: null, clinicalModel: CLINICAL_MODEL, contractVersion: model?.contractVersion ?? 'v1', extractedUnits: 0, notes }
  }

  const eyes = new Set(parameters.map(p => p.region).filter(Boolean))
  notes.push(`${parameters.length} parâmetro(s)${eyes.size ? ` em ${[...eyes].join('/')}` : ''}`)
  return {
    output: { kind: 'parametric', parameters },
    clinicalModel: CLINICAL_MODEL,
    contractVersion: model?.contractVersion ?? 'v1',
    extractedUnits: parameters.length,
    notes,
  }
}
