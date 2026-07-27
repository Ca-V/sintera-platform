// ARCH — Contrato das RECIPES dos componentes fundamentais (Passo 3B · Etapa 3, ADR-011).
// Verifica: derivação 100% do tema (papéis), acessibilidade (contraste + alvo de toque) e mapeamento semântico.
import { describe, it, expect } from 'vitest'
import {
  getTheme, contrastRatio, WCAG,
  button, text, heading, card, surface, badge, chip, divider, icon, avatar, input, toggle, field,
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

    it(`[${mode}] button.primary usa o gradiente de AÇÃO (identidade única web/mobile); cor sólida = fallback`, () => {
      expect(button(t, { variant: 'primary' }).container.backgroundGradient).toBe('action')
      expect(button(t, { variant: 'secondary' }).container.backgroundGradient).toBeUndefined()
      expect(button(t, { variant: 'ghost' }).container.backgroundGradient).toBeUndefined()
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

    it(`[${mode}] input deriva dos papéis; foco realça a identidade; erro usa feedback; alvo ≥ 44; texto AA`, () => {
      const base = input(t)
      expect(base.container.backgroundColor).toBe(t.color.surface.base)
      expect(base.container.borderColor).toBe(t.color.border.default)
      expect(base.container.borderWidth).toBe(t.border.hairline)
      expect(base.text.color).toBe(t.color.text.default)
      expect(base.placeholderColor).toBe(t.color.text.faint)
      expect(base.container.minHeight).toBeGreaterThanOrEqual(44)
      // foco = âncora de identidade + borda forte; erro = cor de erro
      expect(input(t, { state: 'focus' }).container.borderColor).toBe(t.color.identity.primary)
      expect(input(t, { state: 'focus' }).container.borderWidth).toBe(t.border.strong)
      expect(input(t, { state: 'error' }).container.borderColor).toBe(t.color.badge.error.text)
      // texto legível sobre o fundo do campo
      expect(contrastRatio(base.text.color, base.container.backgroundColor)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
    })

    it(`[${mode}] toggle: ON usa a identidade; OFF é distinto; disabled reduz a opacidade`, () => {
      const on = toggle(t)
      expect(on.trackOn).toBe(t.color.identity.primary)
      expect(on.trackOff).toBe(t.color.border.default)
      expect(on.thumb).toBe(t.color.surface.base)
      expect(on.opacity).toBe(1)
      // ON e OFF precisam ser visualmente distinguíveis
      expect(on.trackOn).not.toBe(on.trackOff)
      // disabled reduz a opacidade (sinal de indisponível)
      expect(toggle(t, { disabled: true }).opacity).toBeLessThan(1)
    })

    it(`[${mode}] field: rótulo/ajuda/erro derivam de papéis; erro usa a cor de erro; disabled reduz a opacidade`, () => {
      const f = field(t)
      // rótulo usa papel de texto padrão (cor de texto legível)
      expect(f.label.color).toBe(t.color.text.default)
      // ajuda é discreta (muted); distinta do rótulo
      expect(f.helper.color).toBe(t.color.text.muted)
      expect(f.helper.color).not.toBe(f.label.color)
      // erro e marcador de obrigatório usam a cor de feedback de erro
      expect(f.error.color).toBe(t.color.badge.error.text)
      expect(f.requiredMark.color).toBe(t.color.badge.error.text)
      // texto de erro tem contraste AA sobre a superfície onde aparece
      expect(contrastRatio(f.error.color, t.color.surface.base)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      // espaçamento vertical > 0 e opacidade plena por padrão
      expect(f.gap).toBeGreaterThan(0)
      expect(f.opacity).toBe(1)
      // disabled reduz a opacidade do conjunto
      expect(field(t, { disabled: true }).opacity).toBeLessThan(1)
    })
  }
})
