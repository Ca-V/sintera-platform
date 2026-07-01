import { describe, it, expect } from 'vitest'
import { UI_STATES, ALL_STATE_KINDS, stateSpec } from './states'

describe('Biblioteca de Estados', () => {
  it('cobre os 8 estados canônicos', () => {
    expect(ALL_STATE_KINDS.sort()).toEqual(
      ['empty', 'error', 'finished', 'interrupted', 'loading', 'pending', 'processing', 'success'].sort()
    )
  })

  it('todo estado tem tom, ícone e comportamento descrito', () => {
    for (const kind of ALL_STATE_KINDS) {
      const s = UI_STATES[kind]
      expect(['neutral', 'success', 'danger', 'info']).toContain(s.tone)
      expect(s.icon.length).toBeGreaterThan(0)
      expect(s.behavior.length).toBeGreaterThan(0)
    }
  })

  it('só loading e processing são "busy"', () => {
    const busy = ALL_STATE_KINDS.filter(k => UI_STATES[k].busy)
    expect(busy.sort()).toEqual(['loading', 'processing'])
  })

  it('success é tom de sucesso e error é tom de perigo', () => {
    expect(stateSpec('success').tone).toBe('success')
    expect(stateSpec('error').tone).toBe('danger')
  })

  it('a chave do registro coincide com o kind do spec', () => {
    for (const kind of ALL_STATE_KINDS) expect(UI_STATES[kind].kind).toBe(kind)
  })
})
