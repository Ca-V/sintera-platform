// Clinical Information Pipeline — o ÚNICO orquestrador da compreensão documental.
//
// Fundadora (13/07): não é domínio novo — é o EXECUTOR oficial do pipeline. Nenhum componente chama
// outro diretamente; QUEM COORDENA é o pipeline. Ele recebe um BUNDLE e devolve EXCLUSIVAMENTE
// `CertifiedCDU`s — o contrato único de entrada de todos os extratores (presentes e futuros). Assim o
// `analyze`/CEF nunca mais conhecem PDF, Bundle, páginas, OCR ou Segmentação — só a CertifiedCDU.
//
// Amanhã, FHIR/DICOM/HL7/API/wearables chamam o MESMO pipeline (por outros adaptadores de Bundle) →
// nenhum extrator muda. Arquitetura orientada a artefatos: cada etapa "recebi X, produzi Y".

import { structuralAnalysis } from './structural-analysis'
import { segment } from './segmentation'
import { validateSegmentation, type CertifiedCDU } from './identity-validator'

/** Bundle já montado (contêiner). Hoje: texto por página (reparado). Amanhã: adaptadores FHIR/DICOM/HL7. */
export interface Bundle {
  pageTexts: string[]
  hasImages?: boolean
}

export interface PipelineResult {
  /** Todas as CDUs (certificadas + em revisão). */
  cdus: CertifiedCDU[]
  /** CDUs prontas para seguir ao Analyze/CEF (status = certified). */
  ready: CertifiedCDU[]
  /** CDUs BLOQUEADAS por revisão TÉCNICA (ambiguidade estrutural) — não seguem até resolução. */
  blockedTechnical: CertifiedCDU[]
  reason: string
}

/**
 * Executa a compreensão documental (Análise Estrutural → Segmentação → Identity Validator) e devolve
 * apenas CertifiedCDUs. Determinístico. Único ponto de entrada — coordena as etapas; elas não se chamam.
 */
export function processBundle(bundle: Bundle): PipelineResult {
  // 1) Análise Estrutural — 1 artefato (StructuralRepresentation) por página.
  const pageStructures = (bundle.pageTexts.length > 0 ? bundle.pageTexts : ['']).map(t =>
    structuralAnalysis({ text: t, pageCount: 1, hasImages: bundle.hasImages }),
  )
  // 2) Segmentação — opera sobre os artefatos da Análise Estrutural (nunca sobre páginas cruas).
  const seg = segment(pageStructures)
  // 3) Identity Validator — certifica as CDUs (ou marca revisão TÉCNICA).
  const validated = validateSegmentation(seg)

  const ready = validated.cdus.filter(c => c.status === 'certified')
  const blockedTechnical = validated.cdus.filter(c => c.status === 'needs_review' && c.reviewType === 'technical')

  const reason = `${validated.cdus.length} CDU(s): ${ready.length} certificada(s), ${blockedTechnical.length} em revisão técnica. ${seg.reason}`
  return { cdus: validated.cdus, ready, blockedTechnical, reason }
}
