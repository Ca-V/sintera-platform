// FUNC · HIP-014 §5 — adaptador do Health Connect.
//
// O Health Connect é o PRIMEIRO conector porque numa integração só chegam todos os sinais vitais, o peso, os
// passos e as sessões de exercício — e Strava, Oura e Garmin chegam POR DENTRO dele, sem contrato com cada
// fabricante. Estes testes cobrem a parte pura: o que é lido do aparelho vira o quê.
//
// Dois invariantes acima dos outros:
//   1. A ORIGEM é o app que MEDIU, não "Health Connect". O canal não é a fonte — dizer que a corrida veio do
//      "Health Connect" esconderia que ela é do Strava, e a fundadora pediu separação por empresa.
//   2. NÃO INVENTAR NÚMERO. Registro sem valor utilizável é descartado; grandeza ausente permanece ausente.
import { describe, it, expect } from 'vitest'
import {
  healthConnectSamples, healthConnectActivities, sourceFromApp, activityTypeFromExercise,
  HEALTH_CONNECT_CHANNEL, toBodyMetricRow, type HcRecord,
} from '@sintera/core'

const V = '1.0.0'

describe('HIP-014 · a origem é o app que mediu, não o canal', () => {
  it('reconhece os aplicativos pelo pacote Android', () => {
    expect(sourceFromApp('com.strava')).toBe('strava')
    expect(sourceFromApp('com.ouraring.oura')).toBe('oura')
    expect(sourceFromApp('com.garmin.android.apps.connectmobile')).toBe('garmin')
  })

  it('pacote desconhecido é PRESERVADO — a origem continua rastreável mesmo sem mapeamento', () => {
    expect(sourceFromApp('br.com.appdeacademia')).toBe('br.com.appdeacademia')
  })

  it('sem app declarado, a origem é o próprio canal — nunca um palpite', () => {
    expect(sourceFromApp(null)).toBe(HEALTH_CONNECT_CHANNEL)
    expect(sourceFromApp('   ')).toBe(HEALTH_CONNECT_CHANNEL)
  })

  it('a amostra carrega a origem do app, não "health_connect"', () => {
    const [s] = healthConnectSamples([{ kind: 'heart_rate', time: '2026-08-25T07:00:00.000Z', bpm: 58, app: 'com.ouraring' }], V)
    expect(s.provenance.source).toBe('oura')
  })
})

describe('HIP-014 · pressão arterial — o caso que o modelo não representava', () => {
  const rec: HcRecord = { kind: 'blood_pressure', time: '2026-08-25T07:00:00.000Z', systolic: 128, diastolic: 82, app: 'com.withings' }

  it('preserva a leitura INTEIRA, não só a sistólica', () => {
    const [s] = healthConnectSamples([rec], V)
    expect(s.valueText).toBe('128/82')
    expect(s.unit).toBe('mmHg')
  })

  it('mantém a sistólica em `value` para que gráfico e tendência funcionem', () => {
    const [s] = healthConnectSamples([rec], V)
    expect(s.value).toBe(128)
  })

  it('e chega ao banco como "128/82" — antes chegaria como "128"', () => {
    const [s] = healthConnectSamples([rec], V)
    expect(toBodyMetricRow(s, 'u1')?.value_text).toBe('128/82')
  })

  it('leitura incompleta é DESCARTADA — meia pressão não é pressão', () => {
    expect(healthConnectSamples([{ ...rec, diastolic: Number.NaN }], V)).toEqual([])
  })
})

describe('HIP-014 · demais sinais e medidas', () => {
  const em = '2026-08-25T07:00:00.000Z'
  it('mapeia cada tipo para a métrica e a unidade certas', () => {
    const recs: HcRecord[] = [
      { kind: 'blood_glucose', time: em, mgdl: 96 },
      { kind: 'oxygen_saturation', time: em, percent: 97 },
      { kind: 'body_temperature', time: em, celsius: 36.6 },
      { kind: 'weight', time: em, kg: 72.4 },
      { kind: 'height', time: em, cm: 165 },
    ]
    expect(healthConnectSamples(recs, V).map(s => [s.metric, s.value, s.unit])).toEqual([
      ['glicemia', 96, 'mg/dL'],
      ['saturacao', 97, '%'],
      ['temperatura', 36.6, '°C'],
      ['peso', 72.4, 'kg'],
      ['altura', 165, 'cm'],
    ])
  })

  it('passos entram no BRUTO mas não projetam — não estão no catálogo de body_metrics', () => {
    const [s] = healthConnectSamples([{ kind: 'steps', time: em, count: 8432 }], V)
    expect(s.metric).toBe('passos')
    expect(toBodyMetricRow(s, 'u1')).toBeNull()   // degrada, não quebra
  })

  it('valor inutilizável é descartado, nunca vira zero', () => {
    const recs: HcRecord[] = [
      { kind: 'blood_glucose', time: em, mgdl: Number.NaN },
      { kind: 'weight', time: em, kg: -1 },
    ]
    expect(healthConnectSamples(recs, V)).toEqual([])
  })
})

describe('HIP-014 · sessões de exercício', () => {
  const corrida: HcRecord = {
    kind: 'exercise', startTime: '2026-08-25T06:30:00.000Z', endTime: '2026-08-25T07:02:00.000Z',
    exercise: 'running', title: 'Corrida matinal', distanceM: 5200, energyKcal: 310, app: 'com.strava', id: 'st-1',
  }

  it('não entram nas amostras pontuais — sessão não é medida escalar (§3)', () => {
    expect(healthConnectSamples([corrida], V)).toEqual([])
  })

  it('viram rascunho de sessão, com a origem do app', () => {
    const [a] = healthConnectActivities([corrida], V)
    expect(a.source).toBe('strava')
    expect(a.activity_type).toBe('corrida')
    expect(a.started_at).toBe('2026-08-25T06:30:00.000Z')
    expect(a.distance_m).toBe(5200)
    expect(a.external_id).toBe('st-1')   // idempotência do re-sync
  })

  it('modalidade desconhecida degrada para "outro" — nunca falha de ingestão', () => {
    expect(activityTypeFromExercise('kitesurfing')).toBe('outro')
    expect(activityTypeFromExercise(null)).toBe('outro')
    expect(activityTypeFromExercise('strength_training')).toBe('musculacao')
  })

  it('O CASO CENTRAL: grandeza que a fonte não mediu permanece AUSENTE', () => {
    // Musculação não tem distância; o Strava via Health Connect nem sempre traz energia.
    const [a] = healthConnectActivities([{ kind: 'exercise', startTime: '2026-08-25T18:00:00.000Z', exercise: 'strength_training' }], V)
    expect(a.distance_m).toBeNull()
    expect(a.active_energy_kcal).toBeNull()
    expect(a.avg_heart_rate).toBeNull()
    expect(a.steps).toBeNull()
  })

  it('sessão sem início é ignorada — sem quando, não há série', () => {
    expect(healthConnectActivities([{ kind: 'exercise', startTime: '' }], V)).toEqual([])
  })
})

describe('HIP-014 · fontes diferentes coexistem', () => {
  it('duas fontes medindo a mesma coisa geram DUAS amostras — nenhuma é escolhida', () => {
    const em = '2026-08-25T07:00:00.000Z'
    const amostras = healthConnectSamples([
      { kind: 'heart_rate', time: em, bpm: 58, app: 'com.ouraring' },
      { kind: 'heart_rate', time: em, bpm: 63, app: 'com.garmin' },
    ], V)
    expect(amostras).toHaveLength(2)
    expect(amostras.map(s => s.provenance.source).sort()).toEqual(['garmin', 'oura'])
  })
})
