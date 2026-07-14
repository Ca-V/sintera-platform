import { describe, it, expect } from 'vitest'
import { routeProcessing } from '@/lib/capture/clinical-processing-engine'
import { CLINICAL_MODELS } from '@/lib/capture/clinical-processors/models'
import { identifyClinical } from '@/lib/capture/clinical-identity-registry'

// FUNC — Clinical Processing Engine. routeProcessing(identity) → MODELO CLÍNICO (estrutura). Sem
// modelo/identidade → document_only (revisão clínica, não bloqueia). O modelo descreve; o processador preenche.

describe('FUNC · routeProcessing', () => {
  it('laboratório → modelo laboratory (structured)', () => {
    const id = identifyClinical('MATERIAL - SANGUE GLICEMIA RESULTADO: 85 mg/dL VALORES DE REFERÊNCIA: 60 A 99')
    const r = routeProcessing(id)
    expect(r.model?.id).toBe('laboratory')
    expect(r.resultKind).toBe('structured')
    expect(r.review).toBe('none')
  })

  it('mamografia → modelo mammography (narrative)', () => {
    const id = identifyClinical('MAMOGRAFIA DIGITAL LORAD crânio-caudal BI-RADS 2 calcificações')
    const r = routeProcessing(id)
    expect(r.model?.id).toBe('mammography')
    expect(r.resultKind).toBe('narrative')
  })

  it('Pentacam → modelo corneal-tomography (parametric)', () => {
    const id = identifyClinical('OCULUS Pentacam K1 43 K2 44 Kmax 45 BAD-D 1,2 Pachymetry 540 Belin')
    const r = routeProcessing(id)
    expect(r.model?.id).toBe('corneal-tomography')
    expect(r.resultKind).toBe('parametric')
  })

  it('sem identidade clínica confiável → document_only (revisão clínica, não bloqueia)', () => {
    const id = identifyClinical('documento genérico sem sinais claros')
    const r = routeProcessing(id)
    expect(r.model).toBeNull()
    expect(r.resultKind).toBeNull()
    expect(r.review).toBe('clinical')
  })

  it('identidade nula → document_only', () => {
    const r = routeProcessing(null)
    expect(r.model).toBeNull()
    expect(r.review).toBe('clinical')
  })

  it('identidade ambígua → document_only (não escolhe modelo; possivelmente N documentos)', () => {
    const r = routeProcessing({
      clinicalType: 'Mamografia', clinicalFamily: 'Imagem — mama', clinicalModel: 'mammography',
      score: 0.8, confidence: 'high', matched: [], ambiguous: true,
    })
    expect(r.model).toBeNull()
    expect(r.review).toBe('clinical')
  })

  it('identidade com id SEM modelo registrado → document_only', () => {
    const r = routeProcessing({
      clinicalType: 'Modalidade nova', clinicalFamily: 'X', clinicalModel: 'inexistente',
      score: 0.9, confidence: 'high', matched: [], ambiguous: false,
    })
    expect(r.model).toBeNull()
    expect(r.review).toBe('clinical')
  })

  it('todos os modelos têm resultKind e id kebab (catálogo consistente)', () => {
    for (const m of CLINICAL_MODELS) {
      expect(['structured', 'narrative', 'parametric']).toContain(m.resultKind)
      expect(m.id).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('é DETERMINÍSTICO', () => {
    const id = identifyClinical('ELETROENCEFALOGRAMA ritmo de base alfa hiperventilação')
    expect(JSON.stringify(routeProcessing(id))).toBe(JSON.stringify(routeProcessing(id)))
  })
})
