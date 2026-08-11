import { describe, it, expect } from 'vitest'
import { summarizeBiomarkers, seriesForName, primaryUnitSeries, normalizeName, type BiomarkerRow } from './grouping'

function row(p: Partial<BiomarkerRow> & { name: string; value: number | null; date: string }): BiomarkerRow {
  return {
    id: p.id ?? `${p.name}-${p.date}-${p.value}`,
    name: p.name,
    value: p.value,
    unit: p.unit ?? 'mg/dL',
    result_type: p.result_type ?? 'numeric',
    reference_min: p.reference_min ?? 70,
    reference_max: p.reference_max ?? 99,
    interpretation: p.interpretation ?? null,
    reference_source: p.reference_source ?? null,
    exam_id: p.exam_id ?? `exam-${p.date}`,
    exams: { exam_date: p.date, created_at: p.date },
  }
}

describe('summarizeBiomarkers', () => {
  it('agrupa por nome canônico (case/espacos) e ordena a série por data', () => {
    const rows = [
      row({ name: 'Glicose', value: 90, date: '2025-03-01' }),
      row({ name: ' glicose ', value: 110, date: '2025-09-01' }),
      row({ name: 'GLICOSE', value: 100, date: '2025-06-01' }),
    ]
    const out = summarizeBiomarkers(rows)
    expect(out).toHaveLength(1)
    const g = out[0]
    expect(g.canonicalName).toBe('glicose')
    expect(g.count).toBe(3)
    expect(g.measurements.map(m => m.value)).toEqual([90, 100, 110])
    expect(g.first?.value).toBe(90)
    expect(g.latest?.value).toBe(110)
  })

  it('calcula tendência (últimas 2) e variação total (primeira→última)', () => {
    const rows = [
      row({ name: 'LDL', value: 100, date: '2025-01-01' }),
      row({ name: 'LDL', value: 130, date: '2025-06-01' }),
    ]
    const g = summarizeBiomarkers(rows)[0]
    expect(g.trend).toBe('up')
    expect(g.deltaPercent).toBe(30)
    expect(g.totalDeltaPercent).toBe(30)
  })

  // Blindagem arquitetural: invariantes que impedem regressão da regra de unidades incompatíveis.
  it('INVARIANTE: nunca descarta — measurements = soma das medições dos unitGroups', () => {
    const rows = [
      row({ name: 'Ferritina', value: 30, unit: 'ng/mL', date: '2025-01-01' }),
      row({ name: 'Ferritina', value: 40, unit: 'ng/mL', date: '2025-06-01' }),
      row({ name: 'Ferritina', value: 90, unit: 'µg/L', date: '2025-09-01' }),
    ]
    const s = summarizeBiomarkers(rows)[0]
    const soma = (s.unitGroups ?? []).reduce((n, g) => n + g.measurements.length, 0)
    expect(s.measurements.length).toBe(3)
    expect(soma).toBe(3) // nada descartado
  })
  it('INVARIANTE: primaryUnitSeries nunca mistura unidades (série da unidade principal)', () => {
    const rows = [
      row({ name: 'Ferritina', value: 30, unit: 'ng/mL', date: '2025-01-01' }),
      row({ name: 'Ferritina', value: 40, unit: 'ng/mL', date: '2025-06-01' }),
      row({ name: 'Ferritina', value: 90, unit: 'µg/L', date: '2025-09-01' }),
    ]
    const g = primaryUnitSeries(summarizeBiomarkers(rows)[0])
    expect(new Set(g.measurements.map(m => m.unit)).size).toBe(1) // uma só unidade
    expect(g.unit).toBe('ng/mL') // a de mais medições
    expect(g.measurements).toHaveLength(2)
  })

  it('unidades diferentes: NÃO descarta dados, agrupa por unidade e não compara entre unidades', () => {
    const rows = [
      row({ name: 'Colesterol', value: 5, unit: 'mmol/L', date: '2025-01-01' }),
      row({ name: 'Colesterol', value: 190, unit: 'mg/dL', date: '2025-06-01' }),
      row({ name: 'Colesterol', value: 200, unit: 'mg/dL', date: '2025-09-01' }),
    ]
    const g = summarizeBiomarkers(rows)[0]
    expect(g.hasUnitMismatch).toBe(true)
    // Regra oficial: nunca esconder dados existentes — todas as medições são preservadas.
    expect(g.measurements).toHaveLength(3)
    // Tendência agregada não existe entre unidades diferentes.
    expect(g.trend).toBe('unit_mismatch')
    expect(g.deltaPercent).toBeNull()
    // Agrupadas por unidade; tendência SÓ dentro de cada grupo (mg/dL tem 2 → 'up'; mmol/L tem 1 → 'single').
    expect(g.unitGroups).toHaveLength(2)
    const mgdl = g.unitGroups!.find(u => u.unit === 'mg/dL')!
    expect(mgdl.measurements).toHaveLength(2)
    expect(mgdl.trend).toBe('up')
    const mmol = g.unitGroups!.find(u => u.unit === 'mmol/L')!
    expect(mmol.count).toBe(1)
    expect(mmol.trend).toBe('single')
  })

  it('ignora não-numéricos e valores nulos', () => {
    const rows = [
      row({ name: 'TSH', value: null, date: '2025-01-01', result_type: 'qualitative' }),
      row({ name: 'TSH', value: 2.5, unit: 'mUI/L', date: '2025-06-01' }),
    ]
    const g = summarizeBiomarkers(rows)[0]
    expect(g.count).toBe(1)
    expect(g.trend).toBe('single')
  })
})

describe('seriesForName', () => {
  it('retorna a série do biomarcador pelo nome normalizado', () => {
    const rows = [
      row({ name: 'Vitamina D', value: 30, date: '2025-01-01' }),
      row({ name: 'Vitamina D', value: 45, date: '2025-06-01' }),
      row({ name: 'Ferritina', value: 80, date: '2025-06-01' }),
    ]
    const s = seriesForName(rows, normalizeName('Vitamina D'))
    expect(s?.displayName).toBe('Vitamina D')
    expect(s?.measurements).toHaveLength(2)
    expect(seriesForName(rows, 'inexistente')).toBeNull()
  })
})
