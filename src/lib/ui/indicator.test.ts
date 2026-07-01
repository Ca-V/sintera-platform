import { describe, it, expect } from 'vitest'
import { REFERENCE_STATUS, EVOLUTION_WINDOWS, windowPoints, type ReferenceStatus } from './indicator'

describe('IndicatorView — status de referência (factual, sem alarme)', () => {
  it('cobre within/outside/unknown', () => {
    const keys = Object.keys(REFERENCE_STATUS).sort()
    expect(keys).toEqual(['outside', 'unknown', 'within'])
  })

  it('within é sage; outside é gold (atenção, não alarme vermelho)', () => {
    expect(REFERENCE_STATUS.within.badge).toBe('sage')
    expect(REFERENCE_STATUS.outside.badge).toBe('gold')
  })

  it('todo status tem rótulo factual não vazio', () => {
    for (const s of Object.keys(REFERENCE_STATUS) as ReferenceStatus[]) {
      expect(REFERENCE_STATUS[s].label.length).toBeGreaterThan(0)
    }
  })
})

describe('IndicatorEvolutionCard — janelas recortam a série', () => {
  const series = Array.from({ length: 14 }, (_, i) => i)

  it('6 meses → últimos 6 pontos', () => {
    expect(windowPoints(series, '6m')).toEqual([8, 9, 10, 11, 12, 13])
  })

  it('1 ano → últimos 12 pontos', () => {
    expect(windowPoints(series, '1a')).toHaveLength(12)
  })

  it('todo histórico → série inteira', () => {
    expect(windowPoints(series, 'all')).toHaveLength(14)
  })

  it('janelas declaradas: 6m, 1a, all', () => {
    expect(EVOLUTION_WINDOWS.map((w) => w.id)).toEqual(['6m', '1a', 'all'])
  })
})
