// CATRACA — a primeira ingestão real, e o que ela revelou.
//
// Em 30/08 doze atividades do Strava entraram pelo Health Connect até a nuvem. O caminho inteiro funcionou. E
// as doze chegaram como "Outra atividade", sem distância e sem calorias.
//
// DUAS SUPOSIÇÕES ERRADAS, as duas escondidas atrás de degradação silenciosa:
//
//   1. Que `exerciseType` viesse como NOME. Vem como NÚMERO. O texto era descartado, o tipo virava null, e
//      null degradava para 'outro' — a degradação funcionando como projetada, sobre um dado que estava lá.
//   2. Que a sessão de exercício carregasse distância e energia. Não carrega: são registros separados. Nós
//      líamos um campo que nunca existiu.
//
// A lição não é "errei o mapeamento": é que um caminho de degradação silencioso esconde erro de leitura tão
// bem quanto esconde dado desconhecido. Estes testes fixam o comportamento nos dois pontos.
import { describe, it, expect } from 'vitest'
import { activityTypeFromExercise, healthConnectActivities, normalizeHealthConnect } from '@sintera/core'

const V = '1.0.0'

describe('tipo de exercício do Health Connect', () => {
  it('aceita o CÓDIGO NUMÉRICO, que é o que o Health Connect realmente manda', () => {
    expect(activityTypeFromExercise(79)).toBe('caminhada')
    expect(activityTypeFromExercise(56)).toBe('corrida')
    expect(activityTypeFromExercise(8)).toBe('ciclismo')
    expect(activityTypeFromExercise(74)).toBe('natacao')
    expect(activityTypeFromExercise(70)).toBe('musculacao')
    expect(activityTypeFromExercise(83)).toBe('yoga')
  })

  it('continua aceitando o NOME, para as fontes que já o resolvem', () => {
    expect(activityTypeFromExercise('walking')).toBe('caminhada')
    expect(activityTypeFromExercise('RUNNING')).toBe('corrida')
  })

  it('número que chega como texto também é entendido', () => {
    expect(activityTypeFromExercise('79')).toBe('caminhada')
  })

  it('desconhecido continua degradando para "outro" — o Modelo Aberto vale', () => {
    expect(activityTypeFromExercise(9999)).toBe('outro')
    expect(activityTypeFromExercise('kitesurf')).toBe('outro')
    expect(activityTypeFromExercise(null)).toBe('outro')
  })
})

describe('atividades do Health Connect', () => {
  const sessao = {
    startTime: '2026-08-30T10:00:00.000Z',
    endTime: '2026-08-30T11:00:00.000Z',
    exerciseType: 56, // RUNNING, como número — exatamente como chega
    metadata: { dataOrigin: { packageName: 'com.strava' }, id: 'sessao-1' },
  }

  it('a corrida do Strava deixa de ser "outra atividade"', () => {
    const [a] = healthConnectActivities(normalizeHealthConnect({ ExerciseSession: [sessao] }), V)
    expect(a.activity_type).toBe('corrida')
    expect(a.source).toBe('strava')
  })

  it('distância e energia vêm de registros SEPARADOS e são atribuídas à sessão', () => {
    const brutos = normalizeHealthConnect({
      ExerciseSession: [sessao],
      Distance: [{
        startTime: '2026-08-30T10:05:00.000Z', endTime: '2026-08-30T10:55:00.000Z',
        distance: { inMeters: 8200 }, metadata: { id: 'd1' },
      }],
      ActiveCaloriesBurned: [{
        startTime: '2026-08-30T10:05:00.000Z', endTime: '2026-08-30T10:55:00.000Z',
        energy: { inKilocalories: 540 }, metadata: { id: 'e1' },
      }],
    })
    const [a] = healthConnectActivities(brutos, V)
    expect(a.distance_m).toBe(8200)
    expect(a.active_energy_kcal).toBe(540)
  })

  it('o registro de OUTRA sessão não é atribuído a esta', () => {
    const brutos = normalizeHealthConnect({
      ExerciseSession: [sessao],
      Distance: [{
        // Muito depois — pertence a outra atividade do dia.
        startTime: '2026-08-30T18:00:00.000Z', endTime: '2026-08-30T18:30:00.000Z',
        distance: { inMeters: 3000 }, metadata: { id: 'd2' },
      }],
    })
    const [a] = healthConnectActivities(brutos, V)
    expect(a.distance_m).toBeNull()
  })

  it('duas sessões seguidas não dividem o mesmo registro entre si', () => {
    const brutos = normalizeHealthConnect({
      ExerciseSession: [
        sessao,
        { ...sessao, startTime: '2026-08-30T11:00:00.000Z', endTime: '2026-08-30T12:00:00.000Z', metadata: { id: 's2' } },
      ],
      Distance: [{
        startTime: '2026-08-30T11:10:00.000Z', endTime: '2026-08-30T11:50:00.000Z',
        distance: { inMeters: 5000 }, metadata: { id: 'd3' },
      }],
    })
    const [primeira, segunda] = healthConnectActivities(brutos, V)
    expect(primeira.distance_m).toBeNull()
    expect(segunda.distance_m).toBe(5000)
  })

  it('ausência permanece ausência — sem distância registrada não se afirma zero', () => {
    const [a] = healthConnectActivities(normalizeHealthConnect({ ExerciseSession: [sessao] }), V)
    expect(a.distance_m).toBeNull()
    expect(a.active_energy_kcal).toBeNull()
  })

  it('a energia ATIVA tem precedência sobre a total, que inclui o basal', () => {
    const brutos = normalizeHealthConnect({
      ExerciseSession: [sessao],
      ActiveCaloriesBurned: [{
        startTime: '2026-08-30T10:10:00.000Z', endTime: '2026-08-30T10:50:00.000Z',
        energy: { inKilocalories: 400 }, metadata: { id: 'e1' },
      }],
      TotalCaloriesBurned: [{
        startTime: '2026-08-30T10:10:00.000Z', endTime: '2026-08-30T10:50:00.000Z',
        energy: { inKilocalories: 480 }, metadata: { id: 'e2' },
      }],
    })
    const [a] = healthConnectActivities(brutos, V)
    expect(a.active_energy_kcal).toBe(400)
  })

  it('distância e energia NÃO viram medida pontual na linha do tempo', () => {
    // Percorrer 8 km não é uma medição de nada — é a grandeza de um intervalo. Vazá-las para as amostras
    // encheria Monitoramento de pontos que não são sinais.
    const brutos = normalizeHealthConnect({
      Distance: [{ startTime: '2026-08-30T10:00:00.000Z', distance: { inMeters: 100 }, metadata: { id: 'd' } }],
    })
    expect(brutos).toHaveLength(1)
    expect(healthConnectActivities(brutos, V)).toHaveLength(0)
  })
})
