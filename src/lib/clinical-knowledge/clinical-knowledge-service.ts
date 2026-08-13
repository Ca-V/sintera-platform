// Clinical Knowledge Service (CAMADA DE CONHECIMENTO CLÍNICO — ADR-CK-001). Responde "o que este exame SIGNIFICA?"
// (descrição padronizada · finalidade · quando é indicado · periodicidade · especialidade · órgão/sistema · nível de
// evidência · referências). Fonte ÚNICA e reutilizável por Web · Mobile · Relatórios · IA Conversacional · Insights —
// nenhuma dessas respostas deve ser construída na interface nem gerada livremente pela IA.
//
// GOVERNANÇA (> que a Terminologia): conteúdo educativo exige FONTE + DATA + (na revisão formal) responsável técnico —
// mais perto da linha RDC-657. PROVENIÊNCIA POR ATRIBUTO OBRIGATÓRIA: cada campo diz sua origem/versão/confiança/data.
// Fronteira: descreve o EXAME em geral, NUNCA interpreta o resultado da usuária.
//
// C6 (esta implementação): resolve a partir da CLINICAL IDENTITY já produzida (por código oficial quando houver, senão
// por nome/modalidade), contra a base curada (knowledge-base.ts). PREPARADO para, no futuro, consumir Terminology (C7)
// e Evidence (C8) — mas SEM depender deles para funcionar hoje. Sem entrada curada → null (a UI trata graciosamente).
import type { TerminologyRef } from '@/lib/terminology/terminology-service'
import type { ClinicalIdentity, ClinicalContext } from '@/lib/clinical-pipeline/contracts'
import { findEntry } from './knowledge-base'

/** PROVENIÊNCIA de um atributo — origem + versão + confiança + data de revisão + (quando houver) responsável técnico. */
export interface Provenance {
  source: string                         // ex.: 'LOINC', 'AAO', 'CBO', 'ESCRS', 'Base SINTERA'
  version: string | null
  confidence: 'high' | 'medium' | 'low'
  lastReviewed: string                   // YYYY-MM-DD — data da curadoria/revisão (OBRIGATÓRIA)
  curatedBy?: string | null              // responsável técnico da curadoria (atribuído na revisão clínica formal)
}

/** Envelope de PROVENIÊNCIA por atributo: valor + origem + versão + confiança + data da última revisão. */
export interface Sourced<T> {
  value: T
  source: string
  version: string | null
  confidence: 'high' | 'medium' | 'low'
  lastReviewed: string | null            // YYYY-MM-DD
  curatedBy?: string | null
}

/** Objeto padronizado de conhecimento clínico — reutilizado por TODAS as superfícies. Todo campo com PROVENIÊNCIA. */
export interface ClinicalKnowledge {
  canonicalName: Sourced<string>         // nome padronizado do exame — origem: terminologia/sociedade
  description: Sourced<string>           // DESCRIÇÃO padronizada ("o que é este exame")
  aliases: Sourced<string[]>
  purpose: Sourced<string>               // FINALIDADE clínica (texto educativo) — "para que serve?"
  howItWorks: Sourced<string>            // "como funciona?"
  measures: Sourced<string[]>            // "o que avalia?"
  bodySystem: Sourced<string>            // órgão/sistema avaliado
  whenIndicated: Sourced<string>         // "quando é normalmente indicado?"
  suggestedPeriodicity: Sourced<string>  // periodicidade sugerida (quando houver consenso)
  limitations: Sourced<string>
  specialty: Sourced<string>             // especialidade relacionada
  evidenceLevel: Sourced<string>         // nível de evidência do conteúdo curado
  references: Sourced<string[]>          // referências bibliográficas / fontes oficiais
  terminology: TerminologyRef | null     // conceito oficial de origem (quando houver — C7)
}

/** Consulta o conhecimento clínico de um conceito (código oficial e/ou nome). Público estável; null quando não curado. */
export async function getClinicalKnowledge(concept: { code?: string; system?: string; name?: string }): Promise<ClinicalKnowledge | null> {
  const entry = findEntry(concept)
  return entry ? entry.knowledge : null
}

/** Ponto de entrada do pipeline: CONSOME a Clinical Identity já produzida. Usa o código oficial quando ancorado
 *  (C7 futuro) e, na ausência, o nome/aliases/modalidade — não depende de Terminology/Evidence para resolver. */
export async function getKnowledgeForIdentity(identity: ClinicalIdentity): Promise<ClinicalKnowledge | null> {
  const official = identity.codes[0] ?? null
  // Tenta por código; senão pelo nome e, como reforço, pela modalidade (mesma base, chave mais ampla).
  const byPrimary = await getClinicalKnowledge({
    code: official?.code,
    system: official?.system,
    name: identity.name ?? undefined,
  })
  if (byPrimary) return byPrimary
  if (identity.modality) return getClinicalKnowledge({ name: identity.modality })
  return null
}

/** Projeta o conhecimento no contrato CONGELADO ClinicalContext (o "O que é este exame?") consumido pela plataforma.
 *  Achata mantendo as FONTES agregadas + a data de revisão mais recente — a proveniência por atributo continua no
 *  ClinicalKnowledge para quem precisar do detalhe. */
export function toClinicalContext(k: ClinicalKnowledge): ClinicalContext {
  const fields: Sourced<unknown>[] = [
    k.canonicalName, k.description, k.aliases, k.purpose, k.howItWorks, k.measures,
    k.bodySystem, k.whenIndicated, k.suggestedPeriodicity, k.limitations, k.specialty,
    k.evidenceLevel, k.references,
  ]
  const sources = Array.from(new Set([...fields.map(f => f.source), ...k.references.value]))
  const lastReviewed = fields
    .map(f => f.lastReviewed)
    .filter((d): d is string => !!d)
    .sort()
    .pop() ?? null
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
