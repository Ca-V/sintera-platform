// FUNC · BILLING-003 §3 — o que um limite de plano pode e não pode fazer.
//
// A CATRACA DESTE ARQUIVO é uma frase: limite se aplica a ACRESCENTAR, nunca a VER o que já está lá.
//
// Uma pessoa no Plus com 500 documentos que para de pagar cai no gratuito, cujo limite é 5. Os outros 495 não
// somem. Não é gentileza — são dados de saúde dela, e condicionar o acesso ao pagamento seria reter
// informação clínica como garantia.
//
// Se algum teste daqui cair, é essa regra que está sendo desfeita.

import { describe, it, expect } from 'vitest'
import {
  avaliarLimite, motivoDoLimite, visivelIndependenteDoPlano,
  LIMITE_PROFISSIONAIS, LIMITE_DOCUMENTOS_PROPRIOS,
  resolveEntitlements, freeEntitlements, type PlanEntitlements,
} from '@sintera/core'

const comLimites = (limits: Record<string, number>) =>
  resolveEntitlements({
    plan: 'teste', status: 'active',
    entitlements: { features: [], limits, modules: [] } as PlanEntitlements,
  })

describe('BILLING-003 §3 · o limite trava o PRÓXIMO, nunca o que existe', () => {
  it('abaixo do teto, pode acrescentar', () => {
    const a = avaliarLimite(comLimites({ [LIMITE_PROFISSIONAIS]: 3 }), LIMITE_PROFISSIONAIS, 2)
    expect(a.podeAcrescentar).toBe(true)
    expect(a.noTeto).toBe(false)
    expect(motivoDoLimite(a, 'profissionais')).toBeNull()
  })

  it('no teto, não acrescenta — e explica com o número', () => {
    const a = avaliarLimite(comLimites({ [LIMITE_PROFISSIONAIS]: 3 }), LIMITE_PROFISSIONAIS, 3)
    expect(a.podeAcrescentar).toBe(false)
    expect(motivoDoLimite(a, 'profissionais')).toMatch(/3 profissionais/)
    expect(motivoDoLimite(a, 'profissionais'), 'limite que só diz não deixa a pessoa sem saída')
      .toMatch(/mude de plano/i)
  })

  it('ACIMA do teto é estado legítimo — acontece quando alguém cai de plano', () => {
    const a = avaliarLimite(comLimites({ [LIMITE_DOCUMENTOS_PROPRIOS]: 5 }), LIMITE_DOCUMENTOS_PROPRIOS, 500)
    expect(a.podeAcrescentar, 'não pode mandar o 501').toBe(false)
    expect(a.atual, 'os 500 continuam contados, não são apagados nem ignorados').toBe(500)
    const m = motivoDoLimite(a, 'documentos')!
    expect(m, 'a pessoa precisa saber que NÃO perdeu nada').toMatch(/continua com acesso a todos/i)
  })

  it('limite ausente = ilimitado, conforme o contrato', () => {
    const a = avaliarLimite(comLimites({}), LIMITE_PROFISSIONAIS, 9999)
    expect(a.limite).toBeNull()
    expect(a.podeAcrescentar).toBe(true)
  })

  it('o plano gratuito de hoje ainda concede tudo — nada foi restringido', () => {
    const a = avaliarLimite(freeEntitlements(), LIMITE_PROFISSIONAIS, 100)
    expect(a.podeAcrescentar, 'o curinga do free ainda vale (passo 3 do BILLING-003 não foi dado)').toBe(true)
  })
})

describe('BILLING-003 §3 · CATRACA — o plano não esconde o que já existe', () => {
  const itens = Array.from({ length: 500 }, (_, i) => i)

  it('a lista sai inteira, qualquer que seja o plano', () => {
    for (const e of [freeEntitlements(), comLimites({ [LIMITE_DOCUMENTOS_PROPRIOS]: 5 })]) {
      expect(visivelIndependenteDoPlano(itens, e), 'o plano não corta a lista').toHaveLength(500)
    }
  })

  it('mesmo com o plano cancelado, que cai no FREE', () => {
    const cancelado = resolveEntitlements({ plan: 'plus', status: 'canceled', entitlements: null })
    expect(visivelIndependenteDoPlano(itens, cancelado)).toHaveLength(500)
    // E o cancelamento não pode ser porta para esconder: a leitura é do dono, não do plano.
    expect(visivelIndependenteDoPlano(itens, cancelado)).toEqual(itens)
  })
})
