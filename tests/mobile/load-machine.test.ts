// Teste do reducer de carga (leitura) do Inc.5 — puro/determinístico, testável sem emulador.
// `loadMachine` não importa nada (só tipos + reducer), então pode ser importado direto no vitest.
import { describe, it, expect } from 'vitest'
import { loadReducer, initialLoadState, type LoadState } from '../../apps/mobile/src/presentation/screens/exams/loadMachine'

describe('loadReducer (carga read-only do Inc.5)', () => {
  it('idle --LOAD--> loading', () => {
    expect(loadReducer(initialLoadState<number[]>(), { type: 'LOAD' }).phase).toBe('loading')
  })

  it('loading --SUCCESS--> ready com os dados', () => {
    const s = loadReducer(initialLoadState<number[]>(), { type: 'LOAD' })
    const r = loadReducer(s, { type: 'SUCCESS', data: [1, 2] })
    expect(r.phase).toBe('ready')
    expect(r.data).toEqual([1, 2])
    expect(r.error).toBeNull()
  })

  it('loading --FAILURE--> error com a mensagem', () => {
    const s = loadReducer(initialLoadState<number[]>(), { type: 'LOAD' })
    const r = loadReducer(s, { type: 'FAILURE', error: 'falhou' })
    expect(r.phase).toBe('error')
    expect(r.error).toBe('falhou')
  })

  it('error --RETRY--> loading (permite recarregar)', () => {
    const err: LoadState<number[]> = { phase: 'error', data: null, error: 'x' }
    expect(loadReducer(err, { type: 'RETRY' }).phase).toBe('loading')
  })

  it('ignora eventos inválidos para a fase (retorna o mesmo estado)', () => {
    const ready: LoadState<number[]> = { phase: 'ready', data: [9], error: null }
    expect(loadReducer(ready, { type: 'SUCCESS', data: [0] })).toBe(ready)
  })

  it('SET aplica dados frescos silenciosamente a partir de QUALQUER fase (refresh sem piscar)', () => {
    // de 'ready' → atualiza os dados sem passar por 'loading'
    const ready: LoadState<number[]> = { phase: 'ready', data: [1], error: null }
    expect(loadReducer(ready, { type: 'SET', data: [1, 2, 3] })).toEqual({ phase: 'ready', data: [1, 2, 3], error: null })
    // de 'error' → recupera para 'ready' com dados (refresh que deu certo)
    const err: LoadState<number[]> = { phase: 'error', data: null, error: 'x' }
    expect(loadReducer(err, { type: 'SET', data: [9] })).toEqual({ phase: 'ready', data: [9], error: null })
  })
})
