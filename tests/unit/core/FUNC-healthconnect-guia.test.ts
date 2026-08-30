// CATRACA — uma fonte que não funciona NESTE aparelho não pode ser oferecida como se funcionasse.
//
// Homologação de 30/08: o Samsung Health estava no guia, foi autorizado no Health Connect, e todas as
// categorias continuaram vazias. Ele exige Android 10; o aparelho tem 9. A versão que roda ali é anterior ao
// Health Connect existir — nunca escreveria nada, e nada dizia isso.
//
// Oferecer o caminho de uma fonte impossível é pior que omiti-la: a pessoa segue o passo a passo, dá a
// permissão, não recebe dado, e conclui que a plataforma está quebrada.
import { describe, it, expect } from 'vitest'
import {
  HEALTH_CONNECT_FONTES, fontesDisponiveis, fontesIndisponiveis, motivoIndisponivel,
} from '@sintera/core'

const ANDROID_9 = 28
const ANDROID_14 = 34

describe('guia de fontes do Health Connect', () => {
  it('no Android 9 o Samsung Health sai das disponíveis e ganha um motivo', () => {
    expect(fontesDisponiveis(ANDROID_9).some(f => f.source === 'samsung_health')).toBe(false)
    const bloqueada = fontesIndisponiveis(ANDROID_9).find(x => x.fonte.source === 'samsung_health')
    expect(bloqueada).toBeDefined()
    expect(bloqueada!.motivo).toContain('Android 10')
  })

  it('no Android 14 o Samsung Health volta a ser oferecido', () => {
    expect(fontesDisponiveis(ANDROID_14).some(f => f.source === 'samsung_health')).toBe(true)
  })

  it('a fonte que ainda não escreve continua bloqueada em QUALQUER Android', () => {
    for (const api of [ANDROID_9, ANDROID_14]) {
      const garmin = fontesIndisponiveis(api).find(x => x.fonte.source === 'garmin')
      expect(garmin, `garmin deveria estar bloqueado no Android ${api}`).toBeDefined()
    }
  })

  it('toda fonte indisponível traz o motivo — a lista nunca esconde sem explicar', () => {
    for (const { fonte, motivo } of fontesIndisponiveis(ANDROID_9)) {
      expect(motivo.length, `${fonte.nome} sem motivo`).toBeGreaterThan(20)
    }
  })

  it('sem saber a versão do Android, só bloqueia o que vale para todo mundo', () => {
    // Não dá para afirmar que uma fonte é impossível quando não se sabe onde ela vai rodar.
    expect(fontesDisponiveis().some(f => f.source === 'samsung_health')).toBe(true)
    expect(fontesDisponiveis().some(f => f.source === 'garmin')).toBe(false)
  })

  it('disponíveis e indisponíveis somam o catálogo inteiro — nenhuma fonte some no caminho', () => {
    for (const api of [undefined, ANDROID_9, ANDROID_14]) {
      const total = fontesDisponiveis(api).length + fontesIndisponiveis(api).length
      expect(total, `perdeu fonte no Android ${api}`).toBe(HEALTH_CONNECT_FONTES.length)
    }
  })

  it('toda fonte oferecida diz o caminho e o que traz — instrução pela metade não serve', () => {
    for (const f of fontesDisponiveis(ANDROID_14)) {
      expect(f.caminho, `${f.nome} sem caminho`).toMatch(/→/)
      expect(f.traz.length, `${f.nome} sem dizer o que traz`).toBeGreaterThan(10)
    }
  })

  it('motivoIndisponivel devolve null quando a fonte serve', () => {
    const strava = HEALTH_CONNECT_FONTES.find(f => f.source === 'strava')!
    expect(motivoIndisponivel(strava, ANDROID_9)).toBeNull()
  })
})
