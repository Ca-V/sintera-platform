// FUNC · FB-003 (extensão) — composição corporal de laudo DEXA → body_metrics. PURO.
import { describe, it, expect } from 'vitest'
import { dexaBodyComposition } from '@/lib/capture/clinical-processors/dexa-body-metrics'

describe('FB-003 · dexaBodyComposition', () => {
  it('extrai composição de um laudo DEXA de corpo inteiro', () => {
    const pts = dexaBodyComposition(
      `DENSITOMETRIA DE CORPO INTEIRO (DXA)\n` +
      `Peso: 72,4 kg\n` +
      `Percentual de gordura corporal: 24,1 %\n` +
      `Massa magra total: 54,8 kg\n` +
      `Conteúdo mineral ósseo: 3,1 kg\n`,
    )
    const by = Object.fromEntries(pts.map(p => [p.metric, p.value_text]))
    expect(by['peso']).toBe('72.4')
    expect(by['gordura_corporal']).toBe('24.1')
    expect(by['massa_magra']).toBe('54.8')
    expect(by['massa_ossea']).toBe('3.1')
  })

  it('não é DEXA → retorna [] (não harvest de outros laudos)', () => {
    expect(dexaBodyComposition('Hemograma completo. Massa magra não aplicável.')).toEqual([])
  })

  it('DEXA só de densidade óssea (sem composição) → [] (não inventa)', () => {
    expect(dexaBodyComposition('DENSITOMETRIA ÓSSEA DXA T-score -1,8 Z-score coluna lombar fêmur')).toEqual([])
  })

  it('todas as métricas pertencem à constraint de body_metrics', () => {
    const allowed = new Set(['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'massa_ossea', 'agua_corporal', 'gordura_visceral', 'taxa_metabolica'])
    const pts = dexaBodyComposition('DEXA Peso: 80 kg Massa magra: 60 kg % gordura: 20 %')
    for (const p of pts) expect(allowed.has(p.metric)).toBe(true)
  })
})
