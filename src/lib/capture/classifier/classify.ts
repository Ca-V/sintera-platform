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
 * Uso INTERNO do orquestrador — as telas consomem `classifyCheap` (abaixo).
 */
function classifyByFilename(filename: string): ClassificationResult {
  const name = (filename ?? '').toLowerCase()
  for (const h of HINTS) {
    if (h.re.test(name)) return { kind: h.kind, confidence: 'low', reason: 'nome do arquivo', source: 'filename' }
  }
  return { kind: 'unknown', confidence: 'low', source: 'none' }
}

/**
 * ÚNICO ponto de entrada dos SINAIS BARATOS (síncrono, sem IA, sem rede) — a
 * camada barata do ContentClassifier. É isto que as telas e a rota `/api/capture/
 * classify` chamam: nenhuma tela implementa heurística própria (SSOT da
 * classificação). Hoje só o nome do arquivo resolve; quando entrarem MIME/
 * assinatura inequívocos (DICOM, XML, HL7, PDF estruturado), a regra nasce AQUI e
 * tanto o palpite instantâneo da tela quanto a rota passam a se beneficiar — sem
 * que nenhuma tela mude. Devolve 'high' curto-circuita a IA na rota.
 */
export function classifyCheap(mediaType: string, filename: string): ClassificationResult {
  void mediaType // reservado p/ regras de MIME/assinatura inequívocos (DICOM, XML, HL7…)
  return classifyByFilename(filename)
}
