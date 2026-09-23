// BILLING-001 — Entitlements (fronteira ÚNICA entre o comercial e os módulos).
//
// Fundadora: toda a lógica comercial fica num serviço próprio de Billing, DESACOPLADO dos módulos.
// Os módulos NÃO conhecem planos/preços/gateway — só consultam PERMISSÕES (entitlements) por este
// contrato estável: `can(feature)`, `limit(key)`, `hasModule(m)`. Trocar plano/gateway não muda o
// módulo. Camada de DOMÍNIO: pura, determinística, sem IO (o serviço de billing preenche os dados).
//
// Estabilidade Arquitetural: nada de billing existia; este é o contrato mínimo reutilizável. Gateway
// de pagamento é canal separado (adapters), fora deste contrato — o núcleo é gateway-agnóstico.

export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'suspended' | 'canceled'

/** Permissões concretas de um plano (Modelo Aberto: listas de strings, extensíveis sem mudança estrutural). */
export interface PlanEntitlements {
  features: string[]                 // flags habilitadas (ex.: 'reports.share', 'omics')
  limits: Record<string, number>     // limites numéricos (ex.: { exams_per_month: 50 }); ausente = ilimitado
  modules: string[]                  // módulos disponíveis (ex.: 'exames', 'care')
}

/** Contrato que os módulos consomem. Único ponto de acoplamento com o comercial. */
export interface Entitlements {
  plan: string
  status: SubscriptionStatus
  /** O status permite uso pleno do plano (active/trial). Fora disso, cai no plano FREE (degrada, não quebra). */
  active: boolean
  can(feature: string): boolean
  limit(key: string): number | null  // null = sem limite definido (ilimitado)
  hasModule(module: string): boolean
}

/**
 * Plano FREE = base garantida quando NÃO há assinatura ativa. Pré-comercial: concede tudo que a
 * plataforma hoje usa, para que introduzir o Billing NÃO restrinja nada. Quando planos pagos forem
 * configurados, o gating passa a valer a partir daqui. `modules: ['*']` = todos (curinga).
 */
export const FREE_PLAN: PlanEntitlements = {
  features: ['*'],
  limits: {},
  modules: ['*'],
}

const STATUS_GRANTS_PLAN = new Set<SubscriptionStatus>(['active', 'trial'])

/**
 * Resolve as permissões efetivas. Se o status concede o plano (active/trial), usa o plano; senão
 * (past_due/suspended/canceled/sem assinatura) cai no FREE — degrada graciosamente, nunca quebra.
 * Curinga '*' em features/modules concede tudo (usado pelo FREE pré-comercial).
 */
export function resolveEntitlements(args: {
  plan?: string | null
  status?: SubscriptionStatus | null
  entitlements?: PlanEntitlements | null
  freePlan?: PlanEntitlements
}): Entitlements {
  const free = args.freePlan ?? FREE_PLAN
  const status: SubscriptionStatus = args.status ?? 'canceled'
  const grants = STATUS_GRANTS_PLAN.has(status) && !!args.entitlements
  const eff = grants ? (args.entitlements as PlanEntitlements) : free
  return {
    plan: args.plan ?? 'free',
    status,
    active: grants,
    can: (feature) => eff.features.includes('*') || eff.features.includes(feature),
    limit: (key) => (key in eff.limits ? eff.limits[key] : null),
    hasModule: (module) => eff.modules.includes('*') || eff.modules.includes(module),
  }
}

/** Entitlements FREE (sem assinatura) — default seguro para toda a plataforma pré-comercial. */
export function freeEntitlements(): Entitlements {
  return resolveEntitlements({ plan: 'free', status: 'active', entitlements: FREE_PLAN })
}
