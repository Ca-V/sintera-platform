// ARCH — Contrato dos TOKENS DE ESPAÇAMENTO (Passo 3B · Etapa 1 · Subitem 3).
// Papéis por INTENÇÃO (spacing.*, density.*) sobre primitivos; ritmo crescente; densidade ordenada.
import { describe, it, expect } from 'vitest'
import { space, spacing, padding, density } from '../../packages/design-system/src'

describe('ARCH · espaçamento — base e papéis por intenção', () => {
  it('primitivos formam escala não-negativa e crescente', () => {
    const vals = Object.values(space)
    expect(vals[0]).toBe(0)
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThan(vals[i - 1])
  })

  it('papéis de espaçamento crescem por intenção: inline < stack < group < section', () => {
    expect(spacing.inline).toBeLessThan(spacing.stack)
    expect(spacing.stack).toBeLessThan(spacing.group)
    expect(spacing.group).toBeLessThan(spacing.section)
  })

  it('papéis de padding crescem: tight < cozy < default < relaxed', () => {
    expect(padding.tight).toBeLessThan(padding.cozy)
    expect(padding.cozy).toBeLessThan(padding.default)
    expect(padding.default).toBeLessThan(padding.relaxed)
  })

  it('densidade ordenada para dados: compact < default < comfortable', () => {
    expect(density.compact.rowY).toBeLessThan(density.default.rowY)
    expect(density.default.rowY).toBeLessThan(density.comfortable.rowY)
    for (const lvl of ['compact', 'default', 'comfortable'] as const) {
      expect(density[lvl].rowY).toBeGreaterThan(0)
      expect(density[lvl].gap).toBeGreaterThan(0)
    }
  })
})
