// FUNC · FB-003 — projeção bioimpedância → body_metrics (Composição Corporal). PURA.
import { describe, it, expect } from 'vitest'
import { runBioimpedance } from '@/lib/capture/clinical-processors/bioimpedance'
import { bioimpedanceToBodyMetrics } from '@/lib/capture/clinical-processors/bioimpedance-body-metrics'
import type { CertifiedCDU } from '@/lib/capture/clinical-processors/types'

const cdu = (text: string): CertifiedCDU => ({ content: { text } as never, pages: [1] } as never)

describe('FB-003 · bioimpedanceToBodyMetrics', () => {
  it('mapeia os parâmetros de um laudo para métricas canônicas de body_metrics', () => {
    const r = runBioimpedance(cdu(
      `Peso: 72,4 kg\nIMC: 25,7\nPercentual de gordura: 24,1 %\n` +
      `Massa muscular esquelética: 30,2 kg\nMassa magra: 54,8 kg\n` +
      `Água corporal total: 55,3 %\nGordura visceral: 8\nMetabolismo basal: 1480 kcal\n`,
    ))
    const params = r.output?.kind === 'parametric' ? r.output.parameters : []
    const points = bioimpedanceToBodyMetrics(params)
    const by = Object.fromEntries(points.map(p => [p.metric, p.value_text]))
    expect(by['peso']).toBe('72.4')
    expect(by['imc']).toBe('25.7')
    expect(by['gordura_corporal']).toBe('24.1')
    expect(by['massa_muscular']).toBe('30.2')
    expect(by['massa_magra']).toBe('54.8')          // métrica ampliada na migration 124
    expect(by['agua_corporal']).toBe('55.3')
    expect(by['gordura_visceral']).toBe('8')
    expect(by['taxa_metabolica']).toBe('1480')
    // todas as métricas são valores do CHECK constraint (nenhuma inventada)
    const allowed = new Set(['peso','altura','circunferencia_cintura','imc','gordura_corporal','massa_muscular','massa_magra','agua_corporal','gordura_visceral','massa_ossea','taxa_metabolica','pressao_arterial','frequencia_cardiaca','glicemia','saturacao','temperatura','outro_sinal','outro'])
    for (const p of points) expect(allowed.has(p.metric)).toBe(true)
  })

  it('parâmetros vazios → nenhum ponto (não inventa)', () => {
    expect(bioimpedanceToBodyMetrics([])).toEqual([])
  })
})
