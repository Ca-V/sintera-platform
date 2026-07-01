import { describe, it, expect } from 'vitest'
import { SITUATION_TONE, ALL_SITUATION_TONES } from './situation'

describe('SituationCard — card de situação (um componente, vários tons)', () => {
  it('cobre os 5 tons', () => {
    expect(ALL_SITUATION_TONES.sort()).toEqual(
      ['attention', 'information', 'pending', 'processing', 'success'].sort()
    )
  })

  it('todo tom tem classes de nó, ícone e flag busy', () => {
    for (const t of ALL_SITUATION_TONES) {
      const s = SITUATION_TONE[t]
      expect(s.node.length).toBeGreaterThan(0)
      expect(s.icon.length).toBeGreaterThan(0)
      expect(typeof s.busy).toBe('boolean')
    }
  })

  it('só processing é busy', () => {
    const busy = ALL_SITUATION_TONES.filter(t => SITUATION_TONE[t].busy)
    expect(busy).toEqual(['processing'])
  })

  it('a chave coincide com o tone do spec', () => {
    for (const t of ALL_SITUATION_TONES) expect(SITUATION_TONE[t].tone).toBe(t)
  })
})
