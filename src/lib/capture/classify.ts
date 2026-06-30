// ============================================================
// Centro de Entrada — CLASSIFICAÇÃO (heurística inicial)
// ============================================================
// Primeiro palpite do tipo de documento, a partir de sinais BARATOS (nome do
// arquivo + MIME). É deliberadamente conservador: confiança 'low' e sempre
// confirmável pela usuária. Projetado para ser SUBSTITUÍDO/aumentado por um
// classificador de IA depois — a assinatura (ClassificationResult) não muda.
// ============================================================

import type { ClassificationResult } from './types'

const HINTS: { kind: ClassificationResult['kind']; re: RegExp }[] = [
  { kind: 'eyeglass_prescription', re: /(receita).*(óculos|oculos|lente)|grau|esf[eé]rico|cil[ií]ndrico|dnp/i },
  { kind: 'medication_label',      re: /bula|medicament|rem[eé]dio|suplement|posologia|comprimid/i },
  { kind: 'lab_report',            re: /laudo|radiolog|ultrassom|tomografi|resson[âa]ncia|ecocardio/i },
  { kind: 'exam',                  re: /exame|hemograma|sangue|colesterol|glicose|urina|result/i },
]

/**
 * Palpite factual por NOME do arquivo (e MIME). Pura. Sempre 'low' (heurística).
 * Retorna 'unknown' quando nenhum sinal aparece — a UI então pede o tipo à usuária.
 */
export function classifyByFilename(filename: string, _mime?: string): ClassificationResult {
  const name = (filename ?? '').toLowerCase()
  for (const h of HINTS) {
    if (h.re.test(name)) return { kind: h.kind, confidence: 'low', reason: 'nome do arquivo' }
  }
  return { kind: 'unknown', confidence: 'low' }
}
