// Clinical Knowledge Service (CAMADA DE CONHECIMENTO CLÍNICO — ADR-CK-001). Responde "o que este exame SIGNIFICA?"
// (descrição padronizada · finalidade · quando é indicado · periodicidade · especialidade · órgão/sistema · nível de
// evidência · referências). Fonte ÚNICA e reutilizável por Web · Mobile · Relatórios · IA Conversacional · Insights —
// nenhuma dessas respostas deve ser construída na interface nem gerada livremente pela IA.
//
// GOVERNANÇA (> que a Terminologia): conteúdo educativo exige PROVENIÊNCIA EXPLÍCITA por atributo — fonte(s) +
// versão + data de revisão + (na revisão formal) responsável técnico. RASTREABILIDADE COMPLETA: cada campo lista
// TODAS as fontes que o sustentam; quando há mais de uma fonte ou CONSENSO PARCIAL, isso fica registrado (campo
// `consensus`). Fronteira RDC-657: descreve o EXAME em geral, NUNCA interpreta o resultado da usuária.
//
// C6 (esta implementação): resolve a partir da CLINICAL IDENTITY já produzida (por código oficial quando houver, senão
// por nome/modalidade), contra a base curada (knowledge-base.ts). PREPARADO para consumir Terminology (C7) e Evidence
// (C8) no futuro — mas SEM depender deles hoje. Sem entrada curada → null (a plataforma trata graciosamente).
import type { TerminologyRef } from '@/lib/terminology/terminology-service'
import type { ClinicalIdentity, ClinicalContext } from '@/lib/clinical-pipeline/contracts'
import { findEntry } from './knowledge-base'

/** Uma FONTE identificada que sustenta um valor — fonte + versão + data de revisão + (opcional) a afirmação exata
 *  que ela ancora (útil para registrar consenso PARCIAL: qual fonte sustenta o quê). */
export interface SourceRef {
  source: string                         // ex.: 'AAO', 'CBO', 'ESCRS', 'LOINC', 'Base SINTERA'
  version: string | null                 // versão/edição da fonte ou da curadoria
  lastReviewed: string                   // YYYY-MM-DD — data da revisão (OBRIGATÓRIA)
  statement?: string | null              // o que ESTA fonte especificamente sustenta (consenso parcial)
}

/** Grau de acordo entre as fontes de um atributo: 1 fonte · múltiplas concordantes · consenso PARCIAL/divergência. */
export type Consensus = 'single' | 'consensus' | 'partial'

/** Envelope de PROVENIÊNCIA por atributo: valor + TODAS as fontes + confiança + grau de consenso + responsável. */
export interface Sourced<T> {
  value: T
  sources: SourceRef[]                   // ≥1 — rastreabilidade completa (nunca vazio; garantido pelo builder)
  confidence: 'high' | 'medium' | 'low'
  consensus: Consensus                   // registra "mais de uma fonte" e "consenso parcial"
  curatedBy?: string | null              // responsável técnico (atribuído na revisão clínica formal)
}

/** Entrada do builder de proveniência. `consensus` é derivado do nº de fontes quando omitido; explicite 'partial'
 *  quando o consenso for parcial/houver divergência. */
export interface ProvenanceInput {
  sources: SourceRef[]
  confidence: 'high' | 'medium' | 'low'
  consensus?: Consensus
  curatedBy?: string | null
}

/** Constrói um campo com proveniência OBRIGATÓRIA — lança se não houver ao menos uma fonte (governança). */
export function sourced<T>(value: T, prov: ProvenanceInput): Sourced<T> {
  if (!prov.sources || prov.sources.length === 0) {
    throw new Error('Clinical Knowledge: proveniência obrigatória — todo campo precisa de ao menos uma fonte.')
  }
  const consensus: Consensus = prov.consensus ?? (prov.sources.length > 1 ? 'consensus' : 'single')
  return { value, sources: prov.sources, confidence: prov.confidence, consensus, curatedBy: prov.curatedBy ?? null }
}

/** Objeto padronizado de conhecimento clínico — reutilizado por TODAS as superfícies. Todo campo com PROVENIÊNCIA. */
export interface ClinicalKnowledge {
  canonicalName: Sourced<string>         // nome padronizado do exame
  description: Sourced<string>           // DESCRIÇÃO padronizada ("o que é este exame")
  aliases: Sourced<string[]>
  purpose: Sourced<string>               // FINALIDADE clínica (texto educativo) — "para que serve?"
  howItWorks: Sourced<string>            // "como funciona?"
  measures: Sourced<string[]>            // "o que avalia?"
  bodySystem: Sourced<string>            // órgão/sistema avaliado
  whenIndicated: Sourced<string>         // situações em que é normalmente indicado
  suggestedPeriodicity: Sourced<string>  // periodicidade sugerida (quando houver consenso científico)
  limitations: Sourced<string>
  specialty: Sourced<string>             // especialidade médica relacionada
  evidenceLevel: Sourced<string>         // nível de evidência do conteúdo curado
  references: Sourced<string[]>          // referências bibliográficas / fontes oficiais
  terminology: TerminologyRef | null     // conceito oficial de origem (quando houver — C7)
}

/** Consulta o conhecimento clínico de um conceito (código oficial e/ou nome). Público estável; null quando não curado. */
export async function getClinicalKnowledge(concept: { code?: string; system?: string; name?: string }): Promise<ClinicalKnowledge | null> {
  const entry = findEntry(concept)
  return entry ? entry.knowledge : null
}

/** Resolve por conceito com FALLBACK nome → modalidade (mesma base, chave mais ampla). Não depende de C7/C8. */
export async function getKnowledgeForConcept(c: { code?: string; system?: string; name?: string; modality?: string }): Promise<ClinicalKnowledge | null> {
  const byPrimary = await getClinicalKnowledge({ code: c.code, system: c.system, name: c.name })
  if (byPrimary) return byPrimary
  if (c.modality) return getClinicalKnowledge({ name: c.modality })
  return null
}

/** Ponto de entrada do pipeline: CONSOME a Clinical Identity já produzida — código oficial quando ancorado (C7
 *  futuro) e, na ausência, nome/modalidade. Não depende de Terminology/Evidence para resolver. */
export async function getKnowledgeForIdentity(identity: ClinicalIdentity): Promise<ClinicalKnowledge | null> {
  const official = identity.codes[0] ?? null
  return getKnowledgeForConcept({
    code: official?.code,
    system: official?.system,
    name: identity.name ?? undefined,
    modality: identity.modality ?? undefined,
  })
}

/** Projeta o conhecimento no contrato CONGELADO ClinicalContext (o "O que é este exame?") consumido pela plataforma.
 *  Achata mantendo as FONTES agregadas (de todas as fontes de todos os campos) + a data de revisão mais recente — a
 *  proveniência detalhada por atributo continua no ClinicalKnowledge para quem precisar do rastreio completo. */
export function toClinicalContext(k: ClinicalKnowledge): ClinicalContext {
  const fields: Sourced<unknown>[] = [
    k.canonicalName, k.description, k.aliases, k.purpose, k.howItWorks, k.measures,
    k.bodySystem, k.whenIndicated, k.suggestedPeriodicity, k.limitations, k.specialty,
    k.evidenceLevel, k.references,
  ]
  const allRefs = fields.flatMap(f => f.sources)
  const sources = Array.from(new Set([...allRefs.map(r => r.source), ...k.references.value]))
  const lastReviewed = allRefs.map(r => r.lastReviewed).filter(Boolean).sort().pop() ?? null
  return {
    suggestedPeriodicity: k.suggestedPeriodicity.value,
    specialty: k.specialty.value,
    organ: k.bodySystem.value,
    bodySystem: k.bodySystem.value,
    group: null,
    explanation: k.description.value,
    evidenceLevel: k.evidenceLevel.value,
    sources,
    lastReviewed,
  }
}
