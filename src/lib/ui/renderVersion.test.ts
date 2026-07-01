import { describe, it, expect } from 'vitest'
import { pageVersion, RENDER_CONFIG } from './renderVersion'

describe('renderVersion — config central + override por env', () => {
  it('sem env → usa o baseline da config (tudo legacy hoje)', () => {
    expect(pageVersion('dashboard', undefined)).toBe(RENDER_CONFIG.dashboard)
    expect(pageVersion('timeline')).toBe('legacy')
  })

  it('env sobrepõe a config: "true" → v2, "false" → legacy', () => {
    expect(pageVersion('dashboard', 'true')).toBe('v2')
    expect(pageVersion('dashboard', 'false')).toBe('legacy')
  })

  it('valor de env inválido cai no baseline (fail-safe)', () => {
    expect(pageVersion('report', '1')).toBe(RENDER_CONFIG.report)
    expect(pageVersion('report', 'yes')).toBe('legacy')
  })

  it('config central cobre todas as páginas', () => {
    expect(Object.keys(RENDER_CONFIG).sort()).toEqual(['dashboard', 'indicator', 'report', 'timeline'])
  })
})
