// @sintera/core — cadências (D-10): bimestral/trimestral/semestral via interval existente.
import { describe, it, expect } from 'vitest'
import { CADENCE_PRESETS, cadenceIdFor, cadenceById } from '@sintera/core'

describe('cadências de recorrência (D-10)', () => {
  it('inclui bimestral, trimestral e semestral como monthly × 2/3/6', () => {
    const byId = Object.fromEntries(CADENCE_PRESETS.map(p => [p.id, p]))
    expect(byId.bimonthly).toMatchObject({ frequency: 'monthly', interval: 2 })
    expect(byId.quarterly).toMatchObject({ frequency: 'monthly', interval: 3 })
    expect(byId.semiannual).toMatchObject({ frequency: 'monthly', interval: 6 })
  })

  it('cadenceIdFor mapeia regra→preset (e cai na base para intervalo desconhecido)', () => {
    expect(cadenceIdFor('monthly', 1)).toBe('monthly')
    expect(cadenceIdFor('monthly', 2)).toBe('bimonthly')
    expect(cadenceIdFor('monthly', 6)).toBe('semiannual')
    expect(cadenceIdFor('weekly', 1)).toBe('weekly')
    expect(cadenceIdFor('monthly', 4)).toBe('monthly') // fora dos presets → frequência base
  })

  it('cadenceById devolve o preset (fallback "Não repetir")', () => {
    expect(cadenceById('quarterly')).toMatchObject({ frequency: 'monthly', interval: 3 })
    expect(cadenceById('inexistente').id).toBe('none')
  })
})
