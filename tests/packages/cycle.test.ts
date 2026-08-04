// @sintera/core — Ciclo: matemática de datas pura, estatística do ciclo, taxonomia de contracepção (CTC-001).
import { describe, it, expect } from 'vitest'
import { addDaysISO, addMonthsISO, daysBetweenISO, nextOccurrenceByDaysISO, cycleStats } from '../../packages/core/src/domain/cycleStats'
import { contraceptiveNature, defaultCadenceFor, cadenceDays, isHormonalContraceptive, CONTRACEPTIVE_KINDS } from '../../packages/core/src/domain/cycle'
import { addPeriod, deletePeriod } from '../../packages/api-client/src/cycle/menstrual'
import { mockSupabase, mockQueryBuilder, fakeSession } from '../api-client/supabaseMock'

describe('core · dateMath', () => {
  it('addDays/addMonths determinísticos (UTC), clampa fim de mês', () => {
    expect(addDaysISO('2026-01-31', 1)).toBe('2026-02-01')
    expect(addMonthsISO('2026-01-31', 1)).toBe('2026-02-28') // clamp
    expect(addMonthsISO('2026-08-15', 3)).toBe('2026-11-15')
    expect(daysBetweenISO('2026-01-01', '2026-01-08')).toBe(7)
  })
  it('nextOccurrenceByDays estritamente após hoje', () => {
    expect(nextOccurrenceByDaysISO('2026-01-01', 30, '2026-01-15')).toBe('2026-01-31')
    expect(nextOccurrenceByDaysISO('2026-05-01', 30, '2026-04-01')).toBe('2026-05-01') // start já é futuro
  })
})

describe('core · cycleStats', () => {
  it('<2 registros → sem média', () => {
    expect(cycleStats(['2026-05-01'])).toEqual({ avg: null, next: null, last: '2026-05-01' })
  })
  it('média das últimas janelas + previsão', () => {
    const s = cycleStats(['2026-01-01', '2026-01-29', '2026-02-26']) // gaps 28, 28
    expect(s.avg).toBe(28)
    expect(s.last).toBe('2026-02-26')
    expect(s.next).toBe('2026-03-26')
  })
})

describe('core · contracepção (taxonomia)', () => {
  it('natureza + cadência padrão + dias', () => {
    expect(contraceptiveNature('pilula')).toBe('hormonal')
    expect(contraceptiveNature('diu_cobre')).toBe('dispositivo')
    expect(isHormonalContraceptive('injecao')).toBe(true)
    expect(defaultCadenceFor('injecao')).toBe('trimestral')
    expect(cadenceDays('trimestral')).toBe(90)
    expect(CONTRACEPTIVE_KINDS.length).toBe(8)
  })
})

describe('api-client · menstrual', () => {
  it('addPeriod faz upsert idempotente por user+data', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { error } = await addPeriod(client, '2026-06-01')
    expect(error).toBeNull()
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.upsert?.[0]).toEqual({ user_id: 'u1', started_on: '2026-06-01' })
  })
  it('deletePeriod filtra por id+dono', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    await deletePeriod(client, 'p1')
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.eq).toEqual(['user_id', 'u1'])
  })
})
