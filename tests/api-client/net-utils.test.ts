// Infra de rede COMPARTILHADA do @sintera/api-client (usada por todos os domínios): normalização de erro
// (asError) e composição de abort/timeout (withTimeout/TimeoutError). Testes diretos — antes só cobertos de forma
// indireta. Puros/determinísticos (timers fake).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { withTimeout, TimeoutError, DEFAULT_TIMEOUT_MS } from '../../packages/api-client/src/net/timeout'
import { asError } from '../../packages/api-client/src/net/errors'

describe('asError (normalização de erro)', () => {
  it('Error passa direto (mesma instância)', () => {
    const e = new Error('x')
    expect(asError(e)).toBe(e)
  })
  it('string → Error com a mensagem', () => {
    expect(asError('falhou').message).toBe('falhou')
  })
  it('valor desconhecido → Error genérico', () => {
    expect(asError({ a: 1 }).message).toBe('Erro desconhecido')
    expect(asError(null).message).toBe('Erro desconhecido')
    expect(asError(42).message).toBe('Erro desconhecido')
  })
})

describe('TimeoutError', () => {
  it('name distinguível + mensagem com o ms', () => {
    const e = new TimeoutError(500)
    expect(e).toBeInstanceOf(Error)
    expect(e.name).toBe('TimeoutError')
    expect(e.message).toContain('500')
  })
})

describe('withTimeout (composição de abort)', () => {
  afterEach(() => vi.useRealTimers())

  it('aborta por TIMEOUT após ms, com TimeoutError na reason', () => {
    vi.useFakeTimers()
    const { signal, cleanup } = withTimeout(undefined, 1000)
    expect(signal.aborted).toBe(false)
    vi.advanceTimersByTime(1000)
    expect(signal.aborted).toBe(true)
    expect((signal.reason as Error).name).toBe('TimeoutError')
    cleanup()
  })

  it('external já abortado → aborta imediatamente com a reason externa', () => {
    const ext = AbortSignal.abort('cancelado')
    const { signal, cleanup } = withTimeout(ext, 1000)
    expect(signal.aborted).toBe(true)
    expect(signal.reason).toBe('cancelado')
    cleanup()
  })

  it('external aborta DEPOIS → propaga a reason (ex.: unmount do hook)', () => {
    const ctrl = new AbortController()
    const { signal, cleanup } = withTimeout(ctrl.signal, 10_000)
    expect(signal.aborted).toBe(false)
    ctrl.abort('unmount')
    expect(signal.aborted).toBe(true)
    expect(signal.reason).toBe('unmount')
    cleanup()
  })

  it('cleanup evita o abort por timeout depois de limpo (não vaza timer)', () => {
    vi.useFakeTimers()
    const { signal, cleanup } = withTimeout(undefined, 1000)
    cleanup()
    vi.advanceTimersByTime(5000)
    expect(signal.aborted).toBe(false)
  })

  it('ms default = DEFAULT_TIMEOUT_MS', () => {
    vi.useFakeTimers()
    const { signal, cleanup } = withTimeout()
    vi.advanceTimersByTime(DEFAULT_TIMEOUT_MS - 1)
    expect(signal.aborted).toBe(false)
    vi.advanceTimersByTime(1)
    expect(signal.aborted).toBe(true)
    cleanup()
  })
})
