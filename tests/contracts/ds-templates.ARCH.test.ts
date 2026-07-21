// ARCH — Contrato dos TEMPLATES (Passo 3B · Etapa 5). Composição headless; decisões de layout no DS, não no adaptador.
import { describe, it, expect } from 'vitest'
import { getTheme, template, templateKinds, contentMaxWidth, type Theme } from '../../packages/design-system/src'

const THEMES: Theme[] = ['light', 'dark']

describe('ARCH · templates — composição e layout compartilhados', () => {
  it('cobre as 7 páginas fundamentais', () => {
    expect(templateKinds.length).toBe(7)
    expect(templateKinds).toContain('dashboard')
    expect(templateKinds).toContain('examResult')
  })

  for (const mode of THEMES) {
    const t = getTheme(mode)
    it(`[${mode}] cada template deriva fundo/largura/respiro dos papéis e tem regiões`, () => {
      for (const kind of templateKinds) {
        const layout = template(t, kind)
        expect(layout.background).toBe(t.color.surface.app)
        expect(layout.maxWidth).toBe(contentMaxWidth)
        expect(layout.paddingX).toBe(t.spacing.page)
        expect(layout.sectionGap).toBe(t.spacing.section)
        expect(layout.regions.length).toBeGreaterThan(0)
      }
    })
  }
})
