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
import { getClinicalModel } from './clinical-processors/models'
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
}

/** Modelos clínicos com processador implementado (alimenta o painel de maturidade — COBERTURA_CLINICA.md). */
export const IMPLEMENTED_CLINICAL_MODELS = Object.keys(CLINICAL_MODEL_PROCESSORS)

export interface ClinicalProcessingResult {
  identity: ClinicalIdentity
  route: ProcessingRoute
  result: ProcessorResult
}

/**
 * FACHADA ÚNICA do CPE. Recebe uma CertifiedCDU, identifica a modalidade (Identidade Clínica), seleciona o
 * MODELO CLÍNICO (estrutura) e executa o PROCESSADOR (preenche). Sem modelo/processador → `document_only`
 * (não bloqueia; preserva o documento). Devolve também a identidade, para o chamador persistir família/tipo
 * — sem conhecer modalidades.
 */
export function processClinical(cdu: CertifiedCDU): ClinicalProcessingResult {
  const identity = identifyClinical(cdu.content.text)
  const route = routeProcessing(identity)
  const model = route.model
  if (!model) {
    return { identity, route, result: { output: null, clinicalModel: 'none', contractVersion: '-', extractedUnits: 0, notes: [route.reason] } }
  }
  const fn = CLINICAL_MODEL_PROCESSORS[model.id]
  if (!fn) {
    return { identity, route, result: {
      output: null, clinicalModel: model.id, contractVersion: model.contractVersion,
      extractedUnits: 0, notes: [`modelo clínico "${model.id}" tem estrutura, mas ainda sem processador → document_only`],
    } }
  }
  return { identity, route, result: fn(cdu) }
}
