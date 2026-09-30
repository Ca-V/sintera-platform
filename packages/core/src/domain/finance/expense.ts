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

/**
 * O aviso antes de remover um lançamento das Despesas.
 *
 * DIVERGÊNCIA REAL, achada na varredura de 30/09/2026 — não era só texto repetido. A Web dizia "apenas o
 * registro financeiro" e o aplicativo dizia "só o registro financeiro". Ninguém decidiu mudar: a segunda
 * implementação escreveu com as próprias palavras, e ninguém comparou.
 *
 * A frase leva o título dentro, então não cabe em `SCREEN_COPY` como texto fixo — vira função, e a decisão
 * continua num lugar só.
 *
 * O QUE ELA PRECISA DIZER, e por que a distinção importa: um exame com valor pago é UM registro que aparece
 * em dois lugares. Remover a despesa não apaga o exame, e quem não souber disso hesita em limpar as
 * Despesas com medo de perder o laudo.
 */
export function avisoRemoverDespesa(titulo: string, ehExame: boolean): string {
  const t = `"${titulo}"`
  // AS DUAS FRASES DIVERGIAM, e a segunda pior: a Web avisava "O evento é removido" e o aplicativo não.
  // Não é detalhe — quando o lançamento NÃO vem de um exame, apagar a despesa apaga o evento junto. O
  // aplicativo prometia menos do que fazia, e a pessoa descobria depois.
  return ehExame
    ? `Remover o valor pago de ${t}? O exame é mantido; apenas o registro financeiro sai das Despesas.`
    : `Excluir ${t} das suas despesas? O evento é removido.`
}
