// FUNC — serviço de domínio de Hábitos de Vida (lógica pura de payload).
import { describe, it, expect } from 'vitest'
import { buildHabitPayload } from '@/lib/habitos/service'
import { ValidationError } from '@/lib/api/http'

describe('buildHabitPayload', () => {
  it('exige descrição — vazia lança ValidationError', () => {
    expect(() => buildHabitPayload('u1', { category: 'sono', description: '   ' }))
      .toThrow(ValidationError)
  })

  it('faz trim da descrição e carimba user_id/category', () => {
    const p = buildHabitPayload('u1', { category: 'sono', description: '  7h de sono  ' })
    expect(p.description).toBe('7h de sono')
    expect(p.user_id).toBe('u1')
    expect(p.category).toBe('sono')
  })

  it('frequency/notes: trim; vazios viram null', () => {
    const cheio = buildHabitPayload('u1', { category: 'atividade_fisica', description: 'Caminhada', frequency: ' 3x semana ', notes: ' leve ' })
    expect(cheio.frequency).toBe('3x semana')
    expect(cheio.notes).toBe('leve')
    const vazio = buildHabitPayload('u1', { category: 'atividade_fisica', description: 'X', frequency: '', notes: '  ' })
    expect(vazio.frequency).toBeNull()
    expect(vazio.notes).toBeNull()
  })

  it('categoria desconhecida cai para outro', () => {
    // @ts-expect-error — normalização de entrada inesperada
    expect(buildHabitPayload('u1', { category: 'meditacao', description: 'X' }).category).toBe('outro')
  })
})
