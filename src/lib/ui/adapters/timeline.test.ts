import { describe, it, expect } from 'vitest'
import { eventsToTimeline, eventNatureOf, healthEventToTimelineEvent } from './timeline'
import { rowToHealthEvent, type HealthEventRow } from '../../agenda/event'

const row = (over: Partial<HealthEventRow>): HealthEventRow => ({
  id: 'id', event_type: 'outro', title: '', event_date: '2026-07-01', ...over,
})

describe('adapter timeline — traduz banco → apresentação', () => {
  it('event_type vira nature (a UI nunca vê event_type)', () => {
    expect(eventNatureOf('consulta')).toBe('consult')
    expect(eventNatureOf('exame')).toBe('exam')
    expect(eventNatureOf('vacina')).toBe('vaccine')
    expect(eventNatureOf('procedimento')).toBe('operation')
    expect(eventNatureOf('medicamento')).toBe('purchase')
    expect(eventNatureOf('tipo_desconhecido')).toBe('generic')
  })

  it('título ausente cai num rótulo legível (gap: eventos sem título)', () => {
    const ev = rowToHealthEvent(row({ event_type: 'exame', title: '' }))
    expect(healthEventToTimelineEvent(ev).title).toBe('Exame')
  })

  it('formata a data (DD mmm YYYY) sem vazar o formato do banco', () => {
    const ev = rowToHealthEvent(row({ event_date: '2026-07-03' }))
    expect(healthEventToTimelineEvent(ev).when).toBe('03 jul 2026')
  })

  it('não expõe campos crus do banco no TimelineEvent', () => {
    const out = healthEventToTimelineEvent(rowToHealthEvent(row({ event_type: 'consulta', title: 'X' })))
    expect(Object.keys(out).sort()).toEqual(['context', 'iso', 'nature', 'title', 'when'].sort())
    expect('event_type' in out).toBe(false)
  })
})

describe('adapter timeline — DETERMINISMO (desempate fixo do domínio)', () => {
  const rows: HealthEventRow[] = [
    row({ id: 'c', event_type: 'exame', title: 'Exame', event_date: '2026-07-03', event_time: '10:00' }),
    row({ id: 'a', event_type: 'consulta', title: 'Consulta', event_date: '2026-07-03', event_time: '10:00' }),
    row({ id: 'b', event_type: 'medicamento', title: 'Compra', event_date: '2026-07-02', event_time: null }),
  ]

  it('mesma entrada → mesma saída (recente 1º; desempate = reverso do canônico data→hora→id)', () => {
    const out = eventsToTimeline(rows).map((e) => `${e.when} ${e.title}`)
    // canônico asc: 02/07 Compra · 03/07 Consulta(a) · 03/07 Exame(c)
    // exibição (reverse, recente 1º): 03/07 Exame(c) · 03/07 Consulta(a) · 02/07 Compra
    expect(out).toEqual(['03 jul 2026 Exame', '03 jul 2026 Consulta', '02 jul 2026 Compra'])
  })

  it('ordem de entrada não altera a saída', () => {
    const shuffled = [rows[2], rows[0], rows[1]]
    expect(eventsToTimeline(shuffled)).toEqual(eventsToTimeline(rows))
  })
})
