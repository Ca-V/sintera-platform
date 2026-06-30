// ============================================================
// Centro de Entrada — CLASSIFIER (heurística inicial)
// ============================================================
// Camada CLASSIFIER: identifica o documento. V0 NÃO usa esta classificação (a
// usuária escolhe o tipo). V0.1: a IA/heurística SUGERE e a usuária confirma.
// Primeiro palpite por sinais baratos (nome + MIME), conservador (confiança 'low').
// Projetado para ser substituído por IA depois — a assinatura (ClassificationResult)
// não muda.
// ============================================================

import type { ClassificationResult, DocumentKind } from '../types'

const HINTS: { kind: DocumentKind; re: RegExp }[] = [
  { kind: 'eyeglass_prescription', re: /(receita).*(óculos|oculos|lente)|grau|esf[eé]rico|cil[ií]ndrico|dnp/i },
  { kind: 'omics',                 re: /[ôo]mic|gen\w*|metabol[ôo]m|prote[ôo]m|microbiom|sequenciament/i },
  { kind: 'medication_label',      re: /bula|medicament|rem[eé]dio|suplement|posologia|comprimid/i },
  { kind: 'exam',                  re: /laudo|exame|hemograma|sangue|colesterol|glicose|urina|result|radiolog|ultrassom|tomografi/i },
]

/**
 * Palpite factual por NOME do arquivo. Pura. Sempre 'low' (heurística).
 * 'unknown' quando nenhum sinal aparece — a UI então pede o tipo à usuária.
 * (V0.1+ pode somar sinais de MIME/conteúdo, mantendo a mesma assinatura de retorno.)
 */
export function classifyByFilename(filename: string): ClassificationResult {
  const name = (filename ?? '').toLowerCase()
  for (const h of HINTS) {
    if (h.re.test(name)) return { kind: h.kind, confidence: 'low', reason: 'nome do arquivo' }
  }
  return { kind: 'unknown', confidence: 'low' }
}
