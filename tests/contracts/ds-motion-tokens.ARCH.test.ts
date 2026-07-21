// ARCH — Contrato de MOTION (Passo 3B · Etapa 1 · Subitem 5).
import { describe, it, expect } from 'vitest'
import { duration, easing, motion, motionDuration } from '../../packages/design-system/src'

describe('ARCH · motion — papéis e reduced-motion', () => {
  it('durações crescentes e curvas como cubic-bezier', () => {
    expect(duration.instant).toBe(0)
    expect(duration.fast).toBeLessThan(duration.base)
    expect(duration.base).toBeLessThan(duration.slow)
    for (const e of Object.values(easing)) expect(e).toMatch(/^cubic-bezier\(/)
  })

  it('papéis por intenção com {duration, easing}', () => {
    for (const r of ['tap', 'enter', 'exit', 'emphasis'] as const) {
      expect(motion[r].duration).toBeGreaterThanOrEqual(0)
      expect(motion[r].easing).toMatch(/^cubic-bezier\(/)
    }
  })

  it('prefers-reduced-motion zera a duração (mantém a troca de estado, sem animação)', () => {
    expect(motionDuration(motion.enter, true)).toBe(0)
    expect(motionDuration(motion.enter, false)).toBe(motion.enter.duration)
  })
})
