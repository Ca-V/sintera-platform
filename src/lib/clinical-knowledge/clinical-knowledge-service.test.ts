import { describe, it, expect } from 'vitest'
import {
  getClinicalKnowledge,
  getKnowledgeForConcept,
  getKnowledgeForIdentity,
  toClinicalContext,
  sourced,
  type ClinicalKnowledge,
  type Sourced,
} from './clinical-knowledge-service'
import { BOOTSTRAP_KNOWLEDGE_BASE } from './knowledge-base'
import type { ClinicalIdentity } from '@/lib/clinical-pipeline/contracts'

/** Clinical Identity mínima para exercitar o consumo pelo serviço. */
function identity(over: Partial<ClinicalIdentity>): ClinicalIdentity {
  return {
    resolutionId: 'RES-TEST', name: null, category: null, modality: null, codes: [], aliases: [],
    equipment: null, examDate: null, patientName: null, issuer: null, provisional: true,
    nameSource: 'internal-mapping', basis: [],
    confidence: { attributes: {}, overall: 0.5, autoAcceptable: false },
    ...over,
  }
}

const sourcedFields = (k: ClinicalKnowledge): Sourced<unknown>[] => [
  k.canonicalName, k.description, k.aliases, k.purpose, k.howItWorks, k.measures,
  k.bodySystem, k.whenIndicated, k.suggestedPeriodicity, k.limitations, k.specialty,
  k.evidenceLevel, k.references,
]

describe('Clinical Knowledge Service (C6)', () => {
  describe('getClinicalKnowledge — resolução por nome/alias', () => {
    it('resolve topografia de córnea pelo nome canônico', async () => {
      const k = await getClinicalKnowledge({ name: 'Topografia de córnea' })
      expect(k?.canonicalName.value).toBe('Topografia de córnea')
      expect(k?.specialty.value).toBe('Oftalmologia')
    })

    it('casa por forma normalizada (acentos/caixa/pontuação irrelevantes)', async () => {
      const k = await getClinicalKnowledge({ name: '  TOPOGRAFIA   DA CÓRNEA ' })
      expect(k?.canonicalName.value).toBe('Topografia de córnea')
    })

    it('resolve microscopia especular por alias', async () => {
      const k = await getClinicalKnowledge({ name: 'contagem endotelial' })
      expect(k?.canonicalName.value).toBe('Microscopia especular da córnea')
    })

    it('conceito não curado → null (tratado graciosamente pela plataforma)', async () => {
      expect(await getClinicalKnowledge({ name: 'Hemograma completo' })).toBeNull()
      expect(await getClinicalKnowledge({})).toBeNull()
    })
  })

  describe('consumo pela Clinical Identity / conceito', () => {
    it('getKnowledgeForIdentity resolve pelo nome da identidade', async () => {
      const k = await getKnowledgeForIdentity(identity({ name: 'Topografia corneana' }))
      expect(k?.canonicalName.value).toBe('Topografia de córnea')
    })

    it('cai para a modalidade quando o nome não casa', async () => {
      const k = await getKnowledgeForConcept({ name: 'Exame OCULUS', modality: 'microscopia especular' })
      expect(k?.canonicalName.value).toBe('Microscopia especular da córnea')
    })

    it('identidade sem correspondência → null', async () => {
      expect(await getKnowledgeForIdentity(identity({ name: 'Ressonância de crânio' }))).toBeNull()
    })
  })

  describe('toClinicalContext — projeção no contrato congelado', () => {
    it('achata mantendo fontes agregadas e a revisão mais recente', async () => {
      const k = (await getClinicalKnowledge({ name: 'Topografia de córnea' }))!
      const ctx = toClinicalContext(k)
      expect(ctx.specialty).toBe('Oftalmologia')
      expect(ctx.bodySystem).toContain('Córnea')
      expect(ctx.explanation).toBe(k.description.value)
      expect(ctx.evidenceLevel).toContain('AAO')
      // Fontes agregadas de TODOS os campos (AAO + CBO presentes).
      expect(ctx.sources.some(s => s.includes('AAO'))).toBe(true)
      expect(ctx.sources.some(s => s.includes('CBO'))).toBe(true)
      expect(ctx.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('PROVENIÊNCIA OBRIGATÓRIA + rastreabilidade multi-fonte', () => {
    it('o builder `sourced` lança sem ao menos uma fonte', () => {
      expect(() => sourced('x', { sources: [], confidence: 'high' })).toThrow(/proveni/i)
    })

    it('todo campo de todo entry tem ≥1 fonte com fonte+versão+data(YYYY-MM-DD) e confiança válida', () => {
      expect(BOOTSTRAP_KNOWLEDGE_BASE.length).toBeGreaterThan(0)
      for (const entry of BOOTSTRAP_KNOWLEDGE_BASE) {
        for (const f of sourcedFields(entry.knowledge)) {
          expect(f.sources.length).toBeGreaterThan(0)
          for (const ref of f.sources) {
            expect(ref.source.trim().length).toBeGreaterThan(0)
            expect(ref.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            expect('version' in ref).toBe(true)
          }
          expect(['high', 'medium', 'low']).toContain(f.confidence)
          expect(['single', 'consensus', 'partial']).toContain(f.consensus)
        }
        expect(entry.knowledge.references.value.length).toBeGreaterThan(0)
      }
    })

    it('registra MÚLTIPLAS FONTES (consenso) e CONSENSO PARCIAL', async () => {
      const k = (await getClinicalKnowledge({ name: 'Topografia de córnea' }))!
      // Campo com duas fontes concordantes → consensus 'consensus'.
      expect(k.whenIndicated.sources.length).toBeGreaterThan(1)
      expect(k.whenIndicated.consensus).toBe('consensus')
      // Periodicidade sem consenso de rastreio → registrado como 'partial'.
      expect(k.suggestedPeriodicity.consensus).toBe('partial')
    })
  })
})
