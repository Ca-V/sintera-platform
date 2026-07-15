// FUNC · Identificação padronizada do exame (F1/F3) — derivação nome × laboratório.

import { describe, it, expect } from 'vitest'
import { deriveExamIdentity } from '@/lib/exams/identification'

describe('deriveExamIdentity', () => {
  it('separa nome e laboratório de "Nome • Laboratório"', () => {
    expect(deriveExamIdentity('Hemograma Completo • Hermes Pardini')).toEqual({
      name: 'Hemograma Completo', lab: 'Hermes Pardini',
    })
  })

  it('issuer tem precedência sobre a parte do type', () => {
    expect(deriveExamIdentity('Hemograma • Lab Antigo', 'Fleury')).toEqual({ name: 'Hemograma', lab: 'Fleury' })
  })

  it('sem proveniência e sem issuer → lab null', () => {
    expect(deriveExamIdentity('Hemograma Completo')).toEqual({ name: 'Hemograma Completo', lab: null })
  })

  it('usa issuer quando o type não tem proveniência (ex.: exame renomeado)', () => {
    expect(deriveExamIdentity('Meu exame', 'Axial')).toEqual({ name: 'Meu exame', lab: 'Axial' })
  })

  it('nome vazio/nulo → "Exame"', () => {
    expect(deriveExamIdentity(null)).toEqual({ name: 'Exame', lab: null })
    expect(deriveExamIdentity('   ')).toEqual({ name: 'Exame', lab: null })
    expect(deriveExamIdentity(undefined, '  ')).toEqual({ name: 'Exame', lab: null })
  })

  it('laboratório com " • " interno é preservado (join)', () => {
    expect(deriveExamIdentity('US • Clínica • Unidade Centro').lab).toBe('Clínica • Unidade Centro')
  })
})
