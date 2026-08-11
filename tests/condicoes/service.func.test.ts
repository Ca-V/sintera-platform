// FUNC — serviço de domínio de Condições de Saúde (lógica pura de payload).
// Garante que a extração da lógica para @/lib/condicoes/service preserva as
// regras que antes viviam dentro da página.
import { describe, it, expect } from 'vitest'
import { buildConditionPayload, ConditionValidationError } from '@/lib/condicoes/service'

describe('buildConditionPayload', () => {
  it('exige nome — vazio lança ConditionValidationError', () => {
    expect(() => buildConditionPayload('u1', { scope: 'propria', name: '   ' }))
      .toThrow(ConditionValidationError)
  })

  it('faz trim do nome e carimba o user_id', () => {
    const p = buildConditionPayload('u1', { scope: 'propria', name: '  Hipertensão  ' })
    expect(p.name).toBe('Hipertensão')
    expect(p.user_id).toBe('u1')
  })

  it('escopo próprio descarta relative (mesmo se enviado)', () => {
    const p = buildConditionPayload('u1', { scope: 'propria', name: 'Asma', relative: 'Mãe' })
    expect(p.scope).toBe('propria')
    expect(p.relative).toBeNull()
  })

  it('escopo familiar preserva relative com trim; vazio vira null', () => {
    expect(buildConditionPayload('u1', { scope: 'familiar', name: 'Diabetes', relative: '  Avô  ' }).relative).toBe('Avô')
    expect(buildConditionPayload('u1', { scope: 'familiar', name: 'Diabetes', relative: '   ' }).relative).toBeNull()
  })

  it('since_label e notes: trim; vazios viram null', () => {
    const cheio = buildConditionPayload('u1', { scope: 'propria', name: 'X', sinceLabel: ' 2020 ', notes: ' obs ' })
    expect(cheio.since_label).toBe('2020')
    expect(cheio.notes).toBe('obs')
    const vazio = buildConditionPayload('u1', { scope: 'propria', name: 'X', sinceLabel: '  ', notes: '' })
    expect(vazio.since_label).toBeNull()
    expect(vazio.notes).toBeNull()
  })

  it('escopo desconhecido cai para propria (normalização defensiva)', () => {
    // @ts-expect-error — valida a normalização de entrada inesperada
    const p = buildConditionPayload('u1', { scope: 'outro', name: 'X' })
    expect(p.scope).toBe('propria')
  })
})
