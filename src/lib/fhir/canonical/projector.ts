// Fase C — Projetor FHIR R4 PURO sobre o schema canônico (137→143). Determinístico, sem IO/rede/RNDS.
// Regra de ouro: o que é [NC] no schema (coding/identificador sem system+code) é OMITIDO no FHIR — nunca inventado.
// Vínculo canônico: service_request_results (confirmado) → DiagnosticReport.basedOn → ServiceRequest.
// fulfills_order_id (legado) NÃO é fonte de basedOn. Compatibilidade FHIR ≠ envio RNDS (esta camada não transporta).

// ── Entrada canônica (read-model normalizado; a fonte read-only sobre o banco é passo posterior/gated) ──────────
export interface CanonIdentifier { kind: string; value: string; system?: string | null; use?: string | null }
export interface CanonPatient { id: string; name?: string | null; birthDate?: string | null; gender?: string | null; identifiers?: CanonIdentifier[] }
export interface CanonPractitioner { id: string; name?: string | null; identifiers?: CanonIdentifier[] }
export interface CanonOrganization { id: string; name?: string | null; identifiers?: CanonIdentifier[] }
export interface CanonServiceRequest {
  id: string; requisitionId: string; status?: string | null; intent?: string | null
  codeText: string; codeSystem?: string | null; codeValue?: string | null; codeDisplay?: string | null
  bodySiteText?: string | null; bodySiteSystem?: string | null; bodySiteCode?: string | null; laterality?: string | null
  subjectPatientId?: string | null; requesterPractitionerId?: string | null; performerOrganizationId?: string | null
  authoredOn?: string | null
}
export interface CanonServiceRequestResult { serviceRequestId: string; resultExamId?: string | null; confirmed: boolean }
export interface CanonResultEvent { examId: string; code?: string | null; status?: string | null; effectiveDate?: string | null; performerOrganizationId?: string | null }
export interface CanonObservation { id: string; examId: string; examDocumentId?: string | null; name: string; valueNum?: number | null; valueText?: string | null; unit?: string | null; codeSystem?: string | null; codeValue?: string | null; codeDisplay?: string | null }
export interface CanonProcedure { id: string; basedOnServiceRequestId?: string | null; status?: string | null; codeText: string; codeSystem?: string | null; codeValue?: string | null; subjectPatientId?: string | null; performerOrganizationId?: string | null; reportExamId?: string | null; laterality?: string | null; performedStart?: string | null }
export interface CanonDocument { id: string; examId: string; fileUrl: string; sha256?: string | null; role?: string | null; contentType?: string | null; uploadedAt?: string | null; source?: string | null; extractionRef?: string | null }
/** Binding de terminologia — só CONFIRMADO com system+code é usado; nada inventado, [NC] omitido. */
export interface CanonTerminologyBinding { targetType?: string | null; targetId?: string | null; conceptText?: string | null; system: string; code: string; display?: string | null; status: string }
export interface CanonProjectionInput {
  patients?: CanonPatient[]; practitioners?: CanonPractitioner[]; organizations?: CanonOrganization[]
  serviceRequests?: CanonServiceRequest[]; serviceRequestResults?: CanonServiceRequestResult[]
  resultEvents?: CanonResultEvent[]; observations?: CanonObservation[]; procedures?: CanonProcedure[]; documents?: CanonDocument[]
  terminologyBindings?: CanonTerminologyBinding[]
}

// ── Saída FHIR (estrutural; sem dependência externa) ────────────────────────────────────────────────────────────
export type FhirResource = { resourceType: string; id: string } & Record<string, unknown>
export interface FhirBundle { resourceType: 'Bundle'; type: 'collection'; entry: { resource: FhirResource }[] }

const LOCAL = 'urn:sintera:local'
const EXTRACTION_SYS = 'urn:sintera:extraction_version'
const ref = (type: string, id: string) => ({ reference: `${type}/${id}` })

/** Remove chaves null/undefined e arrays/objetos vazios (mantém 0/false/''). */
function compact<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    if (v === null || v === undefined) continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) continue
    out[k] = v
  }
  return out as T
}

/** CodeableConcept: coding SÓ quando system+code reais; text sempre que houver. Retorna undefined se vazio. */
function codeable(text?: string | null, system?: string | null, code?: string | null, display?: string | null): Record<string, unknown> | undefined {
  const cc: Record<string, unknown> = {}
  if (system && code) cc.coding = [compact({ system, code, display })]
  if (text) cc.text = text
  return Object.keys(cc).length ? cc : undefined
}

/** Identificadores: id LOCAL sempre; oficiais SÓ quando `system` presente ([NC] → omitido). */
function identifiers(id: string, extra?: CanonIdentifier[]): Record<string, unknown>[] {
  const list: Record<string, unknown>[] = [{ system: LOCAL, value: id }]
  for (const i of extra ?? []) if (i.system) list.push(compact({ system: i.system, value: i.value, use: i.use ?? undefined }))
  return list
}

const humanName = (name?: string | null) => (name ? [{ text: name }] : undefined)

/** DiagnosticReport.status a partir dos papéis dos documentos (final > preliminar > registrado). Não sobrescreve status explícito. */
function deriveReportStatus(docs: CanonDocument[]): string {
  if (docs.some(d => d.role === 'laudo_final')) return 'final'
  if (docs.some(d => d.role === 'laudo_preliminar')) return 'preliminary'
  return 'registered'
}

interface ResolvedCoding { system?: string; code?: string; display?: string }
/** Coding de um alvo: usa o coding DIRETO se real; senão um binding CONFIRMADO (system+code); senão nada. Nunca infere. */
function resolveCoding(
  bindings: Map<string, CanonTerminologyBinding>, targetType: string, targetId: string,
  directSystem?: string | null, directCode?: string | null, directDisplay?: string | null,
): ResolvedCoding {
  if (directSystem && directCode) return { system: directSystem, code: directCode, display: directDisplay ?? undefined }
  const b = bindings.get(`${targetType}:${targetId}`)
  if (b && b.status === 'confirmed' && b.system && b.code) return { system: b.system, code: b.code, display: b.display ?? undefined }
  return {}
}

/**
 * Projeta a entrada canônica para um Bundle FHIR R4 (collection). Puro/determinístico.
 * Recursos: Patient, Practitioner, Organization, ServiceRequest, DiagnosticReport, Observation, Procedure,
 * DocumentReference e Provenance (por documento).
 */
export function projectCanonicalToFhir(input: CanonProjectionInput): FhirBundle {
  const resources: FhirResource[] = []
  const srr = input.serviceRequestResults ?? []
  const docs = input.documents ?? []
  // Índice de bindings CONFIRMADOS por alvo (targetType:targetId).
  const bindings = new Map<string, CanonTerminologyBinding>()
  for (const b of input.terminologyBindings ?? []) if (b.status === 'confirmed' && b.system && b.code && b.targetType && b.targetId) bindings.set(`${b.targetType}:${b.targetId}`, b)

  for (const p of input.patients ?? []) {
    resources.push(compact({
      resourceType: 'Patient', id: p.id, identifier: identifiers(p.id, p.identifiers),
      name: humanName(p.name), birthDate: p.birthDate ?? undefined, gender: p.gender ?? undefined,
    }) as FhirResource)
  }
  for (const pr of input.practitioners ?? []) {
    resources.push(compact({ resourceType: 'Practitioner', id: pr.id, identifier: identifiers(pr.id, pr.identifiers), name: humanName(pr.name) }) as FhirResource)
  }
  for (const o of input.organizations ?? []) {
    resources.push(compact({ resourceType: 'Organization', id: o.id, identifier: identifiers(o.id, o.identifiers), name: o.name ?? undefined }) as FhirResource)
  }

  for (const s of input.serviceRequests ?? []) {
    const cc = resolveCoding(bindings, 'service_request_code', s.id, s.codeSystem, s.codeValue, s.codeDisplay)
    resources.push(compact({
      resourceType: 'ServiceRequest', id: s.id,
      status: s.status ?? 'active', intent: s.intent ?? 'order',
      requisition: { value: s.requisitionId },                                   // agrupa o bilateral
      code: codeable(s.codeText, cc.system, cc.code, cc.display),
      bodySite: (() => { const c = codeable(s.bodySiteText ?? s.laterality, s.bodySiteSystem, s.bodySiteCode); return c ? [c] : undefined })(),
      subject: s.subjectPatientId ? ref('Patient', s.subjectPatientId) : undefined,
      requester: s.requesterPractitionerId ? ref('Practitioner', s.requesterPractitionerId) : undefined,
      performer: s.performerOrganizationId ? [ref('Organization', s.performerOrganizationId)] : undefined,
      authoredOn: s.authoredOn ?? undefined,
    }) as FhirResource)
  }

  // DiagnosticReport (1 por evento-resultado). status derivado dos papéis dos documentos (não sobrescreve o evento:
  // preliminar e final coexistem como N presentedForm/DocumentReference). basedOn só de vínculos CONFIRMADOS.
  for (const ev of input.resultEvents ?? []) {
    const basedOn = srr.filter(r => r.confirmed && r.resultExamId === ev.examId).map(r => ref('ServiceRequest', r.serviceRequestId))
    const obs = (input.observations ?? []).filter(b => b.examId === ev.examId)
    const evDocs = docs.filter(d => d.examId === ev.examId)
    const presentedForm = evDocs.map(d => compact({ url: d.fileUrl, contentType: d.contentType ?? undefined, hash: d.sha256 ?? undefined, title: d.role ?? undefined }))
    resources.push(compact({
      resourceType: 'DiagnosticReport', id: ev.examId,
      status: ev.status ?? deriveReportStatus(evDocs),
      code: codeable(ev.code ?? 'Resultado'),
      basedOn, result: obs.map(b => ref('Observation', b.id)),
      presentedForm,                                                             // preliminar+final preservados
      performer: ev.performerOrganizationId ? [ref('Organization', ev.performerOrganizationId)] : undefined,
      effectiveDateTime: ev.effectiveDate ?? undefined,
    }) as FhirResource)
  }

  for (const b of input.observations ?? []) {
    const cc = resolveCoding(bindings, 'observation_code', b.id, b.codeSystem, b.codeValue, b.codeDisplay)
    const value = b.valueNum !== null && b.valueNum !== undefined
      ? { valueQuantity: compact({ value: b.valueNum, unit: b.unit ?? undefined }) }
      : (b.valueText ? { valueString: b.valueText } : {})
    resources.push(compact({
      resourceType: 'Observation', id: b.id, status: 'final',
      code: codeable(b.name, cc.system, cc.code, cc.display),
      derivedFrom: b.examDocumentId ? [ref('DocumentReference', b.examDocumentId)] : undefined,
      ...value,
    }) as FhirResource)
  }

  for (const pc of input.procedures ?? []) {
    resources.push(compact({
      resourceType: 'Procedure', id: pc.id, status: pc.status ?? 'completed',
      code: codeable(pc.codeText, pc.codeSystem, pc.codeValue),
      subject: pc.subjectPatientId ? ref('Patient', pc.subjectPatientId) : undefined,
      basedOn: pc.basedOnServiceRequestId ? [ref('ServiceRequest', pc.basedOnServiceRequestId)] : undefined,
      performer: pc.performerOrganizationId ? [{ actor: ref('Organization', pc.performerOrganizationId) }] : undefined,
      report: pc.reportExamId ? [ref('DiagnosticReport', pc.reportExamId)] : undefined,
      performedDateTime: pc.performedStart ?? undefined,
      bodySite: (() => { const c = codeable(pc.laterality); return c ? [c] : undefined })(),
    }) as FhirResource)
  }

  for (const d of docs) {
    resources.push(compact({
      resourceType: 'DocumentReference', id: d.id, status: 'current',
      type: codeable(d.role),
      content: [{ attachment: compact({ url: d.fileUrl, contentType: d.contentType ?? undefined, hash: d.sha256 ?? undefined }) }],
      date: d.uploadedAt ?? undefined,
      context: { related: [ref('DiagnosticReport', d.examId)] },
    }) as FhirResource)
    // Provenance por documento (proveniência da origem/extração). recorded omitido se não houver uploadedAt ([NC]).
    resources.push(compact({
      resourceType: 'Provenance', id: `prov-${d.id}`,
      target: [ref('DocumentReference', d.id)],
      recorded: d.uploadedAt ?? undefined,
      agent: [{ who: { display: d.source ?? 'sintera' } }],
      entity: d.extractionRef ? [{ role: 'source', what: { identifier: { system: EXTRACTION_SYS, value: d.extractionRef } } }] : undefined,
    }) as FhirResource)
  }

  return { resourceType: 'Bundle', type: 'collection', entry: resources.map(resource => ({ resource })) }
}
