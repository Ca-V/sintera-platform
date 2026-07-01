import { describe, it, expect } from 'vitest'
import { buildAttention, buildUpcoming, buildIndicators, buildDashboard, relativeWhen } from './dashboard'
import { rowToHealthEvent, type HealthEventRow } from '../../agenda/event'

const REF = '2026-07-10'
const row = (o: Partial<HealthEventRow>): HealthEventRow => ({ id: 'id', event_type: 'consulta', title: 'Evento', event_date: REF, ...o })
const ev = (o: Partial<HealthEventRow>) => rowToHealthEvent(row(o))

describe('relativeWhen', () => {
  it('hoje / amanhã / em N dias / data', () => {
    expect(relativeWhen('2026-07-10', REF)).toBe('hoje')
    expect(relativeWhen('2026-07-11', REF)).toBe('amanhã')
    expect(relativeWhen('2026-07-14', REF)).toBe('em 4 dias')
    expect(relativeWhen('2026-08-20', REF)).toBe('20 ago')
  })
})

describe('Dashboard DETERMINÍSTICO — prioridade no adapter, não na UI', () => {
  const events = [
    ev({ id: 'b', title: 'Exame', event_date: '2026-07-05' }),       // atrasado (mais recente)
    ev({ id: 'a', title: 'Consulta', event_date: '2026-07-01' }),    // atrasado (mais antigo)
  ]

  it('mesma entrada → mesma ordem: atrasados (por data) → exame aguardando', () => {
    const out = buildAttention(events, 2, REF).map((s) => s.title)
    expect(out).toEqual([
      'Consulta — atrasado',            // 01/07 (mais antigo primeiro, canônico)
      'Exame — atrasado',               // 05/07
      '2 exames aguardando extração',   // rank fixo depois dos atrasados
    ])
  })

  it('ordem de entrada não altera a saída', () => {
    const shuffled = [events[1], events[0]]
    expect(buildAttention(shuffled, 2, REF)).toEqual(buildAttention(events, 2, REF))
  })

  it('sem sinais → atenção vazia (bloco some)', () => {
    expect(buildAttention([], 0, REF)).toEqual([])
  })
})

describe('buildUpcoming — só futuros, ordenados, rótulo relativo', () => {
  it('filtra passados e formata relativo', () => {
    const events = [
      ev({ id: 'p', title: 'Passado', event_date: '2026-07-01' }),
      ev({ id: 'f', title: 'Futuro', event_date: '2026-07-12' }),
    ]
    const out = buildUpcoming(events, REF)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ title: 'Futuro', when: 'em 2 dias' })
  })
})

describe('buildDashboard — Estado 2 sai vazio (continuing, programs)', () => {
  it('continuing e programs vazios até o Estado 2', () => {
    const model = buildDashboard({ bioRows: [], eventRows: [], pendingExams: 0, refDate: REF })
    expect(model.continuing).toEqual([])
    expect(model.programs).toEqual([])
    expect(model.today).toHaveLength(5)
  })
})

describe('buildIndicators', () => {
  it('sem biomarcadores → vazio', () => {
    expect(buildIndicators([])).toEqual([])
  })
})
