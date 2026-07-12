// ARCH-002 — Convenção de nomenclatura documental (Content Classifier, CAP-002).
//
// Teste ARQUITETURAL reutilizável: vale para TODO adaptador do Capture Hub, não só Exames.
// Nasce do bug real (fundadora 12/07/2026): um painel de sangue+urina do Hermes Pardini foi
// nomeado "IGE Específico para Látex" — um biomarcador representando um documento composto.
//
// Algoritmo validado: classificar → identificar CATEGORIA documental → aplicar convenção.
// O nome vem da categoria + escopo, NÃO apenas da contagem. Suite RÁPIDA (sem IA).

import { describe, it, expect } from 'vitest'
import {
  deriveDisplayTitle,
  classifyExamDocument,
  normalizeModality,
  withProvenance,
  distinctExamNames,
  type DocumentStructure,
} from '@/lib/capture/document-naming'

const lab = (over: Partial<DocumentStructure>): DocumentStructure => ({
  documentType: 'laboratory', documentScope: 'single', examCount: 1, ...over,
})

describe('ARCH-002 · nome dirigido por CATEGORIA + ESCOPO (tabela de domínio)', () => {
  it('painel laboratorial → "Exames laboratoriais" (nunca um biomarcador)', () => {
    expect(deriveDisplayTitle(lab({ documentScope: 'panel', examCount: 7, singleExamName: 'IgE látex' })))
      .toBe('Exames laboratoriais')
  })

  it('documento misto (sangue+urina) → "Exames laboratoriais"', () => {
    expect(deriveDisplayTitle(lab({ documentScope: 'mixed', examCount: 12 }))).toBe('Exames laboratoriais')
  })

  it('hemograma isolado → "Hemograma" (nome do próprio exame)', () => {
    expect(deriveDisplayTitle(lab({ documentScope: 'single', singleExamName: 'Hemograma' }))).toBe('Hemograma')
  })

  it('urina isolada → "Urina tipo I"', () => {
    expect(deriveDisplayTitle(lab({ documentScope: 'single', singleExamName: 'URINA ROTINA' }))).toBe('Urina tipo I')
    expect(deriveDisplayTitle(lab({ documentScope: 'single', singleExamName: 'EAS' }))).toBe('Urina tipo I')
  })

  it('painel com categoria clínica → "Painel {categoria}"', () => {
    expect(deriveDisplayTitle(lab({ documentScope: 'panel', examCount: 4, clinicalCategory: 'hormonal' })))
      .toBe('Painel hormonal')
  })

  it('imagem → modalidade canônica', () => {
    expect(deriveDisplayTitle({ documentType: 'imaging', documentScope: 'single', examCount: 0, modality: 'RM de joelho' }))
      .toBe('Ressonância magnética')
    expect(deriveDisplayTitle({ documentType: 'imaging', documentScope: 'single', examCount: 0, modality: 'TC de tórax' }))
      .toBe('Tomografia computadorizada')
    expect(deriveDisplayTitle({ documentType: 'imaging', documentScope: 'single', examCount: 0, modality: 'US abdome' }))
      .toBe('Ultrassonografia')
  })

  it('tipos fixos por categoria', () => {
    const t = (documentType: DocumentStructure['documentType']) =>
      deriveDisplayTitle({ documentType, documentScope: 'single', examCount: 0 })
    expect(t('anatomopathology')).toBe('Anatomopatológico')
    expect(t('medical_report')).toBe('Relatório médico')
    expect(t('prescription')).toBe('Receita médica')
    expect(t('vaccination')).toBe('Comprovante de vacinação')
    expect(t('attestation')).toBe('Atestado médico')
    expect(t('omics')).toBe('Análise ômica')
    expect(t('unknown')).toBe('Documento')
  })
})

describe('ARCH-002 · normalizeModality', () => {
  it('mapeia sinônimos para o nome canônico', () => {
    expect(normalizeModality('ressonância magnética nuclear')).toBe('Ressonância magnética')
    expect(normalizeModality('tomografia computadorizada de crânio')).toBe('Tomografia computadorizada')
    expect(normalizeModality('ecodoppler de carótidas')).toBe('Ultrassonografia')
    expect(normalizeModality('mamografia digital')).toBe('Mamografia')
    expect(normalizeModality(null)).toBe('Exame de imagem')
    expect(normalizeModality('modalidade rara XYZ')).toBe('modalidade rara XYZ')
  })
})

describe('ARCH-002 · contagem de exames DISTINTOS (não de biomarcadores)', () => {
  it('um hemograma (muitos biomarcadores, mesmo sourceExamName) = 1 exame → "Hemograma completo"', () => {
    const biomarkers = [
      { name: 'Hemoglobina', sourceExamName: 'Hemograma completo' },
      { name: 'Hematócrito', sourceExamName: 'Hemograma completo' },
      { name: 'Leucócitos', sourceExamName: 'Hemograma completo' },
      { name: 'Plaquetas', sourceExamName: 'Hemograma completo' },
    ]
    expect(distinctExamNames(biomarkers)).toEqual(['Hemograma completo'])
    const s = classifyExamDocument({ examType: 'Hemograma', biomarkers })
    expect(s.documentType).toBe('laboratory')
    expect(s.documentScope).toBe('single')
    expect(s.examCount).toBe(1)
    expect(deriveDisplayTitle(s)).toBe('Hemograma completo')
  })
})

describe('ARCH-002 · caso real Hermes Pardini (sangue + urina, vários exames)', () => {
  it('documento composto → "Exames laboratoriais" (regressão do bug "IgE látex")', () => {
    const biomarkers = [
      { name: 'IgE específico para látex', sourceExamName: 'IGE ESPECÍFICO PARA LÁTEX (K82)' },
      { name: 'Hemoglobina', sourceExamName: 'HEMOGRAMA' },
      { name: 'Glicose', sourceExamName: 'GLICOSE - JEJUM' },
      { name: 'Creatinina', sourceExamName: 'CREATININA' },
      { name: 'Densidade', sourceExamName: 'URINA ROTINA' },
    ]
    const s = classifyExamDocument({ examType: 'laboratorial', biomarkers })
    expect(s.documentType).toBe('laboratory')
    expect(s.documentScope).toBe('mixed') // tem sangue + urina
    expect(s.examCount).toBeGreaterThan(1)
    const title = deriveDisplayTitle(s)
    expect(title).toBe('Exames laboratoriais')
    expect(title).not.toMatch(/látex|ige/i)
  })
})

describe('ARCH-002 · enriquecimento opcional de proveniência', () => {
  it('anexa emissora e data em formato BR', () => {
    expect(withProvenance('Exames laboratoriais', { issuer: 'Hermes Pardini', date: '2026-07-12' }))
      .toBe('Exames laboratoriais • Hermes Pardini • 12/07/2026')
  })
  it('sem metadados → título-base limpo', () => {
    expect(withProvenance('Hemograma')).toBe('Hemograma')
  })
})
