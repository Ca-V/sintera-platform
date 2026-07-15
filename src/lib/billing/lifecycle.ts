// BILLING-001 — Ciclo de vida da assinatura (máquina de estados PURA, gateway-agnóstica).
//
// O serviço de billing decide o próximo estado a partir de uma AÇÃO; a persistência (tabela
// subscriptions) e o gateway de pagamento ficam FORA (adapters/rotas). Aqui só a regra de
// transição — determinística e testável. Reutiliza SubscriptionStatus do contrato de entitlements.

import type { SubscriptionStatus } from './entitlements'

export type SubscriptionAction =
  | 'subscribe'      // contratar um plano pago → ativa
  | 'start_trial'    // iniciar período de avaliação → trial
  | 'renew'          // renovação bem-sucedida → ativa
  | 'cancel'         // cancelar → cancelada
  | 'suspend'        // suspender (ex.: inadimplência prolongada) → suspensa
  | 'reactivate'     // reativar → ativa
  | 'mark_past_due'  // falha de pagamento → inadimplente

// Estado inicial (sem assinatura) é representado por null. Transições VÁLIDAS a partir de cada
// estado. Uma ação fora do conjunto é rejeitada (protege contra chamadas inconsistentes do gateway).
const TRANSITIONS: Record<SubscriptionAction, { from: (SubscriptionStatus | null)[]; to: SubscriptionStatus }> = {
  subscribe:     { from: [null, 'canceled', 'trial', 'past_due', 'suspended'], to: 'active' },
  start_trial:   { from: [null, 'canceled'], to: 'trial' },
  renew:         { from: ['active', 'trial', 'past_due'], to: 'active' },
  cancel:        { from: ['active', 'trial', 'past_due', 'suspended'], to: 'canceled' },
  suspend:       { from: ['active', 'trial', 'past_due'], to: 'suspended' },
  reactivate:    { from: ['suspended', 'canceled'], to: 'active' },
  mark_past_due: { from: ['active', 'trial'], to: 'past_due' },
}

/** A ação é válida a partir do estado atual? */
export function canApply(current: SubscriptionStatus | null, action: SubscriptionAction): boolean {
  return TRANSITIONS[action]?.from.includes(current ?? null) ?? false
}

/**
 * Aplica a ação e devolve o novo status. Lança se a transição for inválida (o serviço trata o erro;
 * nunca aplica um estado inconsistente). Determinística.
 */
export function applyAction(current: SubscriptionStatus | null, action: SubscriptionAction): SubscriptionStatus {
  const t = TRANSITIONS[action]
  if (!t) throw new Error(`Ação de assinatura desconhecida: ${action}`)
  if (!t.from.includes(current ?? null)) {
    throw new Error(`Transição inválida: ${current ?? 'sem assinatura'} —(${action})→ (não permitido)`)
  }
  return t.to
}

/** Status considerados "com acesso ao plano pago" (espelha a regra de entitlements). */
export function grantsPaidPlan(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trial'
}
