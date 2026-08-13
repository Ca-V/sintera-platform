// Terminology Service — consulta a TERMINOLOGIA OFICIAL (LOINC · SNOMED CT · TUSS · RNDS). É a AUTORIDADE da
// nomenclatura. NÃO é o Clinical Mapping Service (esse resolve/preenche lacunas). Enquanto a
// integração (backlog C7: terminology server FHIR + cache versionado) não existe, devolve "sem conceito oficial".
import type { TerminologyRef, DecisionStep } from '@/lib/clinical-pipeline/contracts'

export type { TerminologyRef }

export interface OfficialLookup { ref: TerminologyRef | null; step: DecisionStep }

/** Consulta oficial por um candidato (nome/categoria). STUB (C7): sem integração → nenhum conceito oficial ainda. */
export function lookupOfficialTerminology(candidate: { name: string | null; category: string | null }): OfficialLookup {
  return {
    ref: null,
    step: { step: 'terminology', status: 'not_available', input: candidate.name ?? undefined, reason: 'sem integração LOINC/SNOMED/TUSS/RNDS (backlog C7)' },
  }
}
