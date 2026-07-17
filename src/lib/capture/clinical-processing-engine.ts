// Clinical Processing Engine (CPE) — o MECANISMO ÚNICO de processamento clínico (reformula o M5).
//
// Fundadora (13/07): não há N extratores soltos — há UM motor com PROCESSADORES ESPECIALIZADOS por
// MODELO CLÍNICO. Todos consomem o MESMO contrato de entrada (CertifiedCDU, nunca um PDF) e cada um produz o
// MODELO DE RESULTADO próprio da sua modalidade (biomarcador ≠ achado ≠ parâmetro por região).
//
// FACHADA ÚNICA (o `analyze` conhece SÓ isto): `processClinical(cdu)` → a Identidade Clínica seleciona o
// MODELO CLÍNICO e, só então, o processador correspondente. O `analyze` permanece TOTALMENTE desacoplado das
// modalidades — não conhece Pentacam, mamografia, EEG… só o Engine. Os modelos organizam-se por MODALIDADE,
// não por fabricante (Pentacam/Galilei/Orbscan → o mesmo modelo `corneal-tomography`).
//
// Princípios: CEF §4.0 — modalidade SEM processador → `document_only` (revisão CLÍNICA, NÃO bloqueia;
// preserva o documento). Identidade ambígua/baixa confiança → não escolhe modelo (document_only), não
// inventa. Nenhuma camada compensa a anterior: o Engine confia na Identidade Clínica.

import { identifyClinical, type ClinicalIdentity } from './clinical-identity-registry'
import { runCornealTomography } from './clinical-processors/corneal-tomography'
import { runBioimpedance } from './clinical-processors/bioimpedance'
import { getClinicalModel } from './clinical-processors/models'
import { validateRepresentation, type RepresentationVerdict } from './representation-validator'
import type { CertifiedCDU, ClinicalModel, ClinicalProcessorFn, ProcessorResult, ResultKind } from './clinical-processors/types'

export type { ResultKind } from './clinical-processors/types'

/** Revisão a jusante do processamento (não confundir com a revisão TÉCNICA da Identidade Documental). */
export type ProcessingReview = 'none' | 'clinical'

export interface ProcessingRoute {
  /** MODELO CLÍNICO (estrutura da modalidade) escolhido, ou null quando não há estrutura conhecida. */
  model: ClinicalModel | null
  /** Forma esperada do resultado (do modelo; null quando document_only). */
  resultKind: ResultKind | null
  /** 'clinical' quando não há modelo/estrutura (segue como document_only, sem bloquear). */
  review: ProcessingReview
  /** Motivo auditável do roteamento. */
  reason: string
}

/**
 * Roteia uma CertifiedCDU (via a sua Identidade Clínica) ao seu MODELO CLÍNICO (estrutura). Puro/determinístico.
 * NÃO conhece a implementação (processador) — só a estrutura. Sem identidade confiável/ambígua/sem modelo →
 * `document_only` (revisão CLÍNICA, não bloqueia). Nunca força — melhor preservar o documento que inventar.
 */
export function routeProcessing(identity: ClinicalIdentity | null | undefined): ProcessingRoute {
  if (!identity || !identity.clinicalType || !identity.clinicalModel || identity.confidence === 'low') {
    return { model: null, resultKind: null, review: 'clinical',
      reason: 'sem identidade clínica confiável → document_only (preserva o documento; revisão clínica)' }
  }
  if (identity.ambiguous) {
    return { model: null, resultKind: null, review: 'clinical',
      reason: 'identidade clínica ambígua (2+ modalidades fortes) → document_only; possivelmente N documentos (Segmentação)' }
  }
  const model = getClinicalModel(identity.clinicalModel)
  if (!model) {
    return { model: null, resultKind: null, review: 'clinical',
      reason: `modalidade "${identity.clinicalType}" identificada, mas sem MODELO CLÍNICO (${identity.clinicalModel}) → document_only` }
  }
  return { model, resultKind: model.resultKind, review: 'none',
    reason: `roteado ao modelo ${model.id} (${model.resultKind}) — contrato ${model.contractVersion}` }
}

// ── Executor: Identidade Clínica → Modelo Clínico (estrutura) → PROCESSADOR (preenche). ÚNICO ponto que
// conhece os processadores concretos. Cada processador NASCE dirigido por um caso do CRC (GS-004 →
// corneal-tomography; …) e entra aqui. O modelo diz O QUE representar; o processador diz COMO preencher.
const CLINICAL_MODEL_PROCESSORS: Record<string, ClinicalProcessorFn> = {
  'corneal-tomography': runCornealTomography, // GS-004
  'bioimpedance': runBioimpedance,            // FB-003 (composição corporal)
}

/** Modelos clínicos com processador implementado (alimenta o painel de maturidade — COBERTURA_CLINICA.md). */
export const IMPLEMENTED_CLINICAL_MODELS = Object.keys(CLINICAL_MODEL_PROCESSORS)

export interface ClinicalProcessingResult {
  identity: ClinicalIdentity
  route: ProcessingRoute
  result: ProcessorResult
  /** Veredito da 4ª camada (Representation Validator) — separado do processador (Validação entre Camadas). */
  verdict: RepresentationVerdict
}

// ── PLANO DE REPRESENTAÇÃO — o ÚNICO lugar que conhece modalidades (Princípio: nenhum componente arquitetural
// conhece modalidades quando isso pode ser delegado ao CPE). O `analyze` não decide mais "se é laboratório /
// imagem / Pentacam" nem "se extrai biomarcadores / gera parâmetros / narrativa" — ele consulta este plano e
// opera sobre ABSTRAÇÕES. O conhecimento de modalidade fica encapsulado aqui (e nos processadores).
export interface RepresentationPlan {
  identity: ClinicalIdentity
  /** um processador ESPECIALIZADO do CPE representa esta CDU (parâmetros/achados próprios; ex.: corneal). */
  specialized: boolean
  model: ClinicalModel | null
  /** a representação é por RESULTADOS ESTRUTURADOS (caminho de biomarcadores existente — Laboratory Adapter). */
  structured: boolean
  /** preservar o documento como fonte; nada a estruturar em campos. */
  documentOnly: boolean
  /** estrutura reconhecida com confiança (para nomear) — abstração; o chamador não interpreta modalidade. */
  structureConfident: boolean
  /** rótulo de família p/ metadados de extração (classificação; o chamador não ramifica sobre isto). */
  family: string
  /** versão do extrator p/ metadados. */
  extractorVersion: string
  reason: string
}

/**
 * Decide COMO representar uma CDU — a responsabilidade de modalidade sai do `analyze` e passa ao Engine.
 * Puro/determinístico. Comportamento EQUIVALENTE ao legado (Convergência Progressiva: o caminho laboratorial
 * não muda; só a DECISÃO muda de lugar). `ctx` traz os sinais de classificação/extração já computados.
 */
export function planRepresentation(
  cdu: CertifiedCDU,
  ctx: { documentType: string; examCount: number; biomarkerCount: number },
): RepresentationPlan {
  const identity = identifyClinical(cdu.content.text)
  const route = routeProcessing(identity)
  const specialized = !!route.model && route.model.id !== 'laboratory' && IMPLEMENTED_CLINICAL_MODELS.includes(route.model.id)

  // Representação estruturada (biomarcadores) quando NÃO é laudo narrativo (imagem). Equivalente ao legado
  // `isNarrativeLaudo = documentType === 'imaging'`. O conhecimento do rótulo fica AQUI, não no analyze.
  const structured = ctx.documentType !== 'imaging'
  const structureConfident = ctx.documentType !== 'laboratory' || ctx.examCount >= 1 || ctx.biomarkerCount > 0

  return {
    identity,
    specialized,
    model: route.model,
    structured,
    documentOnly: !structured,
    structureConfident,
    family: ctx.documentType,
    extractorVersion: ctx.documentType === 'laboratory' ? 'laboratory-v1' : 'heuristic-v0',
    reason: specialized
      ? `processador especializado (${route.model!.id})`
      : structured ? 'representação estruturada (biomarcadores)' : 'document_only (laudo narrativo)',
  }
}

const EMPTY_VERDICT: RepresentationVerdict = {
  certified: false, completeness: 'empty', regions: [], presentFields: [], missing: [],
  reason: 'sem modelo/representação → document_only',
}

/**
 * FACHADA ÚNICA do CPE. Recebe uma CertifiedCDU, identifica a modalidade (Identidade Clínica), seleciona o
 * MODELO CLÍNICO (estrutura), executa o PROCESSADOR (preenche) e VALIDA a representação (4ª camada, separada).
 * Sem modelo/processador → `document_only` (não bloqueia; preserva o documento). Devolve identidade + verdict.
 */
export function processClinical(cdu: CertifiedCDU): ClinicalProcessingResult {
  const identity = identifyClinical(cdu.content.text)
  const route = routeProcessing(identity)
  const model = route.model
  if (!model) {
    return { identity, route, verdict: EMPTY_VERDICT,
      result: { output: null, clinicalModel: 'none', contractVersion: '-', extractedUnits: 0, notes: [route.reason] } }
  }
  const fn = CLINICAL_MODEL_PROCESSORS[model.id]
  if (!fn) {
    return { identity, route, verdict: EMPTY_VERDICT, result: {
      output: null, clinicalModel: model.id, contractVersion: model.contractVersion,
      extractedUnits: 0, notes: [`modelo clínico "${model.id}" tem estrutura, mas ainda sem processador → document_only`],
    } }
  }
  const result = fn(cdu)
  const verdict = validateRepresentation(result, model) // camada separada certifica a estrutura
  return { identity, route, result, verdict }
}
