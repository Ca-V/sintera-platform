// @sintera/core · Sinais vitais (Monitoramento) — taxonomia própria na mesma tabela body_metrics; isVital separa
// as duas visões (Composição Corporal × Monitoramento). Rótulo/unidade cobrem ambas via bodyMetricLabel/Unit.
import { describe, it, expect } from 'vitest'
import { VITAL_SIGNS, isVital, bodyMetricLabel, bodyMetricUnit } from '../../packages/core/src/domain/body/metrics'

describe('core · body · sinais vitais', () => {
  it('isVital reconhece sinais vitais e NÃO medidas de composição', () => {
    for (const v of ['pressao_arterial', 'frequencia_cardiaca', 'glicemia', 'saturacao', 'temperatura', 'outro_sinal']) expect(isVital(v)).toBe(true)
    for (const m of ['peso', 'gordura_corporal', 'massa_magra', 'imc', 'outro']) expect(isVital(m)).toBe(false)
    expect(isVital(null)).toBe(false)
  })

  it('VITAL_SIGNS traz rótulo/unidade e bodyMetricLabel/Unit cobrem vitais e composição', () => {
    expect(VITAL_SIGNS.map(v => v.value)).toContain('pressao_arterial')
    expect(bodyMetricLabel('pressao_arterial')).toBe('Pressão arterial')
    expect(bodyMetricUnit('frequencia_cardiaca')).toBe('bpm')
    expect(bodyMetricLabel('peso')).toBe('Peso') // composição segue funcionando
  })
})
