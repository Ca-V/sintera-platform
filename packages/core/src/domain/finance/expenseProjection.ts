// @sintera/core — Despesas (FB-008): PROJEÇÃO sobre TODOS os fatos com valor. Fonte ÚNICA (Web + Mobile).
// Não cria registros próprios: une eventos financeiros (selectFinancial) + exames-com-valor (atributo do exame).
// Cada fato UMA vez: exclui eventos legados vinculados a exame (o exame já entra como sua própria linha).
import type { HealthEvent } from '../agenda/event'

/** Linha de exame com valor (subset de `exams` lido para as Despesas). */
export interface ExamExpenseRow {
  id: string
  type: string | null
  exam_date: string | null
  created_at?: string | null
  issuer: string | null
  expense_amount_cents: number | null
  expense_doc_type: string | null
  expense_doc_url: string | null
}

/**
 * Projeta um EXAME-com-valor como lançamento de despesa (o financeiro é atributo do exame, não Evento).
 * id prefixado 'exam:' distingue do evento — a exclusão limpa as colunas do exame (não apaga o exame).
 */
export function examExpenseToEntry(e: ExamExpenseRow): HealthEvent {
  return {
    id: `exam:${e.id}`, type: 'exame', title: e.type || 'Exame', isReturn: false,
    status: 'realizado', source: 'system', priority: null,
    date: e.exam_date || String(e.created_at ?? '').slice(0, 10),
    time: null, durationMin: null, reminderEnabled: false, reminderSentAt: null,
    professionalKind: null, professionalName: null, establishment: e.issuer ?? null, location: null,
    modality: null, preparation: null, notes: null, amountCents: e.expense_amount_cents ?? null,
    directExpense: true, attachmentUrl: e.expense_doc_url ?? null, expenseDocType: e.expense_doc_type ?? null,
    links: [{ type: 'exam', id: e.id }], outcome: null, recurrenceRule: null, seriesId: null,
    parentEventId: null, rootEventId: null, completedAt: null,
  }
}

/**
 * União das Despesas: eventos financeiros (já filtrados por selectFinancial) que NÃO estão vinculados a exame
 * + exames-com-valor. Ordenado por data (desc). Cada fato aparece UMA vez (anti-duplicação FB-008).
 */
export function projectExpenses(financial: HealthEvent[], examRows: ExamExpenseRow[]): HealthEvent[] {
  const finNoExamLinked = financial.filter(e => !e.links?.some(l => l.type === 'exam'))
  const examEntries = examRows.map(examExpenseToEntry)
  return [...finNoExamLinked, ...examEntries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Total (centavos) de uma lista de lançamentos. */
export function expensesTotalCents(items: HealthEvent[]): number {
  return items.reduce((sum, e) => sum + (e.amountCents ?? 0), 0)
}
