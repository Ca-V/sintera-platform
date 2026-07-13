import { describe, it, expect } from 'vitest'
import { computeCoverage } from '@/lib/capture/coverage'

// FUNC — Coverage (comparador puro). Recebe a CDU (descoberto) e o nº estruturado; compara.
// Não descobre nada. Caso-âncora GS-011: descoberto 6 × estruturado 4 → PARCIAL, nunca "completo".

describe('FUNC · computeCoverage', () => {
  it('GS-011: descoberto 6 × estruturado 4 → PARCIAL (67%), nunca completo', () => {
    const r = computeCoverage({ cdu: { index: 1, discoveredUnits: 6 }, structuredUnits: 4 })
    expect(r.status).toBe('partial')
    expect(r.certifiedComplete).toBe(false)
    expect(Math.round(r.ratio * 100)).toBe(67)
    expect(r.reason).toMatch(/faltam 2/)
  })

  it('tudo estruturado → completo', () => {
    const r = computeCoverage({ cdu: { index: 1, discoveredUnits: 5 }, structuredUnits: 5 })
    expect(r.status).toBe('complete')
    expect(r.certifiedComplete).toBe(true)
  })

  it('estruturado além do descoberto (ruído) → completo, ratio capado em 1', () => {
    const r = computeCoverage({ cdu: { index: 1, discoveredUnits: 3 }, structuredUnits: 5 })
    expect(r.certifiedComplete).toBe(true)
    expect(r.ratio).toBe(1)
  })

  it('nada descoberto → empty, NÃO alega completude', () => {
    const r = computeCoverage({ cdu: { index: 1, discoveredUnits: 0 }, structuredUnits: 0 })
    expect(r.status).toBe('empty')
    expect(r.certifiedComplete).toBe(false)
  })

  it('é DETERMINÍSTICA', () => {
    const a = computeCoverage({ cdu: { index: 2, discoveredUnits: 6 }, structuredUnits: 4 })
    const b = computeCoverage({ cdu: { index: 2, discoveredUnits: 6 }, structuredUnits: 4 })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
