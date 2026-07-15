// Política BINÁRIA de estruturação (F6 / E3 / regra_estruturacao_binaria) — decisão PURA.
//
// A UI só pode mostrar 2 estados ao usuário: "Resultados estruturados" | "Documento disponível".
// NUNCA "estruturação parcial": a completude/cobertura interna (`partial`) é auditoria, não estado
// de usuário — cai em "estruturados" (os dados extraídos permanecem; o documento original segue
// acessível). Determinística; reutilizada onde quer que o estado de estruturação seja exibido.

export type StructuringState = 'structured' | 'document_only'

export const STRUCTURING_LABEL: Record<StructuringState, string> = {
  structured:    'Resultados estruturados',
  document_only: 'Documento disponível',
}

/**
 * Mapeia a completude interna (`extraction_completeness`: structured | partial | document_only | …)
 * para o estado BINÁRIO de usuário. Só `document_only` vira "Documento disponível"; qualquer outro
 * valor (structured, **partial**, nulo, desconhecido) vira "Resultados estruturados". Nunca "parcial".
 */
export function binaryStructuringState(completeness: string | null | undefined): StructuringState {
  return completeness === 'document_only' ? 'document_only' : 'structured'
}

/** Rótulo binário direto a partir da completude. */
export function binaryStructuringLabel(completeness: string | null | undefined): string {
  return STRUCTURING_LABEL[binaryStructuringState(completeness)]
}
