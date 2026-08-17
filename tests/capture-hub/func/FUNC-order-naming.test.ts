import { describe, it, expect } from 'vitest'
import { resolveOrderNaming, deriveDisplayTitle } from '@/lib/capture/document-naming'
import { resolveClinicalIdentity } from '@/lib/clinical-pipeline/clinical-pipeline'
import { parseUnderstanding } from '@/lib/capture/document-understanding'

// FUNC — Complemento do H-10 (#111 → propagação): o nome do PEDIDO (medical_order) é a Clinical Identity
// resolvida pelo pipeline (já com a lateralidade consolidada) e precisa chegar a display_title/type. Este
// arquivo prova a PROPAGAÇÃO (helper puro + cadeia pipeline→nome) e a NÃO-REGRESSão dos demais tipos.

const BILATERAL = 'Doppler colorido venoso de membro inferior — bilateral'
const DOPPLER_COLLAPSED = 'Doppler colorido venoso de membro inferior - unilateral'
const L = `${DOPPLER_COLLAPSED} | Esquerdo (40901483)`
const R = `${DOPPLER_COLLAPSED} | Direito (40901483)`

describe('FUNC · resolveOrderNaming — compõe display_title/type do pedido (puro, sem inferir lateralidade)', () => {
  it('nome bilateral + issuer → display_title = nome; type = nome • issuer', () => {
    const r = resolveOrderNaming(BILATERAL, 'Unimed')
    expect(r.displayTitle).toBe(BILATERAL)
    expect(r.type).toBe(`${BILATERAL} • Unimed`)
  })

  it('sem issuer → type = display_title (sem proveniência)', () => {
    const r = resolveOrderNaming(BILATERAL, null)
    expect(r.displayTitle).toBe(BILATERAL)
    expect(r.type).toBe(BILATERAL)
    expect(resolveOrderNaming(BILATERAL, undefined).type).toBe(BILATERAL)
    expect(resolveOrderNaming(BILATERAL, '  ').type).toBe(BILATERAL)  // issuer vazio → sem proveniência
  })

  it('lado único → propaga aquele lado; NÃO inventa lateralidade (passthrough do identity.name)', () => {
    const esquerdo = 'Doppler colorido venoso de membro inferior — esquerdo'
    expect(resolveOrderNaming(esquerdo, 'Unimed').displayTitle).toBe(esquerdo)
    // Sem lateralidade no nome → permanece sem lateralidade (o helper não acrescenta nada).
    const base = 'Ultrassonografia de parede abdominal'
    expect(resolveOrderNaming(base, null).displayTitle).toBe(base)
    expect(resolveOrderNaming(base, null).displayTitle).not.toMatch(/bilateral|esquerd|direit/i)
  })
})

describe('FUNC · Cadeia pipeline → nome do pedido (o que a rota /analyze passa a persistir)', () => {
  const ctx = { resolutionId: 'RES-TEST-ORD-0001', startedAt: '2026-08-17T00:00:00.000Z', finishedAt: '2026-08-17T00:00:01.000Z' }

  const orderDU = (observations: Array<{ value: string }>) => parseUnderstanding({
    document_type: 'medical_order',
    fields: { exam_name: { value: DOPPLER_COLLAPSED, confidence: 'high' }, issuer: { value: 'Unimed', confidence: 'high' } },
    observations: observations.map(o => ({ type: 'text', label: 'Procedimento Solicitado', value: o.value, confidence: 0.95 })),
  }, 'vision')

  it('pedido com Esquerdo + Direito → display_title BILATERAL + type com proveniência (Unimed)', () => {
    const { identity } = resolveClinicalIdentity(orderDU([{ value: L }, { value: R }]), ctx)
    expect(identity.name).toBe(BILATERAL)                       // #111: consolidação
    const named = resolveOrderNaming(identity.name!, identity.issuer)  // complemento: propagação
    expect(named.displayTitle).toBe(BILATERAL)
    expect(named.displayTitle).not.toMatch(/unilateral/i)
    expect(named.type).toBe(`${BILATERAL} • Unimed`)
  })

  it('pedido com apenas Esquerdo → display_title mantém "esquerdo" (nunca bilateral)', () => {
    const { identity } = resolveClinicalIdentity(orderDU([{ value: L }]), ctx)
    const named = resolveOrderNaming(identity.name!, identity.issuer)
    expect(named.displayTitle).toBe('Doppler colorido venoso de membro inferior — esquerdo')
    expect(named.displayTitle).not.toMatch(/bilateral/i)
  })

  it('preservação: issuer só é sobrescrito com evidência nova; exam_date do pedido permanece null', () => {
    const { identity } = resolveClinicalIdentity(orderDU([{ value: L }, { value: R }]), ctx)
    // A rota faz `if (imageDU?.issuer) finalUpdate.issuer = imageDU.issuer` — sem evidência, o valor atual é preservado.
    expect(resolveOrderNaming(identity.name!, null).type).toBe(BILATERAL)  // sem issuer → não força proveniência
    // exam_date do pedido é null na Clinical Identity (a rota ainda o zera explicitamente em imageIsOrder).
    expect(identity.examDate).toBeNull()
  })
})

describe('FUNC · Não-regressão — o complemento NÃO altera imaging/laboratório', () => {
  it('deriveDisplayTitle (imaging) permanece o nome fiel — caminho de imagem intocado', () => {
    expect(deriveDisplayTitle({
      documentType: 'imaging', documentScope: 'single', examCount: 0,
      singleExamName: 'Ultrassonografia das mamas', modality: 'Ultrassonografia das mamas',
    })).toBe('Ultrassonografia das mamas')
  })

  it('deriveDisplayTitle (laboratório painel) permanece "Exames laboratoriais"', () => {
    expect(deriveDisplayTitle({
      documentType: 'laboratory', documentScope: 'panel', examCount: 3, singleExamName: null,
    })).toBe('Exames laboratoriais')
  })
})
