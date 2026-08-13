// Clinical Knowledge Service (CAMADA DE CONHECIMENTO CLÍNICO — ADR-CK-001). Responde "o que este exame SIGNIFICA?"
// (finalidade · o que avalia · quando é indicado · estruturas anatômicas · limitações · especialidade · referências
// científicas). Fonte ÚNICA e reutilizável por Web · Mobile · Relatórios · IA Conversacional · Insights — nenhuma
// dessas respostas deve ser construída na interface nem gerada livremente pela IA.
//
// GOVERNANÇA (> que a Terminologia): conteúdo educativo exige revisão clínica + fonte + data + responsável técnico
// (mais perto da linha RDC-657). PubMed/literatura apoiam a CURADORIA, não respondem ao usuário em runtime. Cache
// versionado (o que o usuário viu é reproduzível). PROVENIÊNCIA POR ATRIBUTO (cada campo diz sua origem).
//
// ESTADO: contrato-primeiro. A implementação (LOINC/SNOMED + curadoria) é o backlog C6. O stub abaixo devolve null
// (não há conhecimento curado ainda) — os consumidores já programam contra ESTE contrato, sem quebrar depois.
import type { TerminologyRef } from '@/lib/terminology/terminology-service'

/** Envelope de PROVENIÊNCIA por atributo: valor + origem + versão + confiança + data da última revisão. */
export interface Sourced<T> {
  value: T
  source: string                         // ex.: 'LOINC', 'AAO', 'SBO', 'ESCRS', 'Base SINTERA'
  version: string | null
  confidence: 'high' | 'medium' | 'low'
  lastReviewed: string | null            // YYYY-MM-DD
  curatedBy?: string | null              // responsável técnico da curadoria, quando aplicável
}

/** Objeto padronizado de conhecimento clínico — reutilizado por TODAS as superfícies. */
export interface ClinicalKnowledge {
  canonicalName: Sourced<string>         // origem: LOINC/SNOMED
  aliases: Sourced<string[]>
  purpose: Sourced<string>               // "para que serve?" — origem: diretrizes/sociedades (AAO, ESCRS, SBO…)
  howItWorks: Sourced<string>            // "como funciona?"
  measures: Sourced<string[]>            // "o que avalia?"
  bodySystem: Sourced<string>            // estruturas anatômicas avaliadas
  whenIndicated: Sourced<string>         // "quando é solicitado?"
  limitations: Sourced<string>
  specialty: Sourced<string>
  references: Sourced<string[]>          // fontes científicas (diretrizes; PubMed via CURADORIA, não runtime)
  terminology: TerminologyRef | null     // conceito oficial de origem (quando houver)
}

/** Consulta o conhecimento clínico de um conceito. Contrato público estável; implementação futura (backlog C6).
 *  Enquanto não há entrada curada, devolve null — a interface trata "conhecimento indisponível" graciosamente. */
export async function getClinicalKnowledge(_concept: { code?: string; system?: string; name?: string }): Promise<ClinicalKnowledge | null> {
  // TODO(C6): resolver via cache versionado curado (LOINC/SNOMED + diretrizes) sob governança clínica.
  return null
}
