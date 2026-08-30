// CATRACA — a leitura do Apple Saúde, escrita SEM um iPhone para conferir.
//
// É a mesma situação do Health Connect há dois dias, e ela custou caro: eu supus que o tipo de exercício vinha
// como texto, vinha como número, e doze atividades reais entraram como "Outra atividade" — em silêncio,
// porque o caminho do desconhecido é mudo por princípio.
//
// A LIÇÃO APLICADA AQUI, e é o que estes testes protegem:
//   1. Mapear por NOME, nunca por número. A Apple não documenta os valores do enum de exercício e desaconselha
//      fixá-los — eles podem mudar entre versões do iOS.
//   2. Aceitar o nome venha como vier da ponte nativa (camelCase, MAIÚSCULAS, com espaços).
//   3. O que não for entendido é REGISTRADO e reportado, não engolido. A primeira sincronização no iPhone
//      revela os nomes reais, e o mapa cresce com evidência em vez de palpite.
import { describe, it, expect } from 'vitest'
import { normalizeAppleHealth, activityTypeFromApple, healthConnectSamples, healthConnectActivities } from '@sintera/core'

const V = '1.0.0'
const origem = { sourceRevision: { source: { bundleIdentifier: 'com.strava' } } }

describe('tipo de exercício da Apple', () => {
  it('mapeia pelo NOME, que é o que a Apple mantém estável', () => {
    expect(activityTypeFromApple('running')).toBe('corrida')
    expect(activityTypeFromApple('walking')).toBe('caminhada')
    expect(activityTypeFromApple('cycling')).toBe('ciclismo')
    expect(activityTypeFromApple('traditionalStrengthTraining')).toBe('musculacao')
  })

  it('aceita o nome em qualquer formatação — a ponte nativa varia, e apostar numa só foi o erro do Android', () => {
    for (const v of ['traditionalStrengthTraining', 'TRADITIONAL_STRENGTH_TRAINING', 'Traditional Strength Training']) {
      expect(activityTypeFromApple(v), v).toBe('musculacao')
    }
  })

  it('DEVOLVE NULL para o desconhecido, e não "outro" — quem chama precisa saber a diferença', () => {
    // "É outro tipo" e "não entendi" são coisas diferentes, e é dessa diferença que sai o relatório.
    expect(activityTypeFromApple('kitesurfing')).toBeNull()
    expect(activityTypeFromApple(null)).toBeNull()
  })
})

describe('o que não foi entendido é DITO', () => {
  it('o nome desconhecido volta no relatório, e a atividade entra mesmo assim', () => {
    const r = normalizeAppleHealth({
      HKWorkoutTypeIdentifier: [{ ...origem, startDate: '2026-08-30T10:00:00.000Z', endDate: '2026-08-30T11:00:00.000Z', workoutActivityType: 'jaiAlai' }],
    })
    expect(r.exerciciosDesconhecidos).toEqual(['jaiAlai'])
    // Degrada corretamente: o fato não se perde por não ter sido classificado.
    expect(healthConnectActivities(r.registros, V)[0].activity_type).toBe('outro')
  })

  it('o que foi entendido NÃO entra no relatório de desconhecidos', () => {
    const r = normalizeAppleHealth({
      HKWorkoutTypeIdentifier: [{ ...origem, startDate: '2026-08-30T10:00:00.000Z', workoutActivityType: 'running' }],
    })
    expect(r.exerciciosDesconhecidos).toEqual([])
  })
})

describe('as medições', () => {
  const pontual = (tipo: string, quantity: number, extra: Record<string, unknown> = {}) =>
    normalizeAppleHealth({ [tipo]: [{ ...origem, startDate: '2026-08-30T08:00:00.000Z', quantity, ...extra }] })

  it('peso, frequência e glicemia atravessam com o valor intacto', () => {
    const w = healthConnectSamples(pontual('HKQuantityTypeIdentifierBodyMass', 72.4).registros, V)
    expect(w[0]).toMatchObject({ metric: 'peso', value: 72.4 })
    const fc = healthConnectSamples(pontual('HKQuantityTypeIdentifierHeartRate', 61).registros, V)
    expect(fc[0]).toMatchObject({ metric: 'frequencia_cardiaca', value: 61 })
  })

  it('ALTURA vem em metros e é convertida — a conversão é aqui, nunca na tela', () => {
    const h = healthConnectSamples(pontual('HKQuantityTypeIdentifierHeight', 1.7).registros, V)
    expect(h[0]).toMatchObject({ metric: 'altura', value: 170 })
  })

  it('SATURAÇÃO aceita fração E porcentagem — converter o que já veio convertido daria 9800%', () => {
    const fracao = healthConnectSamples(pontual('HKQuantityTypeIdentifierOxygenSaturation', 0.98).registros, V)
    const pct = healthConnectSamples(pontual('HKQuantityTypeIdentifierOxygenSaturation', 98).registros, V)
    expect(fracao[0].value).toBeCloseTo(98)
    expect(pct[0].value).toBeCloseTo(98)
  })

  it('a PROCEDÊNCIA sobrevive ao cofre: uma leitura do Strava continua sendo do Strava', () => {
    const s = healthConnectSamples(pontual('HKQuantityTypeIdentifierHeartRate', 61).registros, V)
    expect(s[0].provenance.source).toBe('strava')
  })

  it('valor ausente é DESCARTADO, nunca vira zero — zero é uma afirmação sobre a saúde de alguém', () => {
    const r = normalizeAppleHealth({
      HKQuantityTypeIdentifierBodyMass: [{ ...origem, startDate: '2026-08-30T08:00:00.000Z' }],
    })
    expect(r.registros).toHaveLength(0)
  })
})

describe('pressão arterial — dois tipos que precisam voltar a ser um fato', () => {
  const t = '2026-08-30T08:00:00.000Z'

  it('sistólica e diastólica do mesmo instante viram UMA pressão', () => {
    const r = normalizeAppleHealth({
      HKQuantityTypeIdentifierBloodPressureSystolic: [{ ...origem, startDate: t, quantity: 120 }],
      HKQuantityTypeIdentifierBloodPressureDiastolic: [{ ...origem, startDate: t, quantity: 80 }],
    })
    const [s] = healthConnectSamples(r.registros, V)
    expect(s).toMatchObject({ metric: 'pressao_arterial', value: 120, valueText: '120/80' })
  })

  it('METADE SEM PAR É DESCARTADA. Uma sistólica sozinha não é uma pressão', () => {
    const r = normalizeAppleHealth({
      HKQuantityTypeIdentifierBloodPressureSystolic: [{ ...origem, startDate: t, quantity: 120 }],
    })
    expect(r.registros).toHaveLength(0)
  })

  it('duas aferições distintas não se misturam — cada sistólica com a SUA diastólica', () => {
    const depois = '2026-08-30T08:10:00.000Z'
    const r = normalizeAppleHealth({
      HKQuantityTypeIdentifierBloodPressureSystolic: [
        { ...origem, startDate: t, quantity: 120 },
        { ...origem, startDate: depois, quantity: 134 },
      ],
      HKQuantityTypeIdentifierBloodPressureDiastolic: [
        { ...origem, startDate: depois, quantity: 88 },
        { ...origem, startDate: t, quantity: 80 },
      ],
    })
    const textos = healthConnectSamples(r.registros, V).map(s => s.valueText)
    expect(textos.sort()).toEqual(['120/80', '134/88'])
  })
})

describe('distância e energia', () => {
  it('são atribuídas à sessão pelo horário, como no Android — a mesma regra serve aos dois cofres', () => {
    const r = normalizeAppleHealth({
      HKWorkoutTypeIdentifier: [{ ...origem, startDate: '2026-08-30T10:00:00.000Z', endDate: '2026-08-30T11:00:00.000Z', workoutActivityType: 'running' }],
      HKQuantityTypeIdentifierDistanceWalkingRunning: [
        { ...origem, startDate: '2026-08-30T10:05:00.000Z', endDate: '2026-08-30T10:55:00.000Z', quantity: 8200 },
      ],
    })
    const [a] = healthConnectActivities(r.registros, V)
    expect(a.activity_type).toBe('corrida')
    expect(a.distance_m).toBe(8200)
  })

  it('a distância da própria sessão tem precedência sobre a inferida', () => {
    const r = normalizeAppleHealth({
      HKWorkoutTypeIdentifier: [{
        ...origem, startDate: '2026-08-30T10:00:00.000Z', endDate: '2026-08-30T11:00:00.000Z',
        workoutActivityType: 'running', totalDistance: 9000,
      }],
      HKQuantityTypeIdentifierDistanceWalkingRunning: [
        { ...origem, startDate: '2026-08-30T10:30:00.000Z', quantity: 100 },
      ],
    })
    expect(healthConnectActivities(r.registros, V)[0].distance_m).toBe(9000)
  })
})
