// FUNC · BOD-001 área ② — Evolução Longitudinal: filtro de período + marcador por origem. PURO.
import { describe, it, expect } from 'vitest'
import { filterByPeriod, markerFor, EVOLUTION_PERIODS, SOURCE_MARKER } from '@/lib/body/evolution'

describe('BOD-001 · filterByPeriod', () => {
  const pts = [
    { date: '2026-01-01', value: 1 },
    { date: '2026-06-01', value: 2 },
    { date: '2026-07-10', value: 3 },   // dentro de 90 dias de 2026-07-20
    { date: '2026-07-18', value: 4 },
  ]
  const now = '2026-07-20'

  it('days=null → todo o histórico', () => {
    expect(filterByPeriod(pts, null, now)).toHaveLength(4)
  })

  it('30 dias mantém só os pontos recentes', () => {
    const r = filterByPeriod(pts, 30, now)
    expect(r.map(p => p.value)).toEqual([3, 4])
  })

  it('90 dias inclui junho', () => {
    const r = filterByPeriod(pts, 90, now)
    expect(r.map(p => p.value)).toEqual([2, 3, 4])
  })

  it('1 ano inclui tudo', () => {
    expect(filterByPeriod(pts, 365, now)).toHaveLength(4)
  })
})

describe('BOD-001 · markerFor (origem → forma)', () => {
  it('mapeia origens conhecidas a formas distintas', () => {
    expect(markerFor('bioimpedancia')).toBe('circle')
    expect(markerFor('dexa')).toBe('triangle')
    expect(markerFor('manual')).toBe('square')
    expect(markerFor('balanca')).toBe('diamond')
  })
  it('origem desconhecida/nula → círculo genérico (não quebra)', () => {
    expect(markerFor('xpto')).toBe('circle')
    expect(markerFor(null)).toBe('circle')
  })
  it('todos os períodos têm rótulo; formas válidas', () => {
    expect(EVOLUTION_PERIODS.map(p => p.key)).toContain('all')
    for (const s of Object.values(SOURCE_MARKER)) expect(['circle', 'square', 'triangle', 'diamond']).toContain(s)
  })
})
