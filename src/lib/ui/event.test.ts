import { describe, it, expect } from 'vitest'
import { EVENT_NATURE, ALL_EVENT_NATURES } from './event'

describe('EventCard — natureza do evento', () => {
  it('cobre as 7 naturezas', () => {
    expect(ALL_EVENT_NATURES.sort()).toEqual(
      ['consult', 'document', 'exam', 'generic', 'operation', 'purchase', 'vaccine'].sort()
    )
  })

  it('toda natureza tem tom e rótulo', () => {
    const tones = ['accent', 'neutral', 'attention', 'positive']
    for (const n of ALL_EVENT_NATURES) {
      expect(tones).toContain(EVENT_NATURE[n].tone)
      expect(EVENT_NATURE[n].label.length).toBeGreaterThan(0)
    }
  })

  it('operação é tom de atenção (sem alarme); compra é accent', () => {
    expect(EVENT_NATURE.operation.tone).toBe('attention')
    expect(EVENT_NATURE.purchase.tone).toBe('accent')
  })
})
