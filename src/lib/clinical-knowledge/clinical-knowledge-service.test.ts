import { describe, it, expect } from 'vitest'
import {
  getClinicalKnowledge,
  getKnowledgeForIdentity,
  toClinicalContext,
  type ClinicalKnowledge,
  type Sourced,
} from './clinical-knowledge-service'
import { KNOWLEDGE_BASE } from './knowledge-base'
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

    it('conceito não curado → null (tratado graciosamente pela UI)', async () => {
      expect(await getClinicalKnowledge({ name: 'Hemograma completo' })).toBeNull()
      expect(await getClinicalKnowledge({})).toBeNull()
    })
  })

  describe('getKnowledgeForIdentity — consome a Clinical Identity', () => {
    it('resolve pelo nome da identidade', async () => {
      const k = await getKnowledgeForIdentity(identity({ name: 'Topografia corneana' }))
      expect(k?.canonicalName.value).toBe('Topografia de córnea')
    })

    it('cai para a modalidade quando o nome não casa', async () => {
      const k = await getKnowledgeForIdentity(identity({ name: 'Exame OCULUS', modality: 'microscopia especular' }))
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
      expect(ctx.sources.length).toBeGreaterThan(0)
      expect(ctx.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('PROVENIÊNCIA OBRIGATÓRIA — invariante da base curada', () => {
    const sourcedFields = (k: ClinicalKnowledge): Sourced<unknown>[] => [
      k.canonicalName, k.description, k.aliases, k.purpose, k.howItWorks, k.measures,
      k.bodySystem, k.whenIndicated, k.suggestedPeriodicity, k.limitations, k.specialty,
      k.evidenceLevel, k.references,
    ]

    it('todo campo de todo entry tem fonte, data (YYYY-MM-DD) e confiança', () => {
      expect(KNOWLEDGE_BASE.length).toBeGreaterThan(0)
      for (const entry of KNOWLEDGE_BASE) {
        for (const f of sourcedFields(entry.knowledge)) {
          expect(f.source.trim().length).toBeGreaterThan(0)
          expect(f.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          expect(['high', 'medium', 'low']).toContain(f.confidence)
        }
        // Referências não podem ser vazias — conteúdo educativo exige fonte (governança).
        expect(entry.knowledge.references.value.length).toBeGreaterThan(0)
      }
    })
  })
})
