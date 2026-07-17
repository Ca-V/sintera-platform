// FUNC · Fluxo assistencial do exame — Pedido → Agendamento → Realização → Resultado.
// Certifica que os estados são explícitos: agendado ≠ realizado ≠ resultado.

import { describe, it, expect } from 'vitest'
import { resolveCareStage, nextStage, stageReached, stageIndex, CARE_STAGES, careStageFor } from '@/lib/exams/careFlow'

describe('careFlow · etapas em ordem', () => {
  it('a ordem é Pedido → Agendamento → Realização → Resultado', () => {
    expect(CARE_STAGES.map(s => s.key)).toEqual(['requested', 'scheduled', 'performed', 'resulted'])
    expect(stageIndex('scheduled')).toBeLessThan(stageIndex('performed'))
  })

  it('nextStage avança e termina no resultado', () => {
    expect(nextStage('requested')).toBe('scheduled')
    expect(nextStage('performed')).toBe('resulted')
    expect(nextStage('resulted')).toBeNull()
  })
})

describe('careFlow · resolveCareStage — agendado NÃO é realizado', () => {
  it('só pedido → requested', () => {
    expect(resolveCareStage({ hasRequest: true })).toBe('requested')
  })
  it('pedido + evento planejado → scheduled (NÃO performed)', () => {
    expect(resolveCareStage({ hasRequest: true, hasScheduledEvent: true })).toBe('scheduled')
  })
  it('evento realizado mas sem resultado → performed (NÃO resulted)', () => {
    expect(resolveCareStage({ hasScheduledEvent: true, eventPerformed: true })).toBe('performed')
  })
  it('resultado disponível → resulted (etapa mais avançada vence)', () => {
    expect(resolveCareStage({ hasRequest: true, hasScheduledEvent: true, eventPerformed: true, hasResult: true })).toBe('resulted')
  })
  it('sem sinal → null', () => {
    expect(resolveCareStage({})).toBeNull()
  })
})

describe('careFlow · stageReached (stepper)', () => {
  it('em performed, as etapas anteriores estão alcançadas; resultado não', () => {
    expect(stageReached('performed', 'scheduled')).toBe(true)
    expect(stageReached('performed', 'performed')).toBe(true)
    expect(stageReached('performed', 'resulted')).toBe(false)
  })
  it('null não alcança nada', () => {
    expect(stageReached(null, 'requested')).toBe(false)
  })
})

describe('careFlow · careStageFor (contexto do registro → etapa)', () => {
  it('documento de pedido, sem eventos nem resultado → requested', () => {
    expect(careStageFor({ hasResult: false, isOrder: true, linkedEventStatuses: [] })).toBe('requested')
  })
  it('pedido + evento planejado vinculado → scheduled', () => {
    expect(careStageFor({ hasResult: false, isOrder: true, linkedEventStatuses: ['planejado'] })).toBe('scheduled')
  })
  it('evento realizado vinculado, ainda sem resultado → performed', () => {
    expect(careStageFor({ hasResult: false, isOrder: false, linkedEventStatuses: ['realizado'] })).toBe('performed')
  })
  it('documento com resultado → resulted (independe dos eventos)', () => {
    expect(careStageFor({ hasResult: true, isOrder: false, linkedEventStatuses: [] })).toBe('resulted')
  })
  it('sem nenhum sinal → null (nada a exibir)', () => {
    expect(careStageFor({ hasResult: false, isOrder: false, linkedEventStatuses: [] })).toBeNull()
  })
})
