// Fase C — PORTA abstrata do read-model canônico (137→143) → CanonProjectionInput. PURA (sem DB/rede aqui).
// O ADAPTADOR real (Supabase, leitura read-only, escopado por RLS) é passo GATED (preview) — NÃO incluído aqui.
// Esta camada permite validar loader/projeção com FAKES sintéticos, sem tocar dados reais.
import type {
  CanonProjectionInput, CanonPatient, CanonPractitioner, CanonOrganization, CanonServiceRequest,
  CanonServiceRequestResult, CanonResultEvent, CanonObservation, CanonProcedure, CanonDocument, CanonTerminologyBinding,
} from './projector'

/** Escopo de leitura (ex.: um usuário). Mantido opaco — o adaptador real aplica RLS/minimização. */
export interface CanonScope { userId: string }

/** Fonte read-only do modelo canônico. Cada método retorna as linhas JÁ mapeadas para o tipo canônico. */
export interface CanonicalSource {
  patients(scope: CanonScope): Promise<CanonPatient[]>
  practitioners(scope: CanonScope): Promise<CanonPractitioner[]>
  organizations(scope: CanonScope): Promise<CanonOrganization[]>
  serviceRequests(scope: CanonScope): Promise<CanonServiceRequest[]>
  serviceRequestResults(scope: CanonScope): Promise<CanonServiceRequestResult[]>
  resultEvents(scope: CanonScope): Promise<CanonResultEvent[]>
  observations(scope: CanonScope): Promise<CanonObservation[]>
  procedures(scope: CanonScope): Promise<CanonProcedure[]>
  documents(scope: CanonScope): Promise<CanonDocument[]>
  terminologyBindings(scope: CanonScope): Promise<CanonTerminologyBinding[]>
}

/** Compõe o CanonProjectionInput a partir da fonte (leitura em paralelo). Puro além do IO da fonte injetada. */
export async function loadCanonicalModel(source: CanonicalSource, scope: CanonScope): Promise<CanonProjectionInput> {
  const [
    patients, practitioners, organizations, serviceRequests, serviceRequestResults,
    resultEvents, observations, procedures, documents, terminologyBindings,
  ] = await Promise.all([
    source.patients(scope), source.practitioners(scope), source.organizations(scope),
    source.serviceRequests(scope), source.serviceRequestResults(scope), source.resultEvents(scope),
    source.observations(scope), source.procedures(scope), source.documents(scope), source.terminologyBindings(scope),
  ])
  return { patients, practitioners, organizations, serviceRequests, serviceRequestResults, resultEvents, observations, procedures, documents, terminologyBindings }
}

/** Fonte FAKE em memória (dados SINTÉTICOS) — para testes/roteiro sem banco real. NÃO usar com dados reais. */
export function createFakeSource(data: CanonProjectionInput): CanonicalSource {
  const list = <T>(v: T[] | undefined): Promise<T[]> => Promise.resolve(v ?? [])
  return {
    patients: () => list(data.patients),
    practitioners: () => list(data.practitioners),
    organizations: () => list(data.organizations),
    serviceRequests: () => list(data.serviceRequests),
    serviceRequestResults: () => list(data.serviceRequestResults),
    resultEvents: () => list(data.resultEvents),
    observations: () => list(data.observations),
    procedures: () => list(data.procedures),
    documents: () => list(data.documents),
    terminologyBindings: () => list(data.terminologyBindings),
  }
}
