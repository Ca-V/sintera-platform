// ARCH — Contrato das RECIPES DE DOMÍNIO (Passo 3B · Etapa 4).
// Componentes de produto headless: fato do domínio (factual) → tratamento visual por papéis; acessibilidade.
import { describe, it, expect } from 'vitest'
import {
  getTheme, contrastRatio, WCAG,
  classifyValue, statusTreatment, labValueCell, labGroupHeader, labName, banner, timelineRow, biomarkerCard, indicator,
  healthEvent, longitudinalChart, clinicalDocumentCard, observationCard,
  type Theme, type ValueStatus,
} from '../../packages/design-system/src'

const THEMES: Theme[] = ['light', 'dark']

describe('ARCH · domínio — classificação FACTUAL (não clínica)', () => {
  it('classifyValue compara com a referência fornecida', () => {
    expect(classifyValue(5, 10, 20)).toBe('below')
    expect(classifyValue(25, 10, 20)).toBe('above')
    expect(classifyValue(15, 10, 20)).toBe('within')
    expect(classifyValue(15)).toBe('unknown')
  })
})

describe('ARCH · domínio — tratamento visual e acessibilidade', () => {
  for (const mode of THEMES) {
    const t = getTheme(mode)

    it(`[${mode}] Laboratory: within não destaca; below/above destacam com flag AA sobre o soft`, () => {
      expect(labValueCell(t, { status: 'within' }).flag).toBeNull()
      for (const status of ['below', 'above'] as ValueStatus[]) {
        const cell = labValueCell(t, { status, trend: 'up' })
        expect(cell.flag).not.toBeNull()
        expect(cell.value.style).toBe(t.typography.numeric.primary)
        expect(cell.alignEnd).toBe(true)
        expect(contrastRatio(cell.flag!.textColor, cell.flag!.backgroundColor)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      }
      expect(statusTreatment(t, 'within').soft).toBeNull()
    })

    it(`[${mode}] Timeline: medicação/evento mapeiam papéis distintos; densidade define ritmo`, () => {
      expect(timelineRow(t, { kind: 'medication' }).node.color).toBe(t.color.timeline.medication)
      expect(timelineRow(t, { kind: 'event' }).node.color).toBe(t.color.timeline.event)
      expect(timelineRow(t, { density: 'compact' }).rowPaddingY).toBe(t.density.compact.rowY)
    })

    it(`[${mode}] Biomarker: sparkline usa alerta quando fora da referência, primária quando dentro`, () => {
      expect(biomarkerCard(t, { status: 'above' }).sparklineColor).toBe(t.color.chart.alert)
      expect(biomarkerCard(t, { status: 'within' }).sparklineColor).toBe(t.color.chart.primary)
      expect(biomarkerCard(t).value.style).toBe(t.typography.numeric.large)
    })

    it(`[${mode}] Laboratory cobre os TIPOS de resultado (numérico/qualitativo/ausente/falha)`, () => {
      // numérico dentro: sem flag, não discreto, alinhado à direita
      const within = labValueCell(t, { kind: 'numeric', status: 'within' })
      expect(within.flag).toBeNull(); expect(within.subdued).toBe(false); expect(within.alignEnd).toBe(true)
      // numérico acima: flag presente
      expect(labValueCell(t, { kind: 'numeric', status: 'above' }).flag).not.toBeNull()
      // qualitativo: discreto, sem flag, alinhado à esquerda (texto)
      const qual = labValueCell(t, { kind: 'qualitative' })
      expect(qual.subdued).toBe(true); expect(qual.flag).toBeNull(); expect(qual.alignEnd).toBe(false)
      // ausente e falha: discretos, sem flag
      expect(labValueCell(t, { kind: 'missing' }).subdued).toBe(true)
      expect(labValueCell(t, { kind: 'failed' }).flag).toBeNull()
      // cabeçalho de grupo: material e exame com tratamentos distintos
      expect(labGroupHeader(t, { level: 'material' }).title.style).not.toBe(labGroupHeader(t, { level: 'exam' }).title.style)
      // capacidades opcionais por props: nome interativo (link) e linha de status descritivo
      expect(labName(t, { interactive: true }).color).toBe(t.color.text.link)
      expect(labName(t, { interactive: false }).color).toBe(t.color.text.default)
      expect(labValueCell(t, { kind: 'numeric', status: 'above' }).statusLine.color).toBe(t.color.badge.attention.text)
      expect(labValueCell(t, { kind: 'numeric', status: 'within' }).statusLine.color).toBe(t.color.text.muted)
      // Banner: texto com AA sobre o próprio fundo, em todos os tons
      for (const tone of ['info', 'success', 'attention', 'error', 'neutral'] as const) {
        const b = banner(t, { tone })
        expect(contrastRatio(b.text.color, b.container.backgroundColor)).toBeGreaterThanOrEqual(WCAG.AA_NORMAL)
      }
    })

    it(`[${mode}] demais componentes derivam do tema`, () => {
      expect(indicator(t).value.style).toBe(t.typography.numeric.large)
      expect(healthEvent(t).icon.color).toBe(t.color.identity.primary)
      expect(longitudinalChart(t).series).toBe(t.color.chart.primary)
      expect(longitudinalChart(t).grid).toBe(t.color.chart.grid)
      expect(clinicalDocumentCard(t).action.container.backgroundColor).toBe('transparent') // ação ghost
      expect(observationCard(t, { tier: 'clinical' }).tierColor).toBe(t.color.badge.success.fill)
    })
  }
})
