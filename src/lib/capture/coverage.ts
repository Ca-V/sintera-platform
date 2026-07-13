// Coverage — validador da cobertura (após a Extração/CEF). COMPARADOR PURO: NÃO descobre nada.
//
// Princípio da Cobertura Documental (GOVERNANCA): "descobrir o que existe" é da Análise Estrutural/
// Segmentação; a Cobertura apenas COMPARA "descoberto × estruturado" DENTRO de uma CDU já delimitada.
// Fundadora: nenhuma camada compensa a ausência da anterior — por isso a Cobertura recebe a CDU e o
// resultado da extração; ela não conta páginas nem infere quantos exames existem.
//
// Fail-safe: enquanto a cobertura não fechar, a representação NUNCA é apresentada como definitiva/completa
// (§4.0.1). `partial`/`document_only`, sempre remetendo ao original.

import type { CertifiedCDU } from './identity-validator'

export type CoverageStatus = 'complete' | 'partial' | 'empty'

export interface CoverageReport {
  cduIndex: number
  /** O que a Análise Estrutural descobriu DENTRO desta CDU (unidades). */
  discovered: number
  /** O que o extrator/CEF efetivamente estruturou. */
  structured: number
  /** structured / discovered (0..1). */
  ratio: number
  status: CoverageStatus
  /** true só quando structured cobre TUDO que foi descoberto (nunca falsa completude). */
  certifiedComplete: boolean
  reason: string
}

export interface CoverageInput {
  cdu: Pick<CertifiedCDU, 'index' | 'discoveredUnits'>
  /** Número de unidades efetivamente estruturadas pelo extrator (ex.: biomarcadores distintos). */
  structuredUnits: number
}

/**
 * Compara descoberto (CDU) × estruturado (extração). Determinístico. Não descobre nada.
 */
export function computeCoverage(input: CoverageInput): CoverageReport {
  const discovered = Math.max(0, input.cdu.discoveredUnits ?? 0)
  const structured = Math.max(0, input.structuredUnits ?? 0)

  if (discovered === 0) {
    return {
      cduIndex: input.cdu.index, discovered: 0, structured, ratio: structured > 0 ? 1 : 0,
      status: 'empty',
      // Sem unidades descobertas, não há o que "completar" — não alega completude clínica.
      certifiedComplete: false,
      reason: 'nenhuma unidade descoberta nesta CDU (document_only).',
    }
  }

  const ratio = Math.min(structured / discovered, 1)
  const certifiedComplete = structured >= discovered
  const status: CoverageStatus = certifiedComplete ? 'complete' : 'partial'
  const reason = certifiedComplete
    ? `cobertura completa: ${structured}/${discovered}.`
    : `cobertura PARCIAL: ${structured}/${discovered} (${Math.round(ratio * 100)}%) — faltam ${discovered - structured}; consulte o documento original.`

  return { cduIndex: input.cdu.index, discovered, structured, ratio, status, certifiedComplete, reason }
}
