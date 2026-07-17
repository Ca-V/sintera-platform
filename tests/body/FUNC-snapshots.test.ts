// FUNC · BOD-001 área ③ — Comparação entre Avaliações (snapshots). PURO.
import { describe, it, expect } from 'vitest'
import { buildSnapshots, compareSnapshots, type SnapPoint } from '@/lib/body/snapshots'

const ORDER = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_ossea']

describe('BOD-001 · buildSnapshots', () => {
  it('agrupa por exame e por (origem+data); ordena do mais recente ao mais antigo', () => {
    const pts: SnapPoint[] = [
      { metric: 'peso', value: 72.4, unit: 'kg', date: '2026-07-15', source: 'bioimpedancia', examId: 'e1' },
      { metric: 'gordura_corporal', value: 29, unit: '%', date: '2026-07-15', source: 'bioimpedancia', examId: 'e1' },
      { metric: 'peso', value: 76.8, unit: 'kg', date: '2026-04-12', source: 'dexa', examId: 'e2' },
      { metric: 'peso', value: 80, unit: 'kg', date: '2026-01-05', source: 'manual', examId: null },
    ]
    const snaps = buildSnapshots(pts)
    expect(snaps).toHaveLength(3)
    expect(snaps[0].key).toBe('exam:e1')          // mais recente
    expect(snaps[0].metrics['peso'].value).toBe(72.4)
    expect(snaps[2].key).toBe('manual:2026-01-05') // manual agrupado por origem+data
  })
})

describe('BOD-001 · compareSnapshots', () => {
  const pts: SnapPoint[] = [
    { metric: 'peso', value: 72.4, unit: 'kg', date: '2026-07-15', source: 'bioimpedancia', examId: 'e1' },
    { metric: 'gordura_corporal', value: 29, unit: '%', date: '2026-07-15', source: 'bioimpedancia', examId: 'e1' },
    { metric: 'peso', value: 76.8, unit: 'kg', date: '2026-04-12', source: 'dexa', examId: 'e2' },
    { metric: 'massa_ossea', value: 3.1, unit: 'kg', date: '2026-04-12', source: 'dexa', examId: 'e2' },
  ]
  const [a, b] = buildSnapshots(pts)   // a = e1 (15/07), b = e2 (12/04)

  it('delta = A − B quando ambos têm o indicador', () => {
    const rows = compareSnapshots(a, b, ORDER)
    const peso = rows.find(r => r.metric === 'peso')!
    expect(peso.available).toBe(true)
    expect(peso.delta).toBe(-4.4)      // 72,4 − 76,8
  })

  it('indicador só em um lado → available=false, delta null (Não disponível)', () => {
    const rows = compareSnapshots(a, b, ORDER)
    const gord = rows.find(r => r.metric === 'gordura_corporal')!  // só em A
    expect(gord.available).toBe(false)
    expect(gord.delta).toBeNull()
    const osso = rows.find(r => r.metric === 'massa_ossea')!        // só em B
    expect(osso.available).toBe(false)
    expect(osso.a).toBeNull()
    expect(osso.b).toBe(3.1)
  })

  it('omite métrica ausente em AMBOS (massa_muscular)', () => {
    const rows = compareSnapshots(a, b, ORDER)
    expect(rows.find(r => r.metric === 'massa_muscular')).toBeUndefined()
  })

  it('não normaliza entre tecnologias — apenas confronta os valores medidos', () => {
    const rows = compareSnapshots(a, b, ORDER)
    const peso = rows.find(r => r.metric === 'peso')!
    expect(peso.a).toBe(72.4)  // bioimpedância
    expect(peso.b).toBe(76.8)  // DEXA — valor cru, sem ajuste
  })
})
