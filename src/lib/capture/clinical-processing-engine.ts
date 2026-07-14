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
import type { CertifiedCDU, ClinicalProcessorFn, ProcessorResult } from './clinical-processors/types'

/** Forma do resultado que uma modalidade produz — a heterogeneidade que o modelo universal acomoda. */
export type ResultKind =
  | 'structured'   // biomarcadores (valor + unidade + referência) — laboratório
  | 'narrative'    // achados textuais/laudo — imagem, neurofisiologia, patologia
  | 'parametric'   // parâmetros/medidas por região/olho/derivação — Pentacam, OCT, densitometria, ECG

/** Revisão a jusante do processamento (não confundir com a revisão TÉCNICA da Identidade Documental). */
export type ProcessingReview = 'none' | 'clinical'

/** Descritor de um processador especializado. O `clinicalModel` casa com o nome eleito pela Identidade Clínica. */
export interface ClinicalProcessor {
  clinicalModel: string          // ex.: 'laboratory' — chave de roteamento (vinda do registry)
  resultKind: ResultKind
  /** Versão do contrato do processador (estável/versionada, como o CertifiedCDU). */
  contractVersion: string
}

/** Registro de processadores por extrator. Cresce puxado pelo CRC — 1 processador por modalidade madura. */
export const CLINICAL_PROCESSORS: ClinicalProcessor[] = [
  { clinicalModel: 'laboratory',        resultKind: 'structured', contractVersion: 'v1' },
  { clinicalModel: 'mammography',       resultKind: 'narrative',  contractVersion: 'v1' },
  { clinicalModel: 'ultrasound',        resultKind: 'narrative',  contractVersion: 'v1' },
  { clinicalModel: 'mri',               resultKind: 'narrative',  contractVersion: 'v1' },
  { clinicalModel: 'ct',                resultKind: 'narrative',  contractVersion: 'v1' },
  { clinicalModel: 'pathology',         resultKind: 'narrative',  contractVersion: 'v1' },
  { clinicalModel: 'eeg',               resultKind: 'narrative',  contractVersion: 'v1' },
  { clinicalModel: 'corneal-tomography',  resultKind: 'parametric', contractVersion: 'v1' },
  { clinicalModel: 'oct',               resultKind: 'parametric', contractVersion: 'v1' },
  { clinicalModel: 'densitometry',               resultKind: 'parametric', contractVersion: 'v1' },
  { clinicalModel: 'ecg',               resultKind: 'parametric', contractVersion: 'v1' },
  { clinicalModel: 'echocardiography',              resultKind: 'parametric', contractVersion: 'v1' },
  { clinicalModel: 'holter',            resultKind: 'parametric', contractVersion: 'v1' },
]

export interface ProcessingRoute {
  /** Processador escolhido, ou null quando nenhum atende (→ document_only). */
  processor: ClinicalProcessor | null
  /** Forma esperada do resultado (null quando document_only). */
  resultKind: ResultKind | null
  /** 'clinical' quando não há processador (segue como document_only, sem bloquear). */
  review: ProcessingReview
  /** Motivo auditável do roteamento. */
  reason: string
}

/**
 * Roteia uma CertifiedCDU (via a sua Identidade Clínica) ao processador especializado. Puro/determinístico.
 *
 * Sem identidade confiável, ambígua, ou sem processador correspondente → `document_only` (revisão CLÍNICA,
 * não bloqueia). Nunca "força" um processador — é melhor preservar o documento do que inventar estrutura.
 */
export function routeProcessing(identity: ClinicalIdentity | null | undefined): ProcessingRoute {
  if (!identity || !identity.clinicalType || !identity.clinicalModel || identity.confidence === 'low') {
    return { processor: null, resultKind: null, review: 'clinical',
      reason: 'sem identidade clínica confiável → document_only (preserva o documento; revisão clínica)' }
  }
  if (identity.ambiguous) {
    return { processor: null, resultKind: null, review: 'clinical',
      reason: 'identidade clínica ambígua (2+ modalidades fortes) → document_only; possivelmente N documentos (Segmentação)' }
  }
  const processor = CLINICAL_PROCESSORS.find(p => p.clinicalModel === identity.clinicalModel) ?? null
  if (!processor) {
    return { processor: null, resultKind: null, review: 'clinical',
      reason: `modalidade "${identity.clinicalType}" identificada, mas sem processador (${identity.clinicalModel}) → document_only (revisão clínica, não bloqueia)` }
  }
  return { processor, resultKind: processor.resultKind, review: 'none',
    reason: `roteado ao modelo ${processor.clinicalModel} (${processor.resultKind}) — CEF contrato ${processor.contractVersion}` }
}

// ── Executor: Identidade Clínica → Modelo Clínico → processador. ÚNICO ponto que conhece os processadores
// concretos. Cada modelo NASCE dirigido por um caso do CRC (GS-004 → corneal-tomography; …) e entra aqui.
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
 * MODELO CLÍNICO e executa o processador. Sem modelo/processador → `document_only` (não bloqueia; preserva o
 * documento). Devolve também a identidade, para o chamador persistir família/tipo — sem conhecer modalidades.
 */
export function processClinical(cdu: CertifiedCDU): ClinicalProcessingResult {
  const identity = identifyClinical(cdu.content.text)
  const route = routeProcessing(identity)
  const model = route.processor?.clinicalModel ?? null
  if (!model) {
    return { identity, route, result: { output: null, clinicalModel: 'none', contractVersion: '-', extractedUnits: 0, notes: [route.reason] } }
  }
  const fn = CLINICAL_MODEL_PROCESSORS[model]
  if (!fn) {
    return { identity, route, result: {
      output: null, clinicalModel: model, contractVersion: route.processor!.contractVersion,
      extractedUnits: 0, notes: [`modelo clínico "${model}" identificado, mas sem processador → document_only`],
    } }
  }
  return { identity, route, result: fn(cdu) }
}
