import { describe, it, expect } from 'vitest'
import { summarizeBiomarkers, seriesForName, normalizeName, type BiomarkerRow } from './grouping'

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

  it('marca unidades diferentes e não compara', () => {
    const rows = [
      row({ name: 'Colesterol', value: 5, unit: 'mmol/L', date: '2025-01-01' }),
      row({ name: 'Colesterol', value: 200, unit: 'mg/dL', date: '2025-06-01' }),
    ]
    const g = summarizeBiomarkers(rows)[0]
    expect(g.hasUnitMismatch).toBe(true)
    expect(g.measurements).toHaveLength(0)
    expect(g.trend).toBe('unit_mismatch')
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
