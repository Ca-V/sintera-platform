// FUNC · BILLING-001 — serviço de assinatura (transição→histórico→fatura), lógica pura.

import { describe, it, expect } from 'vitest'
import { planTransition, buildInvoice } from '@/lib/billing/service'

describe('BILLING-001 · planTransition', () => {
  it('contratar sem assinatura → subscription ativa + evento com from=null', () => {
    const { subscription, event } = planTransition({ current: null, action: 'subscribe', planId: 'pro' })
    expect(subscription).toEqual({ plan_id: 'pro', status: 'active' })
    expect(event).toMatchObject({ action: 'subscribe', from_status: null, to_status: 'active', plan_id: 'pro', source: 'system' })
  })

  it('webhook de falha de pagamento → past_due, source gateway, external_ref preservado', () => {
    const { subscription, event } = planTransition({
      current: 'active', action: 'mark_past_due', planId: 'pro', source: 'gateway_webhook', externalRef: 'evt_123',
    })
    expect(subscription.status).toBe('past_due')
    expect(event).toMatchObject({ from_status: 'active', to_status: 'past_due', source: 'gateway_webhook', external_ref: 'evt_123' })
  })

  it('transição inválida lança (não persiste estado inconsistente)', () => {
    expect(() => planTransition({ current: null, action: 'renew', planId: 'pro' })).toThrow()
  })
})

describe('BILLING-001 · buildInvoice', () => {
  it('constrói fatura com defaults (BRL, open) e arredonda/normaliza o valor', () => {
    expect(buildInvoice({ userId: 'u1', planId: 'pro', amountCents: 4990.4 }))
      .toEqual({ user_id: 'u1', plan_id: 'pro', amount_cents: 4990, currency: 'BRL', status: 'open' })
  })

  it('valor negativo é normalizado para 0; external_ref e status respeitados', () => {
    expect(buildInvoice({ userId: 'u1', planId: 'pro', amountCents: -10, status: 'paid', externalRef: 'in_9' }))
      .toEqual({ user_id: 'u1', plan_id: 'pro', amount_cents: 0, currency: 'BRL', status: 'paid', external_ref: 'in_9' })
  })
})
