// @sintera/core — googleCalendarUrl: montagem determinística da URL de calendário (D-07).
import { describe, it, expect } from 'vitest'
import { googleCalendarUrl } from '@sintera/core'

const base = { title: 'Consulta', date: '2026-12-20', time: null, durationMin: null, notes: null, establishment: null, location: null }

function params(url: string) { return new URL(url).searchParams }

describe('googleCalendarUrl', () => {
  it('evento com horário: intervalo com duração informada', () => {
    const p = params(googleCalendarUrl({ ...base, time: '14:00', durationMin: 30 }))
    expect(p.get('action')).toBe('TEMPLATE')
    expect(p.get('text')).toBe('Consulta')
    expect(p.get('dates')).toBe('20261220T140000/20261220T143000')
  })

  it('sem duração usa 60min por padrão', () => {
    expect(params(googleCalendarUrl({ ...base, time: '09:00' })).get('dates')).toBe('20261220T090000/20261220T100000')
  })

  it('sem horário: dia inteiro com fim exclusivo (dia seguinte)', () => {
    expect(params(googleCalendarUrl({ ...base, date: '2026-03-10' })).get('dates')).toBe('20260310/20260311')
  })

  it('dia inteiro cruzando o mês', () => {
    expect(params(googleCalendarUrl({ ...base, date: '2026-01-31' })).get('dates')).toBe('20260131/20260201')
  })

  it('details junta notas/local/estabelecimento; título vazio vira "Evento"', () => {
    const p = params(googleCalendarUrl({ ...base, title: '  ', notes: 'Jejum 8h', establishment: 'Lab X', location: null }))
    expect(p.get('text')).toBe('Evento')
    expect(p.get('details')).toBe('Jejum 8h · Lab X')
  })

  it('sem details não inclui o parâmetro', () => {
    expect(params(googleCalendarUrl({ ...base, time: '10:00' })).has('details')).toBe(false)
  })
})
