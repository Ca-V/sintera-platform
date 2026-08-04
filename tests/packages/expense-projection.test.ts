// @sintera/core — Despesas (FB-008): projeção sobre eventos financeiros + exames-com-valor, anti-duplicação.
import { describe, it, expect } from 'vitest'
import { examExpenseToEntry, projectExpenses, expensesTotalCents, type ExamExpenseRow } from '../../packages/core/src/domain/finance/expenseProjection'
import type { HealthEvent } from '../../packages/core/src/domain/agenda/event'

function fin(p: Partial<HealthEvent>): HealthEvent {
  return {
    id: 'e', type: 'consulta', title: 'X', isReturn: false, status: 'realizado', source: 'manual', priority: null,
    date: '2026-05-01', time: null, durationMin: null, reminderEnabled: false, reminderSentAt: null,
    professionalKind: null, professionalName: null, establishment: null, location: null, modality: null,
    preparation: null, notes: null, amountCents: 1000, directExpense: false, attachmentUrl: null, expenseDocType: null,
    links: [], outcome: null, recurrenceRule: null, seriesId: null, parentEventId: null, rootEventId: null, completedAt: null, ...p,
  }
}
const examRow: ExamExpenseRow = { id: 'x1', type: 'Hemograma', exam_date: '2026-06-01', issuer: 'Lab', expense_amount_cents: 5000, expense_doc_type: 'nota_fiscal', expense_doc_url: 'u' }

describe('projectExpenses (FB-008)', () => {
  it('exame-com-valor vira lançamento id "exam:<id>", directExpense, com anexo', () => {
    const e = examExpenseToEntry(examRow)
    expect(e.id).toBe('exam:x1')
    expect(e).toMatchObject({ type: 'exame', status: 'realizado', directExpense: true, amountCents: 5000, establishment: 'Lab', expenseDocType: 'nota_fiscal' })
    expect(e.links).toEqual([{ type: 'exam', id: 'x1' }])
  })
  it('exclui evento vinculado a exame (anti-duplicação) e ordena desc por data', () => {
    const events = [
      fin({ id: 'a', date: '2026-01-01', links: [{ type: 'exam', id: 'x1' }] }), // deve sair (já entra como exam:)
      fin({ id: 'b', date: '2026-07-01', amountCents: 2000 }),                    // fica
    ]
    const out = projectExpenses(events, [examRow])
    expect(out.map(e => e.id)).toEqual(['b', 'exam:x1']) // b (07) antes de exam x1 (06); 'a' excluído
  })
  it('total soma os centavos', () => {
    expect(expensesTotalCents([fin({ amountCents: 2000 }), examExpenseToEntry(examRow)])).toBe(7000)
  })
})
