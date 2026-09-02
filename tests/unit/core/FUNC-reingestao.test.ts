// CATRACA — uma correção de leitura nossa não pode obrigar a pessoa a apagar tudo e reimportar.
//
// Doze atividades entraram com o tipo errado e sem distância, por defeito nosso. Corrigimos a leitura e
// descobrimos que não bastava: a ingestão pula o que já existe, e as doze ficariam erradas para sempre.
//
// Mas a regra oposta — sobrescrever sempre — destruiria as correções que a pessoa fez à mão. Estes testes
// fixam a fronteira entre PRESERVAR o que já se sabe e CONGELAR o que ainda não se sabia.
import { describe, it, expect } from 'vitest'
import { camposACorrigir } from '@sintera/core'

describe('o que uma nova sincronização pode corrigir', () => {
  it('corrige o tipo quando o que estava lá era o nosso palpite "outro"', () => {
    const m = camposACorrigir({ activity_type: 'outro' }, { activity_type: 'corrida' })
    expect(m?.activity_type).toBe('corrida')
  })

  it('NUNCA troca um tipo que já é específico — pode ter sido ela quem corrigiu', () => {
    expect(camposACorrigir({ activity_type: 'caminhada' }, { activity_type: 'corrida' })).toBeNull()
  })

  it('não rebaixa um tipo específico para "outro"', () => {
    expect(camposACorrigir({ activity_type: 'corrida' }, { activity_type: 'outro' })).toBeNull()
  })

  it('preenche o que está vazio', () => {
    const m = camposACorrigir(
      { activity_type: 'corrida', distance_m: null, active_energy_kcal: null },
      { activity_type: 'corrida', distance_m: 8200, active_energy_kcal: 540 },
    )
    expect(m?.distance_m).toBe(8200)
    expect(m?.active_energy_kcal).toBe(540)
  })

  it('NUNCA sobrescreve um valor que já existe, mesmo divergente', () => {
    // 8 km podem ter sido corrigidos por ela. Perder a correção dela é pior que conviver com a imprecisão.
    const m = camposACorrigir({ distance_m: 8000 }, { distance_m: 8200 })
    expect(m).toBeNull()
  })

  it('devolve null quando não há nada a fazer — não se escreve no banco à toa', () => {
    expect(camposACorrigir(
      { activity_type: 'corrida', distance_m: 8200, title: 'Corrida matinal' },
      { activity_type: 'corrida', distance_m: 8200, title: 'Corrida matinal' },
    )).toBeNull()
  })

  it('a versão do conector acompanha a correção, para a auditoria saber quem produziu o quê', () => {
    const m = camposACorrigir(
      { activity_type: 'outro', connector_version: '1.0.0' },
      { activity_type: 'corrida', connector_version: '1.1.0' },
    )
    expect(m?.connector_version).toBe('1.1.0')
  })

  it('a versão sozinha não justifica uma escrita', () => {
    expect(camposACorrigir(
      { activity_type: 'corrida', connector_version: '1.0.0' },
      { activity_type: 'corrida', connector_version: '1.1.0' },
    )).toBeNull()
  })

  it('título vazio é preenchido; título existente é preservado', () => {
    expect(camposACorrigir({ title: null }, { title: 'Corrida matinal' })?.title).toBe('Corrida matinal')
    expect(camposACorrigir({ title: 'Meu nome' }, { title: 'Corrida matinal' })).toBeNull()
  })

  it('o caso real das doze atividades: tipo errado e grandezas ausentes, tudo corrigido de uma vez', () => {
    const m = camposACorrigir(
      { activity_type: 'outro', title: null, distance_m: null, active_energy_kcal: null, duration_s: 3600 },
      { activity_type: 'corrida', title: null, distance_m: 8200, active_energy_kcal: 540, duration_s: 3600 },
    )
    expect(m).toEqual({ activity_type: 'corrida', distance_m: 8200, active_energy_kcal: 540 })
  })
})
