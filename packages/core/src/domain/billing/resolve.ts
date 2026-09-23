// @sintera/core — BILLING-001: a parte PURA da leitura de assinatura.
//
// Separada de quem faz IO de propósito. `entitlementsFrom` mapeia linhas (assinatura + plano) para o
// contrato de entitlements sem tocar em rede nem em banco: é a regra, e roda igual na Web, no aplicativo e
// num teste sem infraestrutura. A busca das linhas vive em `@sintera/api-client`.

import { resolveEntitlements, type Entitlements, type PlanEntitlements, type SubscriptionStatus } from './entitlements'

export interface SubRow { plan_id: string; status: string | null }
export interface PlanRow { entitlements: PlanEntitlements }

/**
 * Qual perfil se está consultando. Uma pessoa pode ter DUAS assinaturas — a dela e a da prática
 * profissional (BILLING-003 §2.1, migração 156): `subscriptions` tem chave primária (user_id, escopo).
 *
 * O default é 'pessoal' em toda a cadeia, porque é o que toda leitura existente significa hoje.
 */
export type EscopoAssinatura = 'pessoal' | 'profissional'

// Nome qualificado de propósito: `ESCOPO_PADRAO` sozinho colide com o escopo de VÍNCULO do CARE-003, que é
// outra coisa inteiramente (lista de módulos, não perfil de assinatura). A colisão passou silenciosa pelo
// `export *` do índice e só apareceu num teste — duas constantes diferentes com o mesmo nome público.
export const ESCOPO_ASSINATURA_PADRAO: EscopoAssinatura = 'pessoal'

/** Puro: mapeia linhas (assinatura + plano) para o contrato de entitlements. */
export function entitlementsFrom(sub: SubRow | null, plan: PlanRow | null): Entitlements {
  return resolveEntitlements({
    plan: sub?.plan_id ?? 'free',
    status: (sub?.status as SubscriptionStatus | null) ?? null,
    entitlements: plan?.entitlements ?? null,
  })
}
