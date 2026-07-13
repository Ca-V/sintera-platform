// Clinical Processing Engine — registro/executor dos processadores concretos.
//
// Mapeia o extrator eleito (pela Identidade Clínica, via routeProcessing) → a função do processador.
// Único ponto que conhece os processadores concretos. Cada processador NASCE dirigido por um caso do CRC
// (GS-004 → Pentacam; GS-012 → Mamografia; …) e é registrado aqui quando fica verde.

import type { CertifiedCDU, ClinicalProcessorFn, ProcessorResult } from './types'
import type { ClinicalIdentity } from '../clinical-identity-registry'
import { routeProcessing } from '../clinical-processing-engine'
import { runPentacam } from './pentacam'

/** extrator → processador. Cresce puxado pelo CRC (1 modalidade utilizável por vez). */
const PROCESSOR_FNS: Record<string, ClinicalProcessorFn> = {
  CorneaTomographyExtractor: runPentacam, // GS-004
}

/**
 * Processa uma CertifiedCDU: roteia pela Identidade Clínica e executa o processador especializado.
 * Sem processador implementado / sem identidade → document_only (não bloqueia; preserva o documento).
 */
export function runClinicalProcessing(cdu: CertifiedCDU, identity: ClinicalIdentity | null | undefined): ProcessorResult {
  const route = routeProcessing(identity)
  if (!route.processor) {
    return { output: null, extractor: 'none', contractVersion: '-', extractedUnits: 0, notes: [route.reason] }
  }
  const fn = PROCESSOR_FNS[route.processor.extractor]
  if (!fn) {
    return {
      output: null, extractor: route.processor.extractor, contractVersion: route.processor.contractVersion,
      extractedUnits: 0, notes: [`processador ${route.processor.extractor} ainda não implementado → document_only`],
    }
  }
  return fn(cdu)
}

/** Extratores com processador concreto já implementado (para o painel de Cobertura Clínica). */
export const IMPLEMENTED_PROCESSORS = Object.keys(PROCESSOR_FNS)
