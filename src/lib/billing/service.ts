// BILLING-001 — Serviço de assinatura (lógica PURA que o write-path/webhook aplica).
//
// Dado o estado atual e uma AÇÃO do ciclo de vida, produz: (a) a linha de assinatura a persistir e
// (b) o evento de histórico a registrar. Também constrói faturas. Sem IO — a persistência (service
// role) e o gateway (adapter) ficam fora. Reutiliza applyAction (máquina de estados) e o contrato de
// status. Mantém o comercial DESACOPLADO dos módulos.

import { applyAction, type SubscriptionAction } from './lifecycle'
import type { SubscriptionStatus } from './entitlements'

export interface SubscriptionRow { plan_id: string; status: SubscriptionStatus }
export interface SubscriptionEventRow {
  action: SubscriptionAction
  from_status: SubscriptionStatus | null
  to_status: SubscriptionStatus
  plan_id: string
  source: 'system' | 'gateway_webhook' | 'admin'
  external_ref?: string | null
}

/**
 * Calcula a transição: valida a ação (lança se inválida) e devolve a nova linha de assinatura + o
 * evento de histórico correspondente. Determinística; a camada de persistência apenas grava.
 */
export function planTransition(args: {
  current: SubscriptionStatus | null
  action: SubscriptionAction
  planId: string
  source?: SubscriptionEventRow['source']
  externalRef?: string | null
}): { subscription: SubscriptionRow; event: SubscriptionEventRow } {
  const to = applyAction(args.current, args.action)   // lança em transição inválida
  return {
    subscription: { plan_id: args.planId, status: to },
    event: {
      action: args.action,
      from_status: args.current ?? null,
      to_status: to,
      plan_id: args.planId,
      source: args.source ?? 'system',
      ...(args.externalRef != null ? { external_ref: args.externalRef } : {}),
    },
  }
}

export interface InvoiceRow {
  user_id: string
  plan_id: string
  amount_cents: number
  currency: string
  status: 'open' | 'paid' | 'failed' | 'void' | 'refunded'
  external_ref?: string | null
}

/** Constrói uma fatura (cobrança). Valor/plano parametrizados pelo catálogo comercial (depois). */
export function buildInvoice(args: {
  userId: string
  planId: string
  amountCents: number
  currency?: string
  status?: InvoiceRow['status']
  externalRef?: string | null
}): InvoiceRow {
  return {
    user_id: args.userId,
    plan_id: args.planId,
    amount_cents: Math.max(0, Math.round(args.amountCents)),
    currency: args.currency ?? 'BRL',
    status: args.status ?? 'open',
    ...(args.externalRef != null ? { external_ref: args.externalRef } : {}),
  }
}
