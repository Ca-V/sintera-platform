// BILLING-001 — carregamento de entitlements (fronteira comercial × módulos).
//
// Os módulos consomem SEMPRE `Entitlements` (contrato estável), nunca as tabelas de plano/assinatura.
// Aqui fica a leitura: assinatura vigente + plano → resolveEntitlements. Ausência/erro → FREE (a
// plataforma nunca quebra por causa do comercial). O gateway de pagamento é canal separado.

import { resolveEntitlements, type Entitlements, type PlanEntitlements, type SubscriptionStatus } from './entitlements'

interface SubRow { plan_id: string; status: string | null }
interface PlanRow { entitlements: PlanEntitlements }

/** Puro: mapeia linhas (assinatura + plano) para o contrato de entitlements. */
export function entitlementsFrom(sub: SubRow | null, plan: PlanRow | null): Entitlements {
  return resolveEntitlements({
    plan: sub?.plan_id ?? 'free',
    status: (sub?.status as SubscriptionStatus | null) ?? null,
    entitlements: plan?.entitlements ?? null,
  })
}

/**
 * Carrega os entitlements do usuário a partir do Supabase. Defensivo: qualquer ausência/erro → FREE.
 * `supabase` tipado de forma frouxa (o projeto usa casts `as any` para tabelas novas fora de types.ts).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadEntitlements(supabase: any, userId: string): Promise<Entitlements> {
  try {
    const { data: sub } = await supabase
      .from('subscriptions').select('plan_id, status').eq('user_id', userId).maybeSingle()
    if (!sub) return resolveEntitlements({}) // sem assinatura → FREE
    const { data: plan } = await supabase
      .from('billing_plans').select('entitlements').eq('id', sub.plan_id).maybeSingle()
    return entitlementsFrom(sub as SubRow, (plan as PlanRow | null) ?? null)
  } catch {
    return resolveEntitlements({}) // erro comercial nunca quebra o módulo
  }
}
