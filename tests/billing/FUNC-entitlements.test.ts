// FUNC · BILLING-001 — contrato de entitlements (fronteira única comercial × módulos).
//
// Certifica: FREE concede tudo (pré-comercial não restringe); plano ativo aplica features/limites/
// módulos; status inativo degrada para FREE (não quebra); curinga '*'; limite ausente = ilimitado.

import { describe, it, expect } from 'vitest'
import { resolveEntitlements, freeEntitlements, FREE_PLAN, type PlanEntitlements } from '@/lib/billing/entitlements'

const PRO: PlanEntitlements = {
  features: ['reports.share', 'omics'],
  limits: { exams_per_month: 50 },
  modules: ['exames', 'relatorios'],
}

describe('BILLING-001 · FREE (pré-comercial não restringe)', () => {
  it('sem assinatura → FREE concede qualquer feature/módulo (curinga)', () => {
    const e = freeEntitlements()
    expect(e.can('qualquer.coisa')).toBe(true)
    expect(e.hasModule('exames')).toBe(true)
    expect(e.hasModule('modulo-que-nao-existe')).toBe(true)
  })

  it('resolve sem argumentos → FREE, status inativo, active=false', () => {
    const e = resolveEntitlements({})
    expect(e.plan).toBe('free')
    expect(e.active).toBe(false)
    expect(e.can('x')).toBe(true) // FREE ainda concede (degrada, não quebra)
  })
})

describe('BILLING-001 · plano ativo aplica permissões', () => {
  const active = resolveEntitlements({ plan: 'pro', status: 'active', entitlements: PRO })

  it('active/trial concede o plano', () => {
    expect(active.active).toBe(true)
    expect(resolveEntitlements({ plan: 'pro', status: 'trial', entitlements: PRO }).active).toBe(true)
  })

  it('can() reflete as features do plano', () => {
    expect(active.can('omics')).toBe(true)
    expect(active.can('feature.inexistente')).toBe(false)
  })

  it('hasModule() reflete os módulos do plano', () => {
    expect(active.hasModule('exames')).toBe(true)
    expect(active.hasModule('care')).toBe(false)
  })

  it('limit() devolve o número; ausente = null (ilimitado)', () => {
    expect(active.limit('exams_per_month')).toBe(50)
    expect(active.limit('qualquer_outro')).toBeNull()
  })
})

describe('BILLING-001 · status inativo degrada para FREE (não quebra)', () => {
  it('past_due/suspended/canceled → cai no FREE (concede tudo), active=false', () => {
    for (const status of ['past_due', 'suspended', 'canceled'] as const) {
      const e = resolveEntitlements({ plan: 'pro', status, entitlements: PRO })
      expect(e.active).toBe(false)
      expect(e.can('omics')).toBe(true)       // FREE concede
      expect(e.hasModule('care')).toBe(true)  // FREE concede
    }
  })

  it('um plano pago que restringe só vale com status ativo', () => {
    const restrictive: PlanEntitlements = { features: [], limits: {}, modules: ['exames'] }
    const activeR = resolveEntitlements({ plan: 'basic', status: 'active', entitlements: restrictive })
    expect(activeR.can('omics')).toBe(false)
    expect(activeR.hasModule('relatorios')).toBe(false)
    // mesmo plano, status inativo → FREE (não restringe)
    const inactiveR = resolveEntitlements({ plan: 'basic', status: 'suspended', entitlements: restrictive })
    expect(inactiveR.hasModule('relatorios')).toBe(true)
  })
})

describe('BILLING-001 · FREE_PLAN é curinga', () => {
  it('FREE_PLAN concede tudo por design', () => {
    expect(FREE_PLAN.features).toContain('*')
    expect(FREE_PLAN.modules).toContain('*')
  })
})
