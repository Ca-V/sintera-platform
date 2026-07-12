// ARCH-002 — Convenção de nomenclatura documental (Content Classifier, CAP-002).
//
// Teste ARQUITETURAL reutilizável: vale para TODO adaptador do Capture Hub, não só Exames.
// Nasce do bug real relatado pela fundadora (12/07/2026): um painel de sangue+urina do
// laboratório Hermes Pardini foi nomeado "IgE específico para látex" — um único biomarcador
// representando um documento composto. A regra: o nome representa o DOCUMENTO, nunca um
// resultado interno; a IA descreve estrutura, o domínio aplica nome determinístico.
//
// Suite RÁPIDA (sem IA) — deve rodar em todo PR.

import { describe, it, expect } from 'vitest'
import {
  deriveDisplayTitle,
  classifyExamDocument,
  withProvenance,
  distinctExamNames,
} from '@/lib/capture/document-naming'

describe('ARCH-002 · nomenclatura determinística por estrutura', () => {
  it('exame único → nome do próprio exame', () => {
    expect(deriveDisplayTitle({ documentType: 'laboratory_single', examCount: 1, singleExamName: 'TSH' }))
      .toBe('TSH')
  })

  it('painel (vários exames) → "Exames laboratoriais", NUNCA um biomarcador', () => {
    expect(deriveDisplayTitle({ documentType: 'laboratory_panel', examCount: 7, singleExamName: 'IgE específico para látex' }))
      .toBe('Exames laboratoriais')
  })

  it('examCount > 1 sobrepõe qualquer singleExamName (regra do conjunto)', () => {
    expect(deriveDisplayTitle({ documentType: 'laboratory_single', examCount: 3, singleExamName: 'Glicose' }))
      .toBe('Exames laboratoriais')
  })

  it('imagem → modalidade', () => {
    expect(deriveDisplayTitle({ documentType: 'imaging', examCount: 0, modality: 'Ressonância magnética do joelho' }))
      .toBe('Ressonância magnética do joelho')
  })

  it('imagem sem modalidade → rótulo neutro', () => {
    expect(deriveDisplayTitle({ documentType: 'imaging', examCount: 0 }))
      .toBe('Exame de imagem')
  })

  it('urina isolada → "Exame de urina"', () => {
    expect(deriveDisplayTitle({ documentType: 'laboratory_urine', examCount: 1, singleExamName: 'EAS' }))
      .toBe('Exame de urina')
  })

  it('tipos fixos: receita, relatório, anatomopatológico, vacinação, atestado', () => {
    expect(deriveDisplayTitle({ documentType: 'prescription', examCount: 0 })).toBe('Receita médica')
    expect(deriveDisplayTitle({ documentType: 'medical_report', examCount: 0 })).toBe('Relatório médico')
    expect(deriveDisplayTitle({ documentType: 'anatomopathology', examCount: 0 })).toBe('Anatomopatológico')
    expect(deriveDisplayTitle({ documentType: 'vaccination', examCount: 0 })).toBe('Comprovante de vacinação')
    expect(deriveDisplayTitle({ documentType: 'attestation', examCount: 0 })).toBe('Atestado médico')
  })

  it('sem estrutura → rótulo neutro, jamais um resultado interno', () => {
    expect(deriveDisplayTitle({ documentType: 'unknown', examCount: 0 })).toBe('Documento')
  })
})

describe('ARCH-002 · contagem de exames DISTINTOS (não de biomarcadores)', () => {
  it('um hemograma (muitos biomarcadores, mesmo sourceExamName) conta como 1 exame', () => {
    const biomarkers = [
      { name: 'Hemoglobina', sourceExamName: 'Hemograma completo' },
      { name: 'Hematócrito', sourceExamName: 'Hemograma completo' },
      { name: 'Leucócitos', sourceExamName: 'Hemograma completo' },
      { name: 'Plaquetas', sourceExamName: 'Hemograma completo' },
    ]
    expect(distinctExamNames(biomarkers)).toEqual(['Hemograma completo'])
    const s = classifyExamDocument({ examType: 'Hemograma', biomarkers })
    expect(s.examCount).toBe(1)
    expect(deriveDisplayTitle(s)).toBe('Hemograma completo')
  })
})

describe('ARCH-002 · caso real Hermes Pardini (sangue + urina, vários exames)', () => {
  it('documento composto → "Exames laboratoriais" (regressão do bug "IgE látex")', () => {
    const biomarkers = [
      { name: 'IgE específico para látex', sourceExamName: 'IgE específico - Látex' },
      { name: 'Hemoglobina', sourceExamName: 'Hemograma completo' },
      { name: 'Glicose', sourceExamName: 'Glicemia de jejum' },
      { name: 'Colesterol total', sourceExamName: 'Colesterol total' },
      { name: 'Densidade', sourceExamName: 'Exame de urina (EAS)' },
    ]
    const s = classifyExamDocument({ examType: 'laboratorial', biomarkers })
    expect(s.documentType).toBe('laboratory_panel')
    expect(s.examCount).toBeGreaterThan(1)
    const title = deriveDisplayTitle(s)
    expect(title).toBe('Exames laboratoriais')
    expect(title).not.toContain('látex')
    expect(title).not.toContain('IgE')
  })
})

describe('ARCH-002 · enriquecimento opcional de proveniência', () => {
  it('anexa emissora e data em formato BR', () => {
    expect(withProvenance('Exames laboratoriais', { issuer: 'Hermes Pardini', date: '2026-07-12' }))
      .toBe('Exames laboratoriais • Hermes Pardini • 12/07/2026')
  })
  it('sem metadados → título-base limpo', () => {
    expect(withProvenance('TSH')).toBe('TSH')
  })
})
