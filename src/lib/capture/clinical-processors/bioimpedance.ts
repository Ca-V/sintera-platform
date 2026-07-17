// PROCESSADOR do Modelo Clínico "bioimpedance" — FB-003 (bioimpedância como EXAME).
//
// Separação (fundadora 14/07): o MODELO (models.ts) descreve a estrutura (peso/massa magra/gorda/água/…);
// este PROCESSADOR só PREENCHE — para cada campo, aplica a regra de leitura (COMO achar no laudo). O exame é a
// FONTE/fato (Histórico de Exames); a Composição Corporal (BOD-001) apenas VISUALIZA os pontos derivados daqui.
//
// RDC 657: transcreve os valores medidos, não interpreta. Consome APENAS a CertifiedCDU (`content.text`).
// Puro/determinístico. Sem PDF/Bundle/OCR/páginas.

import type { CertifiedCDU, ClinicalProcessorFn, ProcessedParameter, ProcessorResult } from './types'
import { getClinicalModel } from './models'

const CLINICAL_MODEL = 'bioimpedance'
const model = getClinicalModel(CLINICAL_MODEL)

// COMO extrair cada campo (implementação) — chaveado pelo NOME do campo do modelo. Termos comuns em laudos
// de bioimpedância pt-BR (InBody/Omron/balanças/nutricionista). Determinístico; 1º valor plausível por campo.
const RULES: Record<string, RegExp> = {
  'Peso':                  /\bpeso\b[^\d\n]{0,12}(\d{2,3}(?:[.,]\d)?)\s*kg/i,
  'IMC':                   /\b(?:IMC|BMI|[íi]ndice\s+de\s+massa\s+corporal)\b[^\d\n]{0,12}(\d{2}(?:[.,]\d)?)/i,
  'Percentual de gordura': /(?:percentual\s+de\s+gordura|gordura\s+corporal|%\s*gordura|pgc)\b[^\d\n]{0,12}(\d{1,2}(?:[.,]\d)?)\s*%?/i,
  'Massa muscular':        /massa\s+muscular(?:\s+esquel[ée]tica)?[^\d\n]{0,12}(\d{1,3}(?:[.,]\d)?)\s*kg/i,
  'Massa magra':           /massa\s+(?:magra|livre\s+de\s+gordura)[^\d\n]{0,12}(\d{1,3}(?:[.,]\d)?)\s*kg/i,
  'Massa óssea':           /massa\s+[óo]ssea|conte[úu]do\s+mineral\s+[óo]sseo[^\d\n]{0,12}(\d(?:[.,]\d)?)\s*kg/i,
  'Água corporal':         /[áa]gua\s+corporal(?:\s+total)?[^\d\n]{0,12}(\d{1,2}(?:[.,]\d)?)\s*%?/i,
  'Gordura visceral':      /(?:gordura\s+visceral|n[íi]vel\s+visceral|visceral\s+fat)[^\d\n]{0,12}(\d{1,2})\b/i,
  'Metabolismo basal':     /(?:metabolismo\s+basal|taxa\s+metab[óo]lica\s+basal|TMB|BMR)[^\d\n]{0,12}(\d{3,4})/i,
}

/**
 * PREENCHE a estrutura do modelo bioimpedance a partir da CDU. Puro. Nada extraível → output null
 * (document_only; preserva o documento, não inventa). 1 valor por campo (o 1º reconhecido no texto).
 */
export const runBioimpedance: ClinicalProcessorFn = (cdu: CertifiedCDU): ProcessorResult => {
  const text = cdu.content.text ?? ''
  const flat = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ')
  const notes: string[] = []
  const parameters: ProcessedParameter[] = []
  const page = cdu.pages[0]
  const fields = model?.fields ?? []

  for (const field of fields) {
    const rule = RULES[field.name]
    if (!rule) continue
    const m = flat.match(rule)
    if (!m || m[1] == null) continue
    parameters.push({
      name: field.name,
      value: m[1].replace(',', '.'),
      ...(field.unit ? { unit: field.unit } : {}),
      ...(page != null ? { page } : {}),
      excerpt: m[0].trim(), // auditabilidade: trecho-fonte exato
    })
  }

  if (parameters.length === 0) {
    notes.push('nenhum parâmetro de bioimpedância reconhecido no texto → document_only (preserva o documento)')
    return { output: null, clinicalModel: CLINICAL_MODEL, contractVersion: model?.contractVersion ?? 'v1', extractedUnits: 0, notes }
  }
  notes.push(`${parameters.length} parâmetro(s) de composição corporal`)
  return {
    output: { kind: 'parametric', parameters },
    clinicalModel: CLINICAL_MODEL,
    contractVersion: model?.contractVersion ?? 'v1',
    extractedUnits: parameters.length,
    notes,
  }
}
