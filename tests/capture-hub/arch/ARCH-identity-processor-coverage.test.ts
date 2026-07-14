import { describe, it, expect } from 'vitest'
import { CLINICAL_IDENTITY_REGISTRY } from '@/lib/capture/clinical-identity-registry'
import { CLINICAL_MODELS } from '@/lib/capture/clinical-processors/models'
import { IMPLEMENTED_CLINICAL_MODELS } from '@/lib/capture/clinical-processing-engine'

// ARCH — invariante entre camadas (Validação entre Camadas): toda modalidade que a Identidade Clínica sabe
// IDENTIFICAR precisa ter um MODELO CLÍNICO (estrutura) para onde ser roteada; e todo processador
// implementado preenche um modelo real. Assim identidade → modelo → processador nunca deixa a próxima órfã.

const modelIds = new Set(CLINICAL_MODELS.map(m => m.id))

describe('ARCH · Identidade Clínica → Modelo Clínico → Processador', () => {
  it('todo id eleito pela Identidade Clínica existe como Modelo Clínico', () => {
    const orphans = CLINICAL_IDENTITY_REGISTRY
      .map(m => m.clinicalModel)
      .filter(id => !modelIds.has(id))
    expect(orphans, `identidades sem Modelo Clínico: ${orphans.join(', ')}`).toEqual([])
  })

  it('todo processador implementado preenche um Modelo Clínico existente', () => {
    const dangling = IMPLEMENTED_CLINICAL_MODELS.filter(id => !modelIds.has(id))
    expect(dangling, `processadores sem modelo: ${dangling.join(', ')}`).toEqual([])
  })

  it('ids de modelo são únicos (sem duplicidade no catálogo)', () => {
    const ids = CLINICAL_MODELS.map(m => m.id)
    expect(ids.length).toBe(new Set(ids).size)
  })
})
