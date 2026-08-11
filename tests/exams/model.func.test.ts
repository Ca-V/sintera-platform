// FUNC — modelo de leitura do domínio Exames (regra de data efetiva + row→domínio).
import { describe, it, expect } from 'vitest'
import { effectiveExamDate, rowToExam } from '@/lib/exams/model'

describe('effectiveExamDate', () => {
  it('exam_date tem precedência sobre created_at', () => {
    expect(effectiveExamDate({ exam_date: '2026-03-01', created_at: '2026-02-01' })).toBe('2026-03-01')
  })
  it('sem exam_date → cai em created_at', () => {
    expect(effectiveExamDate({ exam_date: null, created_at: '2026-02-01' })).toBe('2026-02-01')
  })
  it('sem nenhum → string vazia', () => {
    expect(effectiveExamDate({})).toBe('')
  })
})

describe('rowToExam', () => {
  it('mapeia com defaults (type "Exame", status "pending") e data efetiva', () => {
    expect(rowToExam({ id: 'e1', created_at: '2026-02-01' })).toEqual({
      id: 'e1', type: 'Exame', status: 'pending', date: '2026-02-01', fileUrl: null,
    })
  })
  it('preserva type/status/file_url e aplica a regra de data', () => {
    expect(rowToExam({ id: 'e2', type: 'Hemograma', status: 'processed', exam_date: '2026-05-10', created_at: '2026-05-01', file_url: 'u' }))
      .toEqual({ id: 'e2', type: 'Hemograma', status: 'processed', date: '2026-05-10', fileUrl: 'u' })
  })
})
