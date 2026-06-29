import { describe, it, expect } from 'vitest'
import { summarizeBiomarkers, seriesForName, computeReferenceIndex, normalizeName, type BiomarkerRow } from './grouping'

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

describe('computeReferenceIndex', () => {
  it('calcula proporção dentro da referência por exame e exige ≥5 elegíveis', () => {
    const rows: BiomarkerRow[] = []
    // Exame A: 6 elegíveis, 3 dentro → 50%
    for (let i = 0; i < 6; i++) rows.push(row({
      name: `bm${i}`, value: 10, date: '2025-01-01', exam_id: 'A',
      reference_source: 'laudo', interpretation: i < 3 ? 'dentro_da_referencia' : 'acima_da_referencia',
    }))
    // Exame B: só 4 elegíveis → descartado (den < 5)
    for (let i = 0; i < 4; i++) rows.push(row({
      name: `bm${i}`, value: 10, date: '2025-06-01', exam_id: 'B',
      reference_source: 'laudo', interpretation: 'dentro_da_referencia',
    }))
    // Não-laudo / sem interpretação não contam
    rows.push(row({ name: 'x', value: 1, date: '2025-01-01', exam_id: 'A', reference_source: 'ausente', interpretation: 'dentro_da_referencia' }))

    const idx = computeReferenceIndex(rows)
    expect(idx).toHaveLength(1)
    expect(idx[0].examId).toBe('A')
    expect(idx[0].den).toBe(6)
    expect(idx[0].num).toBe(3)
    expect(idx[0].pct).toBe(50)
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
