import { describe, it, expect } from 'vitest'
import { identifyClinical } from '@/lib/capture/clinical-identity-registry'

// FUNC — Clinical Identity Registry (5ª etapa). Identifica a modalidade por ENSEMBLE de evidências
// (auditável), não por 1 termo. Casos reais: mamografia, US, Pentacam, EEG, laboratório.

describe('FUNC · identifyClinical', () => {
  it('mamografia por BI-RADS + LORAD + crânio-caudal (não por 1 termo)', () => {
    const r = identifyClinical('MAMOGRAFIA DIGITAL Sistema LORAD Selenia incidência crânio-caudal BI-RADS 2 calcificações')
    expect(r.clinicalType).toBe('Mamografia')
    expect(r.clinicalModel).toBe('mammography')
    expect(r.confidence).toBe('high')
    expect(r.matched.length).toBeGreaterThanOrEqual(3)
  })

  it('Pentacam por OCULUS + Pentacam + BAD-D + K1/K2 (título "tomografia de córnea" nunca aparece)', () => {
    const r = identifyClinical('OCULUS Pentacam K1 43,2 K2 44,1 Kmax 45 BAD-D 1,2 Pachymetry 540 Belin')
    expect(r.clinicalFamily).toBe('Oftalmologia')
    expect(r.clinicalModel).toBe('corneal-tomography')
  })

  it('EEG por eletroencefalograma + ritmo de base + hiperventilação', () => {
    const r = identifyClinical('ELETROENCEFALOGRAMA ritmo de base alfa hiperventilação sem alterações')
    expect(r.clinicalType).toBe('Eletroencefalograma')
    expect(r.clinicalFamily).toBe('Neurofisiologia')
  })

  it('laboratório por MATERIAL/RESULTADO/faixa de referência', () => {
    const r = identifyClinical('MATERIAL - SANGUE GLICEMIA RESULTADO: 85 mg/dL VALORES DE REFERÊNCIA: 60 A 99')
    expect(r.clinicalType).toBe('Laboratorial')
  })

  it('texto sem evidência suficiente → unknown (draft), não inventa', () => {
    const r = identifyClinical('documento genérico sem sinais claros')
    expect(r.clinicalType).toBeNull()
    expect(r.confidence).toBe('low')
  })

  it('LLM/regras: retorna as evidências que casaram (auditável)', () => {
    const r = identifyClinical('ULTRASSONOGRAFIA das mamas modo bidimensional ecotextura heterogênea')
    expect(r.clinicalType).toBe('Ultrassonografia')
    expect(r.matched.length).toBeGreaterThan(0)
  })

  it('ressonância magnética por RM + sequências ponderadas + gadolínio', () => {
    const r = identifyClinical('RESSONÂNCIA MAGNÉTICA RM de crânio sequências ponderadas T2 FLAIR após gadolínio cortes axiais')
    expect(r.clinicalType).toBe('Ressonância magnética')
    expect(r.clinicalModel).toBe('mri')
  })

  it('ecocardiograma por ecocardiograma + fração de ejeção + ventrículo', () => {
    const r = identifyClinical('ECOCARDIOGRAMA fração de ejeção 62% ventrículo esquerdo normal valva mitral')
    expect(r.clinicalType).toBe('Ecocardiograma')
    expect(r.clinicalFamily).toBe('Cardiologia')
  })

  it('anatomopatológico por histopatológico + exame microscópico + biópsia', () => {
    const r = identifyClinical('EXAME ANATOMOPATOLÓGICO exame microscópico de biópsia neoplasia ausente macroscopia')
    expect(r.clinicalType).toBe('Anatomopatológico')
    expect(r.clinicalModel).toBe('pathology')
  })

  it('densitometria óssea por DXA + T-score + coluna lombar', () => {
    const r = identifyClinical('DENSITOMETRIA ÓSSEA DXA T-score -1,8 Z-score coluna lombar fêmur osteopenia')
    expect(r.clinicalType).toBe('Densitometria óssea')
  })

  it('é DETERMINÍSTICA', () => {
    const t = 'MAMOGRAFIA BI-RADS LORAD'
    expect(JSON.stringify(identifyClinical(t))).toBe(JSON.stringify(identifyClinical(t)))
  })
})
