// CATRACA — a mesma medição, escrita por duas fontes.
//
// O caminho mais comum de repetição em wearables: um relógio e um aplicativo escrevendo o mesmo peso no Health
// Connect. `suspectedDuplicateObservations` existia desde 28/08 e não tinha UM consumidor — porque faltava a
// ponte entre a medição guardada e o formato que ele compara, e cada tela teria de montá-la sozinha.
//
// Montá-la de dois jeitos faria a mesma medição ser duplicata numa ponta e não na outra. `observationForMatch`
// é essa ponte, e estes testes travam o que ela decide.
import { describe, it, expect } from 'vitest'
import { observationForMatch, suspectedDuplicateObservations } from '@sintera/core'

const relogio = {
  id: 'm1', source: 'garmin', metric: 'peso',
  measured_at: '2026-08-30T07:00:00.000Z', measured_on: '2026-08-30', value_text: '72.4',
}

describe('a mesma medição por duas fontes', () => {
  it('É RECONHECIDA quando bate horário, valor e grandeza', () => {
    const app = { ...relogio, id: 'm2', source: 'samsung_health' }
    const [s] = suspectedDuplicateObservations([observationForMatch(app)], [observationForMatch(relogio)])
    expect(s?.existing.id).toBe('m1')
    expect(s?.reason).toContain('garmin')
  })

  it('MESMA FONTE não é repetição — é a fonte medindo de novo, e isso é um fato', () => {
    const outra = { ...relogio, id: 'm2', measured_at: '2026-08-30T07:00:30.000Z' }
    expect(suspectedDuplicateObservations([observationForMatch(outra)], [observationForMatch(relogio)])).toEqual([])
  })

  it('grandezas diferentes nunca se confundem', () => {
    const fc = { ...relogio, id: 'm2', source: 'samsung_health', metric: 'frequencia_cardiaca' }
    expect(suspectedDuplicateObservations([observationForMatch(fc)], [observationForMatch(relogio)])).toEqual([])
  })

  it('DUAS MEDIÇÕES DE VERDADE não viram uma só — dez minutos de intervalo é o que o médico pede', () => {
    const depois = { ...relogio, id: 'm2', source: 'samsung_health', measured_at: '2026-08-30T07:10:00.000Z' }
    expect(suspectedDuplicateObservations([observationForMatch(depois)], [observationForMatch(relogio)])).toEqual([])
  })

  it('valor divergente não é a mesma medição', () => {
    const outro = { ...relogio, id: 'm2', source: 'samsung_health', value_text: '78.0' }
    expect(suspectedDuplicateObservations([observationForMatch(outro)], [observationForMatch(relogio)])).toEqual([])
  })

  it('arredondamento entre fontes não separa a mesma medição', () => {
    // A mesma balança lida por dois apps arredonda diferente. 72.4 e 72.5 são a mesma pesagem.
    const quase = { ...relogio, id: 'm2', source: 'samsung_health', value_text: '72.5' }
    const [s] = suspectedDuplicateObservations([observationForMatch(quase)], [observationForMatch(relogio)])
    expect(s).toBeDefined()
  })
})

describe('a ponte entre a medição guardada e o detector', () => {
  it('aceita vírgula decimal — é assim que se digita em português', () => {
    expect(observationForMatch({ ...relogio, value_text: '36,5' }).value).toBe(36.5)
  })

  it('pressão compara pela SISTÓLICA, o primeiro número', () => {
    expect(observationForMatch({ ...relogio, metric: 'pressao_arterial', value_text: '120/80' }).value).toBe(120)
  })

  it('VALOR ILEGÍVEL NÃO ACUSA. Sem número, não há como afirmar que é a mesma medição', () => {
    const semNumero = { ...relogio, id: 'm2', source: 'samsung_health', value_text: 'normal' }
    expect(observationForMatch(semNumero).value).toBeNull()
    expect(suspectedDuplicateObservations([observationForMatch(semNumero)], [observationForMatch(relogio)])).toEqual([])
  })

  it('sem hora, usa o dia — e aí é o valor que separa uma medição da outra', () => {
    const semHora = { ...relogio, measured_at: null }
    expect(observationForMatch(semHora).recordedAt).toBe('2026-08-30T00:00:00.000Z')
  })

  it('origem ausente vira "desconhecida", nunca string vazia', () => {
    expect(observationForMatch({ ...relogio, source: null }).source).toBe('desconhecida')
  })
})
