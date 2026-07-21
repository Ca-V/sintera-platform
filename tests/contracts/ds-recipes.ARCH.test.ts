// ARCH — Contrato das RECIPES dos componentes fundamentais (Passo 3B · Etapa 3, ADR-011).
// Verifica: derivação 100% do tema (papéis), acessibilidade (contraste + alvo de toque) e mapeamento semântico.
import { describe, it, expect } from 'vitest'
import {
  getTheme, contrastRatio, WCAG,
  button, text, heading, card, surface, badge, chip, divider, icon, avatar,
  type Theme, type BadgeTone,
} from '../../packages/design-system/src'

const THEMES: Theme[] = ['light', 'dark']
const TONES: BadgeTone[] = ['info', 'success', 'attention', 'error', 'neutral']

describe('ARCH · recipes — derivação do tema e acessibilidade', () => {
  for (const mode of THEMES) {
    const t = getTheme(mode)

    it(`[${mode}] button.primary deriva dos papéis e o texto tem AA sobre o fundo`, () => {
      const b = button(t, { variant: 'primary' })
      expect(b.container.backgroundColor).toBe(t.color.button.primary.background)
      expect(b.label.color).toBe(t.color.button.primary.text)
      expect(contrastRatio(b.label.color, b.container.backgroundColor)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
    })

    it(`[${mode}] button.secondary tem texto com AA sobre o fundo`, () => {
      const b = button(t, { variant: 'secondary' })
      expect(contrastRatio(b.label.color, b.container.backgroundColor)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
    })

    it(`[${mode}] alvo de toque do botão md ≥ 44 e disabled aplica opacidade do tema`, () => {
      expect(button(t, { size: 'md' }).container.minHeight).toBeGreaterThanOrEqual(44)
      expect(button(t, { state: 'disabled' }).container.opacity).toBe(t.opacity.disabled)
    })

    it(`[${mode}] badge: cada tom mapeia soft/text do tema e o texto tem AA sobre o soft`, () => {
      for (const tone of TONES) {
        const bd = badge(t, { tone })
        expect(bd.container.backgroundColor).toBe(t.color.badge[tone].soft)
        expect(bd.label.color).toBe(t.color.badge[tone].text)
        expect(contrastRatio(bd.label.color, bd.container.backgroundColor)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      }
    })

    it(`[${mode}] texto/título consomem papéis tipográficos e de cor`, () => {
      expect(text(t, { role: 'body', tone: 'muted' }).color).toBe(t.color.text.muted)
      expect(text(t, { role: 'body' }).style).toBe(t.typography.body)
      expect(heading(t, { level: 'section' }).style).toBe(t.typography.sectionTitle)
    })

    it(`[${mode}] superfícies e símbolos derivam do tema`, () => {
      expect(card(t).container.backgroundColor).toBe(t.color.surface.base)
      expect(card(t).container.borderWidth).toBe(t.border.hairline)
      // padding por intenção; 'none' zera (a tela controla o próprio espaçamento na migração DS-001→DS-002).
      expect(card(t, { padding: 'none' }).container.paddingX).toBe(0)
      expect(card(t, { padding: 'default' }).container.paddingX).toBe(t.padding.default)
      // cartão usa a sombra multi-camada `card` (igual ao .card-premium) — não a elevação fina.
      expect(card(t).container.shadowRole).toBe('card')
      expect(surface(t, { tone: 'accent' }).backgroundColor).toBe(t.color.surface.accent)
      expect(divider(t).color).toBe(t.color.border.default)
      expect(icon(t, { tone: 'identity' }).color).toBe(t.color.identity.primary)
      expect(avatar(t).backgroundColor).toBe(t.color.identity.soft)
    })

    it(`[${mode}] chip selecionado usa o realce; não selecionado tem contorno`, () => {
      expect(chip(t, { selected: true }).container.backgroundColor).toBe(t.color.surface.accent)
      expect(chip(t, { selected: false }).container.borderWidth).toBe(t.border.hairline)
    })
  }
})
