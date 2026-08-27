// FUNC · HIP-014 §3 — sessão de atividade física.
//
// A sessão é FATO OBSERVADO ("corri 5,2 km em 32 min na terça"), distinta de life_habits, que guarda a INTENÇÃO
// declarada ("correr 3x por semana"). Aqui só a apresentação pura do fato — sem juízo de desempenho (RDC 657).
//
// O que estes testes protegem, acima de tudo: NÃO INVENTAR NÚMERO. Cada fonte entrega um subconjunto diferente
// de grandezas, e ausência de medida é informação legítima. Preencher com zero o que a fonte não mediu seria
// afirmar algo falso sobre a saúde de alguém.
import { describe, it, expect } from 'vitest'
import {
  ACTIVITY_TYPES, activityTypeLabel, activityDurationLabel, activityDistanceLabel,
  activitySummary, durationFromWindow, durationSecondsFromMinutes, distanceMetersFromKm,
  activityPace, activitySpeed, activityDerivedPace, paceKindFor,
} from '@sintera/core'

describe('HIP-014 · ritmo e velocidade — derivados, nunca gravados', () => {
  it('a MODALIDADE decide a unidade: quem corre fala em ritmo, quem pedala em velocidade', () => {
    // "12 km/h" para uma corrida é tecnicamente correto e ninguém entende.
    expect(paceKindFor('corrida')).toBe('ritmo')
    expect(paceKindFor('caminhada')).toBe('ritmo')
    expect(paceKindFor('natacao')).toBe('ritmo')
    expect(paceKindFor('ciclismo')).toBe('velocidade')
  })

  it('modalidade sem deslocamento não tem nem uma nem outra', () => {
    for (const t of ['musculacao', 'yoga', 'pilates', 'outro']) {
      expect(paceKindFor(t), t).toBeNull()
    }
  })

  it('calcula o ritmo em min:ss por km', () => {
    // 5 km em 30 min = 6:00 /km
    expect(activityPace(1800, 5000)).toBe('6:00 /km')
    // 10 km em 52min30 = 5:15 /km
    expect(activityPace(3150, 10000)).toBe('5:15 /km')
  })

  it('5:60 não existe — o arredondamento dos segundos vira um minuto', () => {
    // 1 km em 359,7 s arredondaria para 5:60 se ninguém tratasse.
    expect(activityPace(359.7, 1000)).toBe('6:00 /km')
  })

  it('calcula a velocidade em km/h, sem falsa precisão', () => {
    expect(activitySpeed(3600, 22400)).toBe('22,4 km/h')
    expect(activitySpeed(3600, 20000)).toBe('20 km/h')   // não "20,0"
  })

  it('O CASO QUE QUEBRARIA: distância zero não vira "Infinity /km"', () => {
    expect(activityPace(1800, 0)).toBeNull()
    expect(activitySpeed(1800, 0)).toBeNull()
    expect(activityPace(0, 5000)).toBeNull()
  })

  it('recusa número absurdo em vez de exibi-lo — é erro de digitação, não desempenho', () => {
    expect(activitySpeed(1, 1000000)).toBeNull()        // 3.600.000 km/h
    expect(activityPace(3600 * 200, 1000)).toBeNull()   // 12.000 min/km
  })

  it('sem os dois dados não há derivado', () => {
    expect(activityDerivedPace({ activity_type: 'corrida', duration_s: 1800 })).toBeNull()
    expect(activityDerivedPace({ activity_type: 'corrida', distance_m: 5000 })).toBeNull()
  })

  it('escolhe sozinho a unidade certa a partir da sessão', () => {
    expect(activityDerivedPace({ activity_type: 'corrida', duration_s: 1800, distance_m: 5000 })).toBe('6:00 /km')
    expect(activityDerivedPace({ activity_type: 'ciclismo', duration_s: 3600, distance_m: 22400 })).toBe('22,4 km/h')
    expect(activityDerivedPace({ activity_type: 'musculacao', duration_s: 1800, distance_m: 5000 })).toBeNull()
  })
})

describe('HIP-014 · o que a pessoa digita → o que vai ao banco', () => {
  it('minutos viram segundos; quilômetros viram metros', () => {
    expect(durationSecondsFromMinutes('45')).toBe(2700)
    expect(distanceMetersFromKm('5,2')).toBe(5200)
    expect(distanceMetersFromKm('5.2')).toBe(5200)   // aceita ponto também
  })

  it('O CASO CENTRAL: campo em branco vira null, NUNCA zero', () => {
    for (const vazio of ['', '   ', null, undefined]) {
      expect(durationSecondsFromMinutes(vazio), 'duração em branco não pode virar 0').toBeNull()
      expect(distanceMetersFromKm(vazio), 'distância em branco não pode virar 0').toBeNull()
    }
  })

  it('mas um zero DIGITADO é zero — a pessoa afirmou', () => {
    expect(durationSecondsFromMinutes('0')).toBe(0)
    expect(distanceMetersFromKm('0')).toBe(0)
  })

  it('texto sem número e valor negativo devolvem null', () => {
    expect(durationSecondsFromMinutes('abc')).toBeNull()
    expect(distanceMetersFromKm('-3')).toBeNull()
  })

  it('a ida e a volta se fecham', () => {
    expect(activityDurationLabel(durationSecondsFromMinutes('83'))).toBe('1 h 23 min')
    expect(activityDistanceLabel(distanceMetersFromKm('5,2'))).toBe('5,2 km')
  })
})

describe('HIP-014 · tipo de atividade (lista aberta)', () => {
  it('rotula os tipos conhecidos', () => {
    expect(activityTypeLabel('corrida')).toBe('Corrida')
    expect(activityTypeLabel('natacao')).toBe('Natação')
    expect(ACTIVITY_TYPES.every(a => activityTypeLabel(a.value) === a.label)).toBe(true)
  })

  it('MODELO ABERTO: modalidade desconhecida vira registro rotulado, não falha', () => {
    expect(activityTypeLabel('kitesurf')).toBe('Outra atividade')
    expect(activityTypeLabel(null)).toBe('Outra atividade')
    expect(activityTypeLabel('')).toBe('Outra atividade')
  })
})

describe('HIP-014 · duração legível', () => {
  it('minutos, horas, e hora exata', () => {
    expect(activityDurationLabel(45 * 60)).toBe('45 min')
    expect(activityDurationLabel(83 * 60)).toBe('1 h 23 min')
    expect(activityDurationLabel(3600)).toBe('1 h')
  })

  it('sessão muito curta não vira "0 min"', () => {
    expect(activityDurationLabel(20)).toBe('menos de 1 min')
  })

  it('ausência e valor inválido devolvem null — não zero', () => {
    expect(activityDurationLabel(null)).toBeNull()
    expect(activityDurationLabel(undefined)).toBeNull()
    expect(activityDurationLabel(-5)).toBeNull()
    expect(activityDurationLabel(Number.NaN)).toBeNull()
  })
})

describe('HIP-014 · distância legível', () => {
  it('metros abaixo de 1 km, quilômetros acima', () => {
    expect(activityDistanceLabel(800)).toBe('800 m')
    expect(activityDistanceLabel(5200)).toBe('5,2 km')
  })

  it('não mostra falsa precisão: 5 km, não 5,0 km', () => {
    expect(activityDistanceLabel(5000)).toBe('5 km')
  })

  it('ausência devolve null', () => {
    expect(activityDistanceLabel(null)).toBeNull()
    expect(activityDistanceLabel(-1)).toBeNull()
  })
})

describe('HIP-014 · resumo da sessão — só o que foi medido', () => {
  it('junta o que existe, na ordem fixa', () => {
    expect(activitySummary({ duration_s: 1920, distance_m: 5200, active_energy_kcal: 310 }))
      .toBe('32 min · 5,2 km · 310 kcal')
  })

  it('O CASO CENTRAL: o que a fonte não mediu simplesmente não aparece', () => {
    // Musculação não tem distância; o Strava via Health Connect não traz energia em toda atividade.
    expect(activitySummary({ duration_s: 2700, distance_m: null, active_energy_kcal: null })).toBe('45 min')
    expect(activitySummary({ duration_s: null, distance_m: 3000 })).toBe('3 km')
  })

  it('sessão sem nenhuma grandeza devolve null, em vez de uma linha vazia de separadores', () => {
    expect(activitySummary({})).toBeNull()
    expect(activitySummary({ duration_s: null, distance_m: null, active_energy_kcal: null })).toBeNull()
  })
})

describe('HIP-014 · duração pela janela', () => {
  it('calcula quando a fonte não informou a duração', () => {
    expect(durationFromWindow('2026-08-25T07:00:00.000Z', '2026-08-25T07:32:00.000Z')).toBe(1920)
  })

  it('janela incoerente ou incompleta devolve null — não inventa', () => {
    expect(durationFromWindow('2026-08-25T08:00:00.000Z', '2026-08-25T07:00:00.000Z')).toBeNull()
    expect(durationFromWindow('2026-08-25T07:00:00.000Z', null)).toBeNull()
    expect(durationFromWindow(null, '2026-08-25T07:00:00.000Z')).toBeNull()
    expect(durationFromWindow('não é data', '2026-08-25T07:00:00.000Z')).toBeNull()
  })

  it('é determinístico', () => {
    const a = durationFromWindow('2026-08-25T07:00:00.000Z', '2026-08-25T08:15:00.000Z')
    const b = durationFromWindow('2026-08-25T07:00:00.000Z', '2026-08-25T08:15:00.000Z')
    expect(a).toBe(b)
    expect(activityDurationLabel(a)).toBe('1 h 15 min')
  })
})
