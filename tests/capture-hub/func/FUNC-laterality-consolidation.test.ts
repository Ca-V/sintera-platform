import { describe, it, expect } from 'vitest'
import { consolidateLaterality, stripToBase } from '@/lib/clinical-pipeline/laterality'
import { resolveClinicalIdentity } from '@/lib/clinical-pipeline/clinical-pipeline'
import { parseUnderstanding } from '@/lib/capture/document-understanding'
import type { Observation } from '@/lib/capture/document-understanding'

// FUNC — Consolidação de LATERALIDADE (H-10). REPRESENTAÇÃO estrutural sobre observações do próprio documento:
// procedimentos com lados complementares (Esquerdo + Direito) ⇒ bilateral. NUNCA replace textual; a evidência
// (obs-N) permanece intacta; isolamento por documento. Caso real: pedido ab5b5816 (TUSS 40901483 × 2 lados).

let seq = 0
const obs = (value: string, over: Partial<Observation> = {}): Observation => ({
  id: `obs-${++seq}`, type: 'text', value, label: 'Procedimento Solicitado',
  region: 'corpo', bbox: null, page: null, confidence: 0.95, detector: 'vision', ...over,
})

const DOPPLER = 'Doppler colorido venoso de membro inferior - unilateral'
const L = (t: string) => `${t} | Esquerdo (40901483)`
const R = (t: string) => `${t} | Direito (40901483)`

describe('FUNC · Consolidação de lateralidade — casos de aceite (H-10)', () => {
  it('mesmo procedimento + Esquerdo + Direito → bilateral (caso ab5b5816)', () => {
    const r = consolidateLaterality(DOPPLER, [obs(L(DOPPLER)), obs(R(DOPPLER))])
    expect(r?.laterality).toBe('bilateral')
    expect(r?.name).toBe('Doppler colorido venoso de membro inferior — bilateral')
    expect(r?.sides).toEqual(['esquerdo', 'direito'])
  })

  it('mesmo procedimento + apenas Esquerdo → esquerdo (não vira bilateral)', () => {
    const r = consolidateLaterality(DOPPLER, [obs(L(DOPPLER))])
    expect(r?.laterality).toBe('esquerdo')
    expect(r?.name).toBe('Doppler colorido venoso de membro inferior — esquerdo')
  })

  it('mesmo procedimento + apenas Direito → direito', () => {
    const r = consolidateLaterality(DOPPLER, [obs(R(DOPPLER))])
    expect(r?.laterality).toBe('direito')
    expect(r?.name).toBe('Doppler colorido venoso de membro inferior — direito')
  })

  it('mesmo procedimento repetido SEM lateralidade → não infere (nome inalterado)', () => {
    const line = 'Hemograma completo (40304361)'
    expect(consolidateLaterality('Hemograma completo', [obs(line), obs(line)])).toBeNull()
  })

  it('procedimentos DIFERENTES, um Esquerdo e outro Direito → NÃO consolida como bilateral', () => {
    const mama = 'Ultrassonografia de mama'
    const abdome = 'Ultrassonografia de abdome'
    const r = consolidateLaterality(mama, [
      obs(`${mama} | Esquerdo (11111111)`),
      obs(`${abdome} | Direito (22222222)`),
    ])
    expect(r?.laterality).not.toBe('bilateral')   // procedimentos distintos = grupos distintos
    expect(r?.laterality).toBe('esquerdo')        // resolve só o procedimento correspondente ao nome
  })

  it('"unilateral" no texto-fonte + Esq/Dir → remove "unilateral" da REPRESENTAÇÃO; preserva na evidência', () => {
    const evL = obs(L(DOPPLER)); const evR = obs(R(DOPPLER))
    const r = consolidateLaterality(DOPPLER, [evL, evR])
    expect(r?.name).not.toMatch(/unilateral/i)                 // representação consolidada limpa
    expect(r?.observationIds).toEqual([evL.id, evR.id])        // lados rastreáveis nas observações originais
    expect(evL.value).toMatch(/unilateral \| Esquerdo/i)       // observação NÃO é mutada (evidência intacta)
  })

  it('genérico (não-Doppler): RM de joelho Esq + Dir → bilateral (regra não é específica do Doppler)', () => {
    const rm = 'Ressonância magnética de joelho'
    const r = consolidateLaterality(rm, [
      obs(`${rm} | Esquerdo (33333333)`),
      obs(`${rm} | Direito (33333333)`),
    ])
    expect(r?.laterality).toBe('bilateral')
    expect(r?.name).toBe('Ressonância magnética de joelho — bilateral')
  })

  it('ISOLAMENTO por documento: pedido bilateral NÃO contamina laudo unilateral esquerdo (chamadas separadas)', () => {
    // Pedido (documento A): dois lados → bilateral.
    const pedido = consolidateLaterality(DOPPLER, [obs(L(DOPPLER)), obs(R(DOPPLER))])
    expect(pedido?.laterality).toBe('bilateral')
    // Laudo (documento B): apenas Esquerdo. A função é pura sobre as observações RECEBIDAS — sem vazamento.
    const laudo = consolidateLaterality('Doppler venoso de membro inferior', [
      obs('Doppler venoso de membro inferior esquerdo (40901483)'),
    ])
    expect(laudo?.laterality).toBe('esquerdo')
  })

  it('documento sem procedimentos lateralizados (laboratório) → inalterado (null)', () => {
    expect(consolidateLaterality('Hemograma completo', [
      obs('Leucócitos 6.500', { type: 'text', label: null }),
      obs('Hemoglobina 14.2', { type: 'text', label: null }),
    ])).toBeNull()
    expect(consolidateLaterality('Hemograma completo', [])).toBeNull()
    expect(consolidateLaterality(null, [obs(L(DOPPLER))])).toBeNull()
  })

  it('não confunde termos anatômicos com lados (Lateral/Medial/Anterior/Posterior ≠ left/right)', () => {
    // Observações de um laudo de US com planos anatômicos — NENHUM lado esquerdo/direito real.
    expect(consolidateLaterality('Ultrassom', [
      obs('Lateral', { label: null }), obs('Medial', { label: null }),
      obs('Anterior', { label: null }), obs('Posterior', { label: null }),
    ])).toBeNull()
  })
})

describe('FUNC · stripToBase — remove lado, código e qualificador (casing preservado)', () => {
  it('remove "| Esquerdo", "(TUSS)" e "unilateral"', () => {
    expect(stripToBase(L(DOPPLER))).toBe('Doppler colorido venoso de membro inferior')
    expect(stripToBase(R(DOPPLER))).toBe('Doppler colorido venoso de membro inferior')
    expect(stripToBase(DOPPLER)).toBe('Doppler colorido venoso de membro inferior')
  })
})

describe('FUNC · Pipeline — lateralidade consolidada na Clinical Identity + Decision Log (evidência intacta)', () => {
  const ctx = { resolutionId: 'RES-TEST-LAT-0001', startedAt: '2026-08-17T00:00:00.000Z', finishedAt: '2026-08-17T00:00:01.000Z' }

  it('pedido com obs Esquerdo+Direito → identity.name bilateral; passo "laterality"; observações preservadas', () => {
    const du = parseUnderstanding({
      document_type: 'medical_order',
      fields: { exam_name: { value: DOPPLER, confidence: 'high' } },
      observations: [
        { type: 'text', label: 'Procedimento Solicitado', value: L(DOPPLER), confidence: 0.95 },
        { type: 'text', label: 'Procedimento Solicitado', value: R(DOPPLER), confidence: 0.95 },
      ],
    }, 'vision')

    const { identity, audit } = resolveClinicalIdentity(du, ctx)

    expect(identity.name).toBe('Doppler colorido venoso de membro inferior — bilateral')
    expect(identity.name).not.toMatch(/unilateral/i)

    const step = audit.pipeline.decisionLog.find(s => s.detector === 'laterality')
    expect(step?.status).toBe('consolidated')
    expect(step?.output).toBe('Doppler colorido venoso de membro inferior — bilateral')
    expect(step?.reason).toMatch(/esquerdo \+ direito/i)
    expect(step?.reason).toMatch(/obs-1, obs-2/)   // lados preservados nas observações (rastreável)

    // Evidência intacta: as duas linhas com os lados continuam nas observações do audit.
    const vals = (audit.due?.observations ?? []).map(o => o.value)
    expect(vals.some(v => /\| Esquerdo/i.test(v))).toBe(true)
    expect(vals.some(v => /\| Direito/i.test(v))).toBe(true)
  })

  it('documento sem lados complementares → nome do mapping inalterado; sem passo "laterality"', () => {
    const du = parseUnderstanding({
      document_type: 'laboratory',
      fields: { exam_name: { value: 'Hemograma completo', confidence: 'high' } },
    }, 'vision')
    const { identity, audit } = resolveClinicalIdentity(du, ctx)
    expect(identity.name).toBe('Hemograma completo')
    expect(audit.pipeline.decisionLog.some(s => s.detector === 'laterality')).toBe(false)
  })
})
