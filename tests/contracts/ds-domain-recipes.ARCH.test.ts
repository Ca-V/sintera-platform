// ARCH — Contrato das RECIPES DE DOMÍNIO (Passo 3B · Etapa 4).
// Componentes de produto headless: fato do domínio (factual) → tratamento visual por papéis; acessibilidade.
import { describe, it, expect } from 'vitest'
import {
  getTheme, contrastRatio, WCAG,
  classifyValue, statusTreatment, labValueCell, timelineRow, biomarkerCard, indicator,
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
