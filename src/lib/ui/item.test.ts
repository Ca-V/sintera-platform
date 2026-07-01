import { describe, it, expect } from 'vitest'
import { ITEM_KIND_LABEL, STATUS_BADGE, ALL_ITEM_KINDS, itemKindLabel } from './item'

describe('ItemCard — modelo de apresentação', () => {
  it('cobre os 8 kinds canônicos', () => {
    expect(ALL_ITEM_KINDS.sort()).toEqual(
      ['condition', 'device', 'document', 'exam', 'medication', 'product', 'program', 'supplement'].sort()
    )
  })

  it('todo kind tem rótulo não vazio', () => {
    for (const kind of ALL_ITEM_KINDS) expect(ITEM_KIND_LABEL[kind].length).toBeGreaterThan(0)
  })

  it('itemKindLabel resolve o rótulo', () => {
    expect(itemKindLabel('device')).toBe('Dispositivo')
    expect(itemKindLabel('medication')).toBe('Medicamento')
  })

  it('todo status mapeia para um Badge válido', () => {
    const valid = ['rose', 'lavender', 'sage', 'gold', 'neutral']
    for (const s of Object.values(STATUS_BADGE)) {
      expect(s.label.length).toBeGreaterThan(0)
      expect(valid).toContain(s.variant)
    }
  })

  it('ativo é sage e suspenso é gold (tom de organização, não alarme)', () => {
    expect(STATUS_BADGE.active.variant).toBe('sage')
    expect(STATUS_BADGE.suspended.variant).toBe('gold')
  })
})
