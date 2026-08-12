// FUNC — serviço de Exames (builder de update puro + validação).
import { describe, it, expect } from 'vitest'
import { buildExamUpdate } from '@/lib/exams/service'
import { ValidationError } from '@/lib/api/errors'

describe('buildExamUpdate', () => {
  it('mapeia type/examDate/status (camelCase → coluna), com trim no type', () => {
    expect(buildExamUpdate({ type: '  Hemograma  ', examDate: '2026-05-10', status: 'processed' }))
      .toEqual({ type: 'Hemograma', exam_date: '2026-05-10', status: 'processed' })
  })

  it('inclui APENAS os campos presentes (patch parcial)', () => {
    expect(buildExamUpdate({ type: 'Novo nome' })).toEqual({ type: 'Novo nome' })
    expect(buildExamUpdate({ status: 'error' })).toEqual({ status: 'error' })
    expect(buildExamUpdate({})).toEqual({})
  })

  it('examDate vazio → null; presente → valor', () => {
    expect(buildExamUpdate({ examDate: '' })).toEqual({ exam_date: null })
    expect(buildExamUpdate({ examDate: null })).toEqual({ exam_date: null })
  })

  it('type vazio (quando presente) → ValidationError', () => {
    expect(() => buildExamUpdate({ type: '   ' })).toThrow(ValidationError)
  })
})
