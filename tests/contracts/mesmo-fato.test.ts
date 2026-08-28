// "ISTO JÁ ESTÁ NA PLATAFORMA?" — o mesmo fato chegando por caminhos diferentes.
//
// REGRA DA FUNDADORA (28/08, PERMANENTE): toda informação que entra — digitada, enviada ou transferida — é
// conferida contra o que já existe; havendo correspondência, a plataforma INFORMA e PERGUNTA.
//
// O banco já impede a repetição exata (mesma fonte, mesmo identificador). O que estes testes guardam é o caso
// que ele NÃO pega: a mesma corrida que chega pelo Strava direto e também pelo Health Connect. Identificadores
// diferentes, horários com segundos de diferença — o banco vê dois fatos, e o relatório levado ao médico
// mostraria o dobro do que a pessoa fez.
import { describe, it, expect } from 'vitest'
import {
  sameActivityFact, suspectedDuplicateActivities,
  sameObservationFact, suspectedDuplicateObservations,
  DUPLICATE_CHOICES,
  type ActivityForMatch, type ObservationForMatch,
} from '@sintera/core'

const ativ = (o: Partial<ActivityForMatch> & { id: string; source: string; startedAt: string }): ActivityForMatch => ({
  activityType: 'corrida', durationS: 1800, distanceM: 5000, ...o,
})

describe('atividade: o mesmo fato por caminhos diferentes', () => {
  it('a MESMA corrida pelo Strava e pelo Health Connect é suspeita', () => {
    const s = sameActivityFact(
      ativ({ id: 'a', source: 'health_connect', startedAt: '2026-08-28T07:00:00.000Z' }),
      ativ({ id: 'b', source: 'strava', startedAt: '2026-08-28T07:02:00.000Z' }),
    )
    expect(s).not.toBeNull()
    expect(s!.reason).toContain('strava')
    expect(s!.reason).toContain('2 min')
  })

  it('a MESMA fonte NÃO é suspeita — o banco já impede, e dois treinos seguidos são legítimos', () => {
    expect(sameActivityFact(
      ativ({ id: 'a', source: 'garmin', startedAt: '2026-08-28T07:00:00.000Z' }),
      ativ({ id: 'b', source: 'garmin', startedAt: '2026-08-28T07:01:00.000Z' }),
    )).toBeNull()
  })

  it('horário próximo NÃO basta — pedalar até a academia e treinar começam juntos', () => {
    expect(sameActivityFact(
      ativ({ id: 'a', source: 'strava', startedAt: '2026-08-28T07:00:00.000Z', distanceM: 3000, durationS: 600 }),
      ativ({ id: 'b', source: 'garmin', startedAt: '2026-08-28T07:01:00.000Z', distanceM: 0, durationS: 3600 }),
    )).toBeNull()
  })

  it('tempo EM MOVIMENTO × tempo TOTAL ainda casa — é o caso mais comum entre fontes', () => {
    // Strava conta o movimento (28 min); o relógio conta do botão ao botão (33 min). Mesma corrida.
    const s = sameActivityFact(
      ativ({ id: 'a', source: 'strava', startedAt: '2026-08-28T07:00:00.000Z', durationS: 1680, distanceM: 5000 }),
      ativ({ id: 'b', source: 'garmin', startedAt: '2026-08-28T07:00:00.000Z', durationS: 1980, distanceM: 5050 }),
    )
    expect(s).not.toBeNull()
  })

  it('GPS que divergem alguns por cento na distância ainda casam', () => {
    const s = sameActivityFact(
      ativ({ id: 'a', source: 'strava', startedAt: '2026-08-28T07:00:00.000Z', distanceM: 5000 }),
      ativ({ id: 'b', source: 'oura', startedAt: '2026-08-28T07:00:00.000Z', distanceM: 5200 }),
    )
    expect(s).not.toBeNull()
  })

  it('começar com mais de 5 minutos de diferença já é outra atividade', () => {
    expect(sameActivityFact(
      ativ({ id: 'a', source: 'strava', startedAt: '2026-08-28T07:00:00.000Z' }),
      ativ({ id: 'b', source: 'garmin', startedAt: '2026-08-28T07:20:00.000Z' }),
    )).toBeNull()
  })

  it('data inválida não vira suspeita — na dúvida, não acusa', () => {
    expect(sameActivityFact(
      ativ({ id: 'a', source: 'strava', startedAt: 'ontem' }),
      ativ({ id: 'b', source: 'garmin', startedAt: '2026-08-28T07:00:00.000Z' }),
    )).toBeNull()
  })

  it('cada entrada suspeita aparece UMA vez, não uma por par possível', () => {
    const novos = [ativ({ id: 'novo', source: 'health_connect', startedAt: '2026-08-28T07:00:00.000Z' })]
    const antigos = [
      ativ({ id: 'v1', source: 'strava', startedAt: '2026-08-28T07:01:00.000Z' }),
      ativ({ id: 'v2', source: 'garmin', startedAt: '2026-08-28T07:02:00.000Z' }),
    ]
    // Sem isso, a pessoa responderia três perguntas sobre a mesma corrida.
    expect(suspectedDuplicateActivities(novos, antigos)).toHaveLength(1)
  })

  it('nada suspeito devolve lista vazia', () => {
    expect(suspectedDuplicateActivities([], [])).toEqual([])
  })
})

const obs = (o: Partial<ObservationForMatch> & { id: string; source: string; recordedAt: string }): ObservationForMatch => ({
  metric: 'peso', value: 72.5, ...o,
})

describe('observação: o mesmo fato por caminhos diferentes', () => {
  it('a mesma pesagem por dois apps é suspeita', () => {
    const s = sameObservationFact(
      obs({ id: 'a', source: 'health_connect', recordedAt: '2026-08-28T07:00:00.000Z' }),
      obs({ id: 'b', source: 'withings', recordedAt: '2026-08-28T07:00:30.000Z' }),
    )
    expect(s).not.toBeNull()
    expect(s!.reason).toContain('withings')
  })

  it('DUAS medições de pressão seguidas NÃO são duplicata — é o que o médico pede', () => {
    // Medir, repousar, medir de novo. Valores diferentes: são dois fatos clínicos.
    expect(sameObservationFact(
      obs({ id: 'a', source: 'manual', metric: 'pressao_arterial', value: 138, recordedAt: '2026-08-28T07:00:00.000Z' }),
      obs({ id: 'b', source: 'garmin', metric: 'pressao_arterial', value: 126, recordedAt: '2026-08-28T07:01:00.000Z' }),
    )).toBeNull()
  })

  it('métricas diferentes nunca se confundem', () => {
    expect(sameObservationFact(
      obs({ id: 'a', source: 'strava', metric: 'peso', recordedAt: '2026-08-28T07:00:00.000Z' }),
      obs({ id: 'b', source: 'garmin', metric: 'glicemia', recordedAt: '2026-08-28T07:00:00.000Z' }),
    )).toBeNull()
  })

  it('arredondamento entre apps ainda casa', () => {
    const s = sameObservationFact(
      obs({ id: 'a', source: 'health_connect', value: 72.5, recordedAt: '2026-08-28T07:00:00.000Z' }),
      obs({ id: 'b', source: 'withings', value: 72.6, recordedAt: '2026-08-28T07:00:00.000Z' }),
    )
    expect(s).not.toBeNull()
  })

  it('tolerância de instante é ESTREITA — dois minutos, não cinco', () => {
    expect(sameObservationFact(
      obs({ id: 'a', source: 'health_connect', recordedAt: '2026-08-28T07:00:00.000Z' }),
      obs({ id: 'b', source: 'withings', recordedAt: '2026-08-28T07:05:00.000Z' }),
    )).toBeNull()
  })

  it('sem valor não dá para afirmar nada', () => {
    expect(sameObservationFact(
      obs({ id: 'a', source: 'health_connect', value: null, recordedAt: '2026-08-28T07:00:00.000Z' }),
      obs({ id: 'b', source: 'withings', recordedAt: '2026-08-28T07:00:00.000Z' }),
    )).toBeNull()
  })

  it('lote sem correspondência devolve vazio', () => {
    expect(suspectedDuplicateObservations(
      [obs({ id: 'a', source: 'strava', recordedAt: '2026-08-28T07:00:00.000Z' })],
      [obs({ id: 'b', source: 'garmin', recordedAt: '2026-01-01T07:00:00.000Z' })],
    )).toEqual([])
  })
})

describe('o que se oferece à pessoa', () => {
  it('as três escolhas existem, e nenhuma é automática', () => {
    expect(DUPLICATE_CHOICES.map(c => c.id)).toEqual(['manter-ambos', 'descartar-novo', 'substituir'])
    for (const c of DUPLICATE_CHOICES) {
      expect(c.label.trim()).not.toBe('')
      expect(c.hint.trim(), `${c.id} sem explicação`).not.toBe('')
    }
  })
})
