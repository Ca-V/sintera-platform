// FUNC · WEA-001/HIP-001 — V2 Épico 3.1: throttle da sincronização ON-OPEN (puro).
import { describe, it, expect } from 'vitest'
import { isSyncStale } from '@/lib/connectors/orchestrator'

const now = Date.parse('2026-07-20T12:00:00Z')
const THROTTLE = 15 * 60 * 1000 // 15 min

describe('isSyncStale — throttle on-open', () => {
  it('nunca sincronizou (nulo) → sincroniza', () => {
    expect(isSyncStale(null, THROTTLE, now)).toBe(true)
  })
  it('sincronizou há mais que o throttle → sincroniza', () => {
    expect(isSyncStale('2026-07-20T11:30:00Z', THROTTLE, now)).toBe(true) // 30 min
  })
  it('sincronizou há menos que o throttle → NÃO sincroniza (evita flood)', () => {
    expect(isSyncStale('2026-07-20T11:50:00Z', THROTTLE, now)).toBe(false) // 10 min
  })
  it('exatamente no limite → sincroniza', () => {
    expect(isSyncStale('2026-07-20T11:45:00Z', THROTTLE, now)).toBe(true) // 15 min
  })
  it('data inválida → sincroniza (seguro)', () => {
    expect(isSyncStale('nao-e-data', THROTTLE, now)).toBe(true)
  })
})
