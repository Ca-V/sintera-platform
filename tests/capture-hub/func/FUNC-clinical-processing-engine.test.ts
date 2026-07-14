import { describe, it, expect } from 'vitest'
import { routeProcessing, CLINICAL_PROCESSORS } from '@/lib/capture/clinical-processing-engine'
import { identifyClinical } from '@/lib/capture/clinical-identity-registry'

// FUNC — Clinical Processing Engine (CPE, reformula o M5). Roteia a CertifiedCDU (via Identidade Clínica)
// ao processador especializado. Sem processador/identidade → document_only (revisão clínica, não bloqueia).

describe('FUNC · routeProcessing', () => {
  it('laboratório → LaboratoryExtractor (structured)', () => {
    const id = identifyClinical('MATERIAL - SANGUE GLICEMIA RESULTADO: 85 mg/dL VALORES DE REFERÊNCIA: 60 A 99')
    const r = routeProcessing(id)
    expect(r.processor?.clinicalModel).toBe('laboratory')
    expect(r.resultKind).toBe('structured')
    expect(r.review).toBe('none')
  })

  it('mamografia → MammographyExtractor (narrative)', () => {
    const id = identifyClinical('MAMOGRAFIA DIGITAL LORAD crânio-caudal BI-RADS 2 calcificações')
    const r = routeProcessing(id)
    expect(r.processor?.clinicalModel).toBe('mammography')
    expect(r.resultKind).toBe('narrative')
  })

  it('Pentacam → CorneaTomographyExtractor (parametric)', () => {
    const id = identifyClinical('OCULUS Pentacam K1 43 K2 44 Kmax 45 BAD-D 1,2 Pachymetry 540 Belin')
    const r = routeProcessing(id)
    expect(r.processor?.clinicalModel).toBe('corneal-tomography')
    expect(r.resultKind).toBe('parametric')
  })

  it('sem identidade clínica confiável → document_only (revisão clínica, não bloqueia)', () => {
    const id = identifyClinical('documento genérico sem sinais claros')
    const r = routeProcessing(id)
    expect(r.processor).toBeNull()
    expect(r.resultKind).toBeNull()
    expect(r.review).toBe('clinical')
  })

  it('identidade nula → document_only', () => {
    const r = routeProcessing(null)
    expect(r.processor).toBeNull()
    expect(r.review).toBe('clinical')
  })

  it('identidade ambígua → document_only (não escolhe processador; possivelmente N documentos)', () => {
    const r = routeProcessing({
      clinicalType: 'Mamografia', clinicalFamily: 'Imagem — mama', clinicalModel: 'mammography',
      score: 0.8, confidence: 'high', matched: [], ambiguous: true,
    })
    expect(r.processor).toBeNull()
    expect(r.review).toBe('clinical')
  })

  it('identidade com extrator SEM processador registrado → document_only', () => {
    const r = routeProcessing({
      clinicalType: 'Modalidade nova', clinicalFamily: 'X', clinicalModel: 'InexistenteExtractor',
      score: 0.9, confidence: 'high', matched: [], ambiguous: false,
    })
    expect(r.processor).toBeNull()
    expect(r.review).toBe('clinical')
  })

  it('todo extrator do registry de identidade tem processador correspondente (sem órfãos)', () => {
    // Cada modalidade identificável precisa ter para onde ser roteada.
    const extractors = new Set(CLINICAL_PROCESSORS.map(p => p.clinicalModel))
    for (const name of ['laboratory', 'mammography', 'corneal-tomography', 'eeg']) {
      expect(extractors.has(name)).toBe(true)
    }
  })

  it('é DETERMINÍSTICO', () => {
    const id = identifyClinical('ELETROENCEFALOGRAMA ritmo de base alfa hiperventilação')
    expect(JSON.stringify(routeProcessing(id))).toBe(JSON.stringify(routeProcessing(id)))
  })
})
