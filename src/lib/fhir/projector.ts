// FHIR-002 — Projetor FHIR R4 da SINTERA (PURO · determinístico · desacoplado de RNDS e do banco).
//
// Recebe uma VISÃO clínica interna NORMALIZADA (evento + documentos + resultados + pedido) e projeta
// um grafo de recursos FHIR R4, retornado num Bundle `collection`:
//   Patient · Practitioner? · Organization? · ServiceRequest? · DiagnosticReport · Observation[] ·
//   DocumentReference[] · Provenance[]
//
// Separação (FHIR-001):
//   • EVENTO/achado clínico  → DiagnosticReport (+ Observation[])
//   • DOCUMENTO/artefato      → DocumentReference (presentedForm/derivedFrom)
//   • PROVENIÊNCIA            → Provenance (por documento)
//   • PEDIDO                  → ServiceRequest (DiagnosticReport.basedOn)
//
// NÃO contém perfis/regras da RNDS (o adaptador RNDS é camada posterior — RNDS-001 §10). NÃO lê banco:
// a entrada é um contrato em memória, o que torna a projeção testável isoladamente (caso Doppler).
// Identificadores oficiais (CPF/CNS/CNES) são opcionais aqui — a representação FHIR usa id LOCAL; os
// oficiais entram só no adaptador RNDS.

// ── Contrato de ENTRADA (visão interna normalizada) ────────────────────────────────────────────────
export type Laterality = 'esquerdo' | 'direito' | 'bilateral'
export type ReportStatus = 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected'
export type DocumentRole = 'laudo_preliminar' | 'laudo_final' | 'complementar' | 'outro'

export interface ProjectionParty { localId: string; name?: string | null }

export interface ProjectionOrder {
  localId: string
  code: string                       // nomenclatura clínica do pedido (ex.: "Doppler … — bilateral")
  laterality?: Laterality | null
  requester?: ProjectionParty | null // solicitante → Practitioner
  date?: string | null               // data de solicitação
}

export interface ProjectionEvent {
  localId: string
  code: string                       // nomenclatura clínica do exame realizado
  category?: string | null           // 'imaging' | 'laboratory' | …
  status: ReportStatus               // preliminary → final (nativo do DiagnosticReport)
  date?: string | null               // data de realização
  performer?: ProjectionParty | null // emissor/laboratório → Organization
}

export interface ProjectionDocument {
  localId: string
  role: DocumentRole
  url: string
  contentType?: string | null
  date?: string | null
  source?: string | null             // proveniência: origem (upload/lab…)
  extractionRef?: string | null      // rastreabilidade da extração (extraction_version)
}

export interface ProjectionResult {
  localId: string
  documentLocalId?: string | null    // proveniência do resultado (qual documento o originou)
  code: string
  valueNum?: number | null
  valueText?: string | null
  unit?: string | null
  referenceText?: string | null
  bodySite?: string | null
}

export interface FhirProjectionInput {
  patient: ProjectionParty
  order?: ProjectionOrder | null
  event: ProjectionEvent
  documents: ProjectionDocument[]
  results: ProjectionResult[]
}

// ── Saída FHIR (tipos frouxos — sem dependência externa) ────────────────────────────────────────────
export type FhirResource = { resourceType: string; id: string } & Record<string, unknown>
export interface FhirBundleEntry { fullUrl: string; resource: FhirResource }
export interface FhirBundle { resourceType: 'Bundle'; type: 'collection'; entry: FhirBundleEntry[] }

const LOCAL_ID_SYSTEM = 'urn:sintera:local'
const ref = (type: string, id: string) => ({ reference: `${type}/${id}` })
/** Remove chaves com valor undefined/null (mantém 0/'' e arrays). */
function compact<T extends Record<string, unknown>>(o: T): T {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null) out[k] = v
  return out as T
}
const localIdentifier = (value: string) => [{ system: LOCAL_ID_SYSTEM, value }]

function patientResource(p: ProjectionParty): FhirResource {
  return compact({
    resourceType: 'Patient', id: p.localId,
    identifier: localIdentifier(p.localId),
    name: p.name ? [{ text: p.name }] : undefined,
  })
}

function practitionerResource(p: ProjectionParty): FhirResource {
  return compact({
    resourceType: 'Practitioner', id: p.localId,
    identifier: localIdentifier(p.localId),
    name: p.name ? [{ text: p.name }] : undefined,
  })
}

function organizationResource(p: ProjectionParty): FhirResource {
  return compact({
    resourceType: 'Organization', id: p.localId,
    identifier: localIdentifier(p.localId),
    name: p.name ?? undefined,
  })
}

function serviceRequestResource(order: ProjectionOrder, patientId: string): FhirResource {
  return compact({
    resourceType: 'ServiceRequest', id: order.localId,
    status: 'active', intent: 'order',
    code: { text: order.code },
    subject: ref('Patient', patientId),
    requester: order.requester ? ref('Practitioner', order.requester.localId) : undefined,
    authoredOn: order.date ?? undefined,
  })
}

function documentReferenceResource(doc: ProjectionDocument, patientId: string, eventId: string): FhirResource {
  return compact({
    resourceType: 'DocumentReference', id: doc.localId,
    status: 'current',
    type: { text: doc.role },
    subject: ref('Patient', patientId),
    date: doc.date ?? undefined,
    content: [{ attachment: compact({ url: doc.url, contentType: doc.contentType ?? undefined }) }],
    context: { related: [ref('DiagnosticReport', eventId)] },
  })
}

function provenanceResource(doc: ProjectionDocument, fallbackDate?: string | null): FhirResource {
  const recorded = doc.date ?? fallbackDate ?? undefined
  return compact({
    resourceType: 'Provenance', id: `prov-${doc.localId}`,
    target: [ref('DocumentReference', doc.localId)],
    recorded,
    agent: [{ who: { display: doc.source ?? 'sintera' } }],
    entity: doc.extractionRef
      ? [{ role: 'source', what: { identifier: { system: 'urn:sintera:extraction_version', value: doc.extractionRef } } }]
      : undefined,
  })
}

function observationResource(r: ProjectionResult, patientId: string): FhirResource {
  const value = (r.valueNum !== undefined && r.valueNum !== null)
    ? { valueQuantity: compact({ value: r.valueNum, unit: r.unit ?? undefined }) }
    : (r.valueText ? { valueString: r.valueText } : {})
  return compact({
    resourceType: 'Observation', id: r.localId,
    status: 'final',
    code: { text: r.code },
    subject: ref('Patient', patientId),
    ...value,
    referenceRange: r.referenceText ? [{ text: r.referenceText }] : undefined,
    bodySite: r.bodySite ? { text: r.bodySite } : undefined,
    derivedFrom: r.documentLocalId ? [ref('DocumentReference', r.documentLocalId)] : undefined,
  })
}

function diagnosticReportResource(input: FhirProjectionInput): FhirResource {
  const { event, order, documents, results, patient } = input
  return compact({
    resourceType: 'DiagnosticReport', id: event.localId,
    status: event.status,
    category: event.category ? [{ text: event.category }] : undefined,
    code: { text: event.code },
    subject: ref('Patient', patient.localId),
    performer: event.performer ? [ref('Organization', event.performer.localId)] : undefined,
    basedOn: order ? [ref('ServiceRequest', order.localId)] : undefined,
    effectiveDateTime: event.date ?? undefined,
    result: results.map(r => ref('Observation', r.localId)),
    presentedForm: documents.map(d => compact({ url: d.url, contentType: d.contentType ?? undefined, title: d.role })),
  })
}

/**
 * Projeta a visão interna → grafo FHIR R4 (Bundle collection). Puro/determinístico.
 * Ordem das entradas: Patient · (Practitioner) · (Organization) · (ServiceRequest) · DiagnosticReport ·
 * Observation[] · DocumentReference[] · Provenance[].
 */
export function projectToFhir(input: FhirProjectionInput): FhirBundle {
  const resources: FhirResource[] = []
  resources.push(patientResource(input.patient))
  if (input.order?.requester) resources.push(practitionerResource(input.order.requester))
  if (input.event.performer) resources.push(organizationResource(input.event.performer))
  if (input.order) resources.push(serviceRequestResource(input.order, input.patient.localId))
  resources.push(diagnosticReportResource(input))
  for (const r of input.results) resources.push(observationResource(r, input.patient.localId))
  for (const d of input.documents) resources.push(documentReferenceResource(d, input.patient.localId, input.event.localId))
  for (const d of input.documents) resources.push(provenanceResource(d, input.event.date))

  return {
    resourceType: 'Bundle', type: 'collection',
    entry: resources.map(r => ({ fullUrl: `urn:uuid:${r.resourceType}:${r.id}`, resource: r })),
  }
}
