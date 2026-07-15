// FUNC · BILLING-001 — ciclo de vida da assinatura (máquina de estados pura).
//
// Certifica as transições válidas/ inválidas: contratar, trial, renovar, cancelar, suspender,
// reativar, inadimplência. Determinística; ação inválida lança (nunca aplica estado inconsistente).

import { describe, it, expect } from 'vitest'
import { applyAction, canApply, grantsPaidPlan, type SubscriptionAction } from '@/lib/billing/lifecycle'
import type { SubscriptionStatus } from '@/lib/billing/entitlements'

describe('BILLING-001 · transições válidas', () => {
  const cases: Array<[SubscriptionStatus | null, SubscriptionAction, SubscriptionStatus]> = [
    [null, 'subscribe', 'active'],
    [null, 'start_trial', 'trial'],
    ['trial', 'subscribe', 'active'],
    ['trial', 'renew', 'active'],
    ['active', 'mark_past_due', 'past_due'],
    ['past_due', 'renew', 'active'],
    ['past_due', 'suspend', 'suspended'],
    ['active', 'change_plan', 'active'],
    ['trial', 'change_plan', 'active'],
    ['active', 'cancel', 'canceled'],
    ['suspended', 'reactivate', 'active'],
    ['canceled', 'reactivate', 'active'],
    ['canceled', 'subscribe', 'active'],
  ]
  it.each(cases)('%s —(%s)→ %s', (from, action, to) => {
    expect(canApply(from, action)).toBe(true)
    expect(applyAction(from, action)).toBe(to)
  })
})

describe('BILLING-001 · transições inválidas lançam', () => {
  it('não renova sem assinatura', () => {
    expect(canApply(null, 'renew')).toBe(false)
    expect(() => applyAction(null, 'renew')).toThrow(/inválida/i)
  })

  it('não inicia trial estando ativo', () => {
    expect(canApply('active', 'start_trial')).toBe(false)
    expect(() => applyAction('active', 'start_trial')).toThrow()
  })

  it('não suspende quem já cancelou', () => {
    expect(canApply('canceled', 'suspend')).toBe(false)
  })

  it('não migra de plano sem assinatura vigente (só active/trial)', () => {
    expect(canApply(null, 'change_plan')).toBe(false)
    expect(canApply('canceled', 'change_plan')).toBe(false)
    expect(canApply('suspended', 'change_plan')).toBe(false)
  })

  it('não marca inadimplência em assinatura suspensa/cancelada', () => {
    expect(canApply('suspended', 'mark_past_due')).toBe(false)
    expect(canApply('canceled', 'mark_past_due')).toBe(false)
  })
})

describe('BILLING-001 · acesso ao plano pago espelha entitlements', () => {
  it('active e trial concedem; demais não', () => {
    expect(grantsPaidPlan('active')).toBe(true)
    expect(grantsPaidPlan('trial')).toBe(true)
    for (const s of ['past_due', 'suspended', 'canceled'] as const) expect(grantsPaidPlan(s)).toBe(false)
  })
})
