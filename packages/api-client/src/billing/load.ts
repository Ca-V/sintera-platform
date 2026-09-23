// @sintera/api-client — BILLING-001: busca a assinatura vigente e devolve o contrato de entitlements.
//
// POR QUE MUDOU DE LUGAR (BILLING-002 passo 1, 22/09/2026). Isto vivia em `src/lib/billing/`, que é Web-only.
// O aplicativo não alcança `src/`, e portanto não conseguia nem EXIBIR o estado da assinatura da pessoa —
// nem sequer dizer "seu plano é o Evolução". Continuar ali levaria à segunda cópia do mesmo conceito, que é
// exatamente o defeito que o ADR-023 nomeia e que já custou três PRs no campo de telefone.
//
// A REGRA continua no core (`@sintera/core`, domain/billing). Aqui fica só o IO: quais linhas buscar.
//
// Convenção desta camada: NÃO lança. Qualquer ausência ou erro cai em FREE — o comercial nunca quebra o
// módulo. Mas "cair em FREE" tem consequência de produto (BILLING-003 §2.2), então a degradação é silenciosa
// para a UI e precisa ser visível no log de quem investiga.

import {
  resolveEntitlements, entitlementsFrom, ESCOPO_ASSINATURA_PADRAO,
  type Entitlements, type EscopoAssinatura, type SubRow, type PlanRow,
} from '@sintera/core'

/**
 * Carrega os entitlements de um perfil da pessoa. `escopo` distingue a assinatura pessoal da profissional —
 * sem ele, `maybeSingle()` sobre duas linhas devolveria erro e as DUAS assinaturas cairiam em FREE.
 *
 * `supabase` tipado de forma frouxa: o projeto usa casts para tabelas fora de types.ts.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadEntitlements(
  supabase: any, userId: string, escopo: EscopoAssinatura = ESCOPO_ASSINATURA_PADRAO,
): Promise<Entitlements> {
  try {
    const { data: sub } = await supabase
      .from('subscriptions').select('plan_id, status')
      .eq('user_id', userId).eq('escopo', escopo).maybeSingle()
    if (!sub) return resolveEntitlements({}) // sem assinatura naquele escopo → FREE
    const { data: plan } = await supabase
      .from('billing_plans').select('entitlements').eq('id', sub.plan_id).maybeSingle()
    return entitlementsFrom(sub as SubRow, (plan as PlanRow | null) ?? null)
  } catch {
    return resolveEntitlements({}) // erro comercial nunca quebra o módulo
  }
}
