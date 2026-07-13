// Clinical Processing Engine (CPE) — o MECANISMO ÚNICO de processamento clínico (reformula o M5).
//
// Fundadora (13/07): não há N extratores soltos — há UM motor com PROCESSADORES ESPECIALIZADOS por
// modalidade. Todos consomem o MESMO contrato de entrada (CertifiedCDU, nunca um PDF) e cada um produz o
// MODELO DE RESULTADO próprio da sua modalidade (biomarcador ≠ achado ≠ parâmetro por região). A Identidade
// Clínica (Clinical Identity Registry) já elege o extrator; o CPE é quem ROTEIA a CDU ao processador certo.
//
// Este arquivo é a ESPINHA de roteamento — pura, determinística e auditável. A extração de cada modalidade
// (chamada de IA/parser) pluga como um processador concreto (incremental). Princípios:
//  · CEF §4.0 — modalidade SEM processador → `document_only` (revisão CLÍNICA, NÃO bloqueia; preserva o
//    documento inteiro, nunca força campos).
//  · Identidade ambígua/baixa confiança → não escolhe processador (segue como document_only) — não inventa.
//  · Nenhuma camada compensa a anterior: o CPE confia na Identidade Clínica; não re-identifica.

import type { ClinicalIdentity } from './clinical-identity-registry'

/** Forma do resultado que uma modalidade produz — a heterogeneidade que o modelo universal acomoda. */
export type ResultKind =
  | 'structured'   // biomarcadores (valor + unidade + referência) — laboratório
  | 'narrative'    // achados textuais/laudo — imagem, neurofisiologia, patologia
  | 'parametric'   // parâmetros/medidas por região/olho/derivação — Pentacam, OCT, densitometria, ECG

/** Revisão a jusante do processamento (não confundir com a revisão TÉCNICA da Identidade Documental). */
export type ProcessingReview = 'none' | 'clinical'

/** Descritor de um processador especializado. O `extractor` casa com o nome eleito pela Identidade Clínica. */
export interface ClinicalProcessor {
  extractor: string          // ex.: 'LaboratoryExtractor' — chave de roteamento (vinda do registry)
  resultKind: ResultKind
  /** Versão do contrato do processador (estável/versionada, como o CertifiedCDU). */
  contractVersion: string
}

/** Registro de processadores por extrator. Cresce puxado pelo CRC — 1 processador por modalidade madura. */
export const CLINICAL_PROCESSORS: ClinicalProcessor[] = [
  { extractor: 'LaboratoryExtractor',        resultKind: 'structured', contractVersion: 'v1' },
  { extractor: 'MammographyExtractor',       resultKind: 'narrative',  contractVersion: 'v1' },
  { extractor: 'UltrasoundExtractor',        resultKind: 'narrative',  contractVersion: 'v1' },
  { extractor: 'MRIExtractor',               resultKind: 'narrative',  contractVersion: 'v1' },
  { extractor: 'CTExtractor',                resultKind: 'narrative',  contractVersion: 'v1' },
  { extractor: 'PathologyExtractor',         resultKind: 'narrative',  contractVersion: 'v1' },
  { extractor: 'EEGExtractor',               resultKind: 'narrative',  contractVersion: 'v1' },
  { extractor: 'CorneaTomographyExtractor',  resultKind: 'parametric', contractVersion: 'v1' },
  { extractor: 'OCTExtractor',               resultKind: 'parametric', contractVersion: 'v1' },
  { extractor: 'DXAExtractor',               resultKind: 'parametric', contractVersion: 'v1' },
  { extractor: 'ECGExtractor',               resultKind: 'parametric', contractVersion: 'v1' },
  { extractor: 'EchoExtractor',              resultKind: 'parametric', contractVersion: 'v1' },
  { extractor: 'HolterExtractor',            resultKind: 'parametric', contractVersion: 'v1' },
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
  if (!identity || !identity.clinicalType || !identity.extractor || identity.confidence === 'low') {
    return { processor: null, resultKind: null, review: 'clinical',
      reason: 'sem identidade clínica confiável → document_only (preserva o documento; revisão clínica)' }
  }
  if (identity.ambiguous) {
    return { processor: null, resultKind: null, review: 'clinical',
      reason: 'identidade clínica ambígua (2+ modalidades fortes) → document_only; possivelmente N documentos (Segmentação)' }
  }
  const processor = CLINICAL_PROCESSORS.find(p => p.extractor === identity.extractor) ?? null
  if (!processor) {
    return { processor: null, resultKind: null, review: 'clinical',
      reason: `modalidade "${identity.clinicalType}" identificada, mas sem processador (${identity.extractor}) → document_only (revisão clínica, não bloqueia)` }
  }
  return { processor, resultKind: processor.resultKind, review: 'none',
    reason: `roteado ao ${processor.extractor} (${processor.resultKind}) — CEF contrato ${processor.contractVersion}` }
}
