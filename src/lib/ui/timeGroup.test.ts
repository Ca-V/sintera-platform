import { describe, it, expect } from 'vitest'
import { timeBucket, groupByTime } from './timeGroup'

const REF = new Date(2026, 6, 10) // 10 jul 2026 (local)

describe('timeBucket — agrupamento relativo', () => {
  it('hoje e ontem', () => {
    expect(timeBucket('2026-07-10', REF).label).toBe('Hoje')
    expect(timeBucket('2026-07-09', REF).label).toBe('Ontem')
  })

  it('últimos 7 dias (2 a 6 dias atrás)', () => {
    expect(timeBucket('2026-07-08', REF).label).toBe('Últimos 7 dias')
    expect(timeBucket('2026-07-04', REF).label).toBe('Últimos 7 dias')
  })

  it('mesmo ano, mais antigo → mês de ano', () => {
    expect(timeBucket('2026-07-02', REF).label).toBe('Julho de 2026')
    expect(timeBucket('2026-06-15', REF).label).toBe('Junho de 2026')
  })

  it('ano anterior → só o ano', () => {
    expect(timeBucket('2025-12-20', REF).label).toBe('2025')
    expect(timeBucket('2024-01-01', REF).label).toBe('2024')
  })

  it('data civil sem fuso não cai no dia anterior', () => {
    // se fosse parseado como UTC, em BR (UTC-3) viraria 09/07
    expect(timeBucket('2026-07-10', REF).label).toBe('Hoje')
  })
})

describe('groupByTime — ordena buckets e itens (mais novo → mais antigo)', () => {
  const ev = (iso: string, id: string) => ({ iso, id })
  const items = [
    ev('2026-06-15', 'jun'),
    ev('2026-07-10', 'hoje'),
    ev('2025-12-20', 'ano'),
    ev('2026-07-09', 'ontem'),
    ev('2026-07-04', 'semana'),
  ]
  const groups = groupByTime(items, (e) => e.iso, REF)

  it('ordem dos buckets', () => {
    expect(groups.map((g) => g.label)).toEqual(['Hoje', 'Ontem', 'Últimos 7 dias', 'Junho de 2026', '2025'])
  })

  it('cada bucket tem seus itens', () => {
    expect(groups[0].items[0].id).toBe('hoje')
    expect(groups.at(-1)?.items[0].id).toBe('ano')
  })
})
