// @sintera/core — FIN-001 — Documento fiscal anexado a uma despesa (Nota fiscal / Recibo / Comprovante /
// Outro) — para Relatórios (IR/reembolso) e auditoria. Puro/determinístico. Fonte ÚNICA (Web + Mobile).
// Lista ABERTA: 'outro' cobre o que não se enquadra; desconhecido → null.

export const EXPENSE_DOC_TYPES = [
  { id: 'nota_fiscal', label: 'Nota fiscal' },
  { id: 'recibo',      label: 'Recibo' },
  { id: 'comprovante', label: 'Comprovante de pagamento' },
  { id: 'outro',       label: 'Outro documento' },
] as const

export type ExpenseDocType = typeof EXPENSE_DOC_TYPES[number]['id']

const LABELS: Record<string, string> = Object.fromEntries(EXPENSE_DOC_TYPES.map(d => [d.id, d.label]))

/** Rótulo do tipo de documento fiscal (null quando ausente/desconhecido). */
export function expenseDocLabel(t: string | null | undefined): string | null {
  const k = (t ?? '').trim()
  return k ? (LABELS[k] ?? null) : null
}

/** Documento que serve de comprovação fiscal (NF ou recibo) — relevante para IR/reembolso. */
export function isFiscalDocument(t: string | null | undefined): boolean {
  return t === 'nota_fiscal' || t === 'recibo'
}
