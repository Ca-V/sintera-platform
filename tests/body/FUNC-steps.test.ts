// PASSOS POR DIA — a natureza que não cabia em lugar nenhum.
//
// Achado no diagnóstico dos wearables (28/08): o Health Connect entrega passos, e eles chegavam sem lugar —
// não são métrica corporal (a restrição de `body_metrics.metric` não os aceita) nem sessão de atividade (uma
// sessão tem início, fim e duração). Ficavam guardados no bruto e invisíveis, enquanto o painel os contava no
// total e mandava "veja em Monitoramento".
import { describe, it, expect } from 'vitest'
import { dailySteps, stepsLabel, stepsProvenance, type StepReading } from '@sintera/core'

const leitura = (recordedAt: string, value: number, provider = 'strava'): StepReading => ({ recordedAt, value, provider })

describe('passos por dia', () => {
  it('soma os trechos do MESMO dia e da mesma fonte', () => {
    // O Health Connect entrega passos em intervalos curtos — vários registros por dia, cada um com o trecho.
    const r = dailySteps([
      leitura('2026-08-28T08:00:00.000Z', 1200),
      leitura('2026-08-28T12:00:00.000Z', 3400),
      leitura('2026-08-28T19:00:00.000Z', 2100),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].total).toBe(6700)
  })

  it('NÃO soma fontes diferentes — o relógio e o celular contam os mesmos passos', () => {
    // Somar daria o dobro de um dia que a pessoa andou uma vez só. Fica o maior total: a fonte que mais viu é a
    // que mais se aproxima do real, e nenhuma contagem é inventada.
    const r = dailySteps([
      leitura('2026-08-28T08:00:00.000Z', 5000, 'garmin'),
      leitura('2026-08-28T08:00:00.000Z', 4800, 'health_connect'),
    ])
    expect(r[0].total).toBe(5000)
    expect(r[0].providers).toEqual(['garmin', 'health_connect'])
  })

  it('separa dias distintos', () => {
    const r = dailySteps([leitura('2026-08-27T10:00:00.000Z', 3000), leitura('2026-08-28T10:00:00.000Z', 4000)])
    expect(r.map(d => d.day)).toEqual(['2026-08-28', '2026-08-27'])
  })

  it('mais recente primeiro, como toda série da plataforma', () => {
    const r = dailySteps([
      leitura('2026-08-20T10:00:00.000Z', 1),
      leitura('2026-08-28T10:00:00.000Z', 2),
      leitura('2026-08-25T10:00:00.000Z', 3),
    ])
    expect(r.map(d => d.day)).toEqual(['2026-08-28', '2026-08-25', '2026-08-20'])
  })

  it('descarta o que não é contagem — sem inventar zero', () => {
    // Zero passos num dia é diferente de "não medimos". Uma leitura nula não vira dia com zero.
    const r = dailySteps([
      { recordedAt: '2026-08-28T08:00:00.000Z', value: null, provider: 'strava' },
      { recordedAt: 'data-invalida', value: 100, provider: 'strava' },
      { recordedAt: '2026-08-28T09:00:00.000Z', value: -5, provider: 'strava' },
    ])
    expect(r).toEqual([])
  })

  it('zero LEGÍTIMO conta como dia medido', () => {
    const r = dailySteps([leitura('2026-08-28T08:00:00.000Z', 0)])
    expect(r).toHaveLength(1)
    expect(r[0].total).toBe(0)
  })

  it('a mesma entrada devolve sempre o mesmo resultado', () => {
    const entrada = [leitura('2026-08-28T08:00:00.000Z', 1200), leitura('2026-08-27T08:00:00.000Z', 900)]
    expect(dailySteps(entrada)).toEqual(dailySteps(entrada))
  })
})

describe('apresentação', () => {
  it('separa milhar — é como se lê um número desse tamanho', () => {
    expect(stepsLabel(8432)).toBe('8.432 passos')
    expect(stepsLabel(950)).toBe('950 passos')
  })

  it('diz de onde veio; sem fonte conhecida, não inventa', () => {
    expect(stepsProvenance({ day: '2026-08-28', total: 1, providers: ['strava'] })).toBe('strava')
    expect(stepsProvenance({ day: '2026-08-28', total: 1, providers: ['garmin', 'strava'] })).toBe('garmin e strava')
    expect(stepsProvenance({ day: '2026-08-28', total: 1, providers: ['desconhecida'] })).toBeNull()
    expect(stepsProvenance({ day: '2026-08-28', total: 1, providers: [] })).toBeNull()
  })
})
