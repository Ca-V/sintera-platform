import { describe, it, expect } from 'vitest'
import { CLINICAL_IDENTITY_REGISTRY } from '@/lib/capture/clinical-identity-registry'
import { CLINICAL_PROCESSORS } from '@/lib/capture/clinical-processing-engine'

// ARCH — invariante entre camadas (Princípio da Validação entre Camadas): toda modalidade que a Identidade
// Clínica sabe IDENTIFICAR precisa ter, no Clinical Processing Engine, um processador para onde ser ROTEADA.
// Um extrator eleito pela identidade sem processador correspondente seria uma camada deixando a próxima
// órfã. Se falhar: adicione o processador no CPE (ou remova a modalidade do registry de identidade).

describe('ARCH · cobertura Identidade Clínica → Clinical Processing Engine', () => {
  it('todo extrator do Clinical Identity Registry tem um processador no CPE', () => {
    const processors = new Set(CLINICAL_PROCESSORS.map(p => p.extractor))
    const orphans = CLINICAL_IDENTITY_REGISTRY
      .map(m => m.extractor)
      .filter(name => !processors.has(name))
    expect(orphans, `modalidades sem processador no CPE: ${orphans.join(', ')}`).toEqual([])
  })

  it('todo processador do CPE corresponde a uma modalidade conhecida (sem processador morto)', () => {
    const identities = new Set(CLINICAL_IDENTITY_REGISTRY.map(m => m.extractor))
    const dead = CLINICAL_PROCESSORS
      .map(p => p.extractor)
      .filter(name => !identities.has(name))
    expect(dead, `processadores sem modalidade correspondente: ${dead.join(', ')}`).toEqual([])
  })
})
