// FUNC · BOD-001 área ① — Resumo atual + Qualidade do Dado. PURO.
import { describe, it, expect } from 'vitest'
import { currentSummary, sourceQuality, SOURCE_QUALITY, lastAssessment, reliabilityRank, dedupeByDate, type SummaryPoint } from '@/lib/body/summary'

describe('BOD-001 · currentSummary', () => {
  const pts: SummaryPoint[] = [
    { metric: 'peso', value: 82, unit: 'kg', date: '2026-01-01', source: 'bioimpedancia' },
    { metric: 'peso', value: 79, unit: 'kg', date: '2026-02-01', source: 'bioimpedancia' },
    { metric: 'peso', value: 77, unit: 'kg', date: '2026-03-01', source: 'manual' },
    { metric: 'gordura_corporal', value: 30, unit: '%', date: '2026-01-01', source: 'bioimpedancia' },
  ]

  it('pega o último ponto e a tendência vs. a medição anterior', () => {
    const s = currentSummary(pts)
    expect(s['peso'].value).toBe(77)
    expect(s['peso'].source).toBe('manual')        // origem do ÚLTIMO ponto
    expect(s['peso'].prevValue).toBe(79)
    expect(s['peso'].delta).toBe(-2)
    expect(s['peso'].trend).toBe('down')
    expect(s['peso'].date).toBe('2026-03-01')
  })

  it('indicador com um único ponto → sem tendência (não inventa)', () => {
    const s = currentSummary(pts)
    expect(s['gordura_corporal'].value).toBe(30)
    expect(s['gordura_corporal'].prevValue).toBeNull()
    expect(s['gordura_corporal'].delta).toBeNull()
    expect(s['gordura_corporal'].trend).toBeNull()
  })

  it('ordena por data (entrada desordenada não quebra)', () => {
    const s = currentSummary([
      { metric: 'peso', value: 77, unit: 'kg', date: '2026-03-01', source: 'manual' },
      { metric: 'peso', value: 82, unit: 'kg', date: '2026-01-01', source: 'bioimpedancia' },
    ])
    expect(s['peso'].value).toBe(77)
    expect(s['peso'].trend).toBe('down')
  })

  it('valor igual → tendência flat', () => {
    const s = currentSummary([
      { metric: 'agua_corporal', value: 55, unit: '%', date: '2026-01-01', source: 'bioimpedancia' },
      { metric: 'agua_corporal', value: 55, unit: '%', date: '2026-02-01', source: 'bioimpedancia' },
    ])
    expect(s['agua_corporal'].trend).toBe('flat')
    expect(s['agua_corporal'].delta).toBe(0)
  })
})

describe('BOD-001 · Qualidade do Dado', () => {
  it('confiabilidade derivada da origem; DEXA alta, bioimpedância média, manual informado', () => {
    expect(sourceQuality('dexa')!.reliability).toBe('alta')
    expect(sourceQuality('bioimpedancia')!.reliability).toBe('media')
    expect(sourceQuality('manual')!.reliability).toBe('informado')
  })

  it('origem desconhecida ou nula → null (não afirma)', () => {
    expect(sourceQuality('desconhecida')).toBeNull()
    expect(sourceQuality(null)).toBeNull()
    expect(sourceQuality(undefined)).toBeNull()
  })

  it('todas as origens do mapa têm rótulo e confiabilidade válida', () => {
    for (const q of Object.values(SOURCE_QUALITY)) {
      expect(q.label.length).toBeGreaterThan(0)
      expect(['alta', 'media', 'informado']).toContain(q.reliability)
    }
  })
})

describe('BOD-001 · lastAssessment (última avaliação corporal)', () => {
  it('retorna a avaliação (bioimpedância/DEXA) mais recente com rótulo', () => {
    const r = lastAssessment([
      { metric: 'peso', value: 80, unit: 'kg', date: '2026-07-20', source: 'manual' },       // não é avaliação
      { metric: 'gordura_corporal', value: 30, unit: '%', date: '2026-06-02', source: 'dexa' },
      { metric: 'gordura_corporal', value: 28, unit: '%', date: '2026-07-15', source: 'bioimpedancia' },
    ])
    expect(r).not.toBeNull()
    expect(r!.source).toBe('bioimpedancia')     // 15/07 > 02/06
    expect(r!.label).toBe('Bioimpedância')
    expect(r!.date).toBe('2026-07-15')
  })

  it('sem avaliação (só manual) → null', () => {
    const r = lastAssessment([{ metric: 'peso', value: 80, unit: 'kg', date: '2026-07-20', source: 'manual' }])
    expect(r).toBeNull()
  })
})

describe('BOD-001 · dedup de métricas duplicadas (mesma métrica/dia, fontes diferentes)', () => {
  it('reliabilityRank ordena dexa > bioimpedância > manual > desconhecida', () => {
    expect(reliabilityRank('dexa')).toBeGreaterThan(reliabilityRank('bioimpedancia'))
    expect(reliabilityRank('bioimpedancia')).toBeGreaterThan(reliabilityRank('manual'))
    expect(reliabilityRank('manual')).toBeGreaterThan(reliabilityRank(null))
    expect(reliabilityRank('fonte_desconhecida')).toBe(0)
  })

  it('dedupeByDate mantém 1 ponto por dia, preferindo a fonte mais confiável', () => {
    const out = dedupeByDate([
      { date: '2026-01-01', value: 72.0, source: 'manual' },
      { date: '2026-01-01', value: 72.4, source: 'bioimpedancia' },
      { date: '2026-02-01', value: 71.0, source: 'manual' },
    ])
    expect(out).toHaveLength(2)
    const d1 = out.find(p => p.date === '2026-01-01')!
    expect(d1.value).toBe(72.4)               // bioimpedância venceu o manual do mesmo dia
    expect(d1.source).toBe('bioimpedancia')
  })

  it('currentSummary NÃO cria tendência espúria entre duas fontes do mesmo dia', () => {
    const s = currentSummary([
      { metric: 'peso', value: 80, unit: 'kg', date: '2026-01-01', source: 'manual' },
      { metric: 'peso', value: 79.6, unit: 'kg', date: '2026-03-01', source: 'manual' },        // mesmo dia, 2 fontes
      { metric: 'peso', value: 79.9, unit: 'kg', date: '2026-03-01', source: 'bioimpedancia' }, // ↑ vence (mais confiável)
    ])
    expect(s['peso'].value).toBe(79.9)         // ponto do dia = fonte mais confiável
    expect(s['peso'].source).toBe('bioimpedancia')
    expect(s['peso'].prevDate).toBe('2026-01-01')  // anterior é OUTRO dia, não a 2ª fonte do mesmo dia
    expect(s['peso'].delta).toBe(-0.1)             // 79.9 − 80, não 79.9 − 79.6
    expect(s['peso'].trend).toBe('down')
  })
})
