import { describe, it, expect } from 'vitest'
import { representationFingerprint, isRepresentationCertified } from '@/lib/capture/reproducibility'

// FUNC — Princípio da Reprodutibilidade (constitucional). Trava permanente contra a regressão do
// Pentacam: "Extrair novamente" NÃO pode mudar nome/classificação/resultados. Se este teste falhar,
// alguma evolução reintroduziu o comportamento proibido.

const rep = {
  documentType: 'laboratory',
  documentScope: 'mixed',
  displayTitle: 'Exames laboratoriais',
  results: [
    { name: 'Glicose', value: null, valueText: 'NEGATIVO', unit: null },
    { name: 'Reação (pH)', value: 5.5, unit: null },
    { name: 'Densidade', value: 1.028, unit: null },
  ],
}

describe('FUNC · representationFingerprint', () => {
  it('mesma representação → mesma assinatura', () => {
    expect(representationFingerprint(rep)).toBe(representationFingerprint(rep))
  })

  it('ordem dos resultados NÃO altera a assinatura (canonização)', () => {
    const reordered = { ...rep, results: [...rep.results].reverse() }
    expect(representationFingerprint(reordered)).toBe(representationFingerprint(rep))
  })

  it('ordem-independência mesmo com resultados EMPATADOS em name+value+valueText (unit/faixa diferentes)', () => {
    const tied = {
      documentType: 'laboratory', documentScope: 'panel', displayTitle: 'X',
      results: [
        { name: 'Anticorpo', value: null, valueText: 'REAGENTE', unit: 'UI/mL', referenceMin: 0, referenceMax: 1 },
        { name: 'Anticorpo', value: null, valueText: 'REAGENTE', unit: 'index', referenceMin: 0, referenceMax: 9 },
      ],
    }
    const reversed = { ...tied, results: [...tied.results].reverse() }
    expect(representationFingerprint(reversed)).toBe(representationFingerprint(tied))
  })

  it('mudança de VALOR → assinatura diferente (detecta drift)', () => {
    const changed = {
      ...rep,
      results: rep.results.map(r => (r.name === 'Densidade' ? { ...r, value: 1.018 } : r)),
    }
    expect(representationFingerprint(changed)).not.toBe(representationFingerprint(rep))
  })

  it('mudança de NOME documental → assinatura diferente', () => {
    expect(representationFingerprint({ ...rep, displayTitle: 'Mapeamento ocular' }))
      .not.toBe(representationFingerprint(rep))
  })

  it('mudança de CLASSIFICAÇÃO → assinatura diferente', () => {
    expect(representationFingerprint({ ...rep, documentType: 'ophthalmology' }))
      .not.toBe(representationFingerprint(rep))
  })
})

describe('FUNC · isRepresentationCertified (regra de imutabilidade)', () => {
  it('exame processado + identidade estabelecida = CERTIFICADO (reextração não re-executa)', () => {
    expect(isRepresentationCertified({ previousStatus: 'processed', identityEstablished: true })).toBe(true)
  })

  it('1ª extração (pending) NÃO é certificado — pode extrair', () => {
    expect(isRepresentationCertified({ previousStatus: 'pending', identityEstablished: false })).toBe(false)
  })

  it('exame em erro NÃO é certificado — pode reextrair', () => {
    expect(isRepresentationCertified({ previousStatus: 'error', identityEstablished: true })).toBe(false)
  })

  it('legado processado SEM identidade NÃO é certificado — auto-cura ao reextrair', () => {
    expect(isRepresentationCertified({ previousStatus: 'processed', identityEstablished: false })).toBe(false)
  })
})
