// @sintera/core — DOC-001 · DOC-002 — Domínio "Documentos do paciente". Fonte ÚNICA Web↔Mobile.
//
// MORAVA EM `src/lib/documents/` — Web-only, fora do alcance do Mobile. Movido para cá porque a página de
// Documentos existe nas duas pontas: manter o domínio do lado da Web faria nascer um segundo dono do mesmo
// conceito, que é o defeito nomeado pelo ADR-023 e que já custou três correções no campo de telefone.
// Puro/testável: sem React, sem Supabase, sem IO — o binding real entra na camada de plataforma.
//
// Fonte de verdade: docs/HOMOLOG-SPECS_C1_C2_C3.md (DOC-001) + docs/DOC-002. Decisões travadas (não reabrir):
//  • Domínio ÚNICO de documentos do paciente (Receita, Atestado, Relatório, Encaminhamento como SUBTIPOS).
//  • SEPARADO de `exams` e de `exam_documents` (aquele é escopo-exame; este é documento do paciente).
//  • Receita pode ser ASSOCIADA a 1..N contextos/categorias conforme o conteúdo: Medicamento, Suplemento,
//    Ciclo/Contracepção, Composição corporal, Recursos de saúde, Hábitos, Monitoramento.
//  • NUNCA usar uma categoria genérica "Evento" para acomodar esses documentos.
//  • Sem regra provisória fora da especificação.
//
// INVARIANTE CENTRAL: criar/associar um Documento NUNCA cria um exame nem muta o registro-alvo — só escreve em
// `patient_documents` / `patient_document_links`. Coberta por teste.

/** Subtipos de documento do paciente (catálogo aberto; `outro` cobre o que não está listado). */
export type PatientDocumentSubtype = 'receita' | 'atestado' | 'relatorio' | 'encaminhamento' | 'outro'

export const DOCUMENT_SUBTYPES: { value: PatientDocumentSubtype; label: string }[] = [
  { value: 'receita',        label: 'Receita' },
  { value: 'atestado',       label: 'Atestado' },
  { value: 'relatorio',      label: 'Relatório' },
  { value: 'encaminhamento', label: 'Encaminhamento' },
  { value: 'outro',          label: 'Outro documento' },
]
const SUBTYPE_LABELS = Object.fromEntries(DOCUMENT_SUBTYPES.map(s => [s.value, s.label])) as Record<PatientDocumentSubtype, string>
export function documentSubtypeLabel(s: PatientDocumentSubtype): string { return SUBTYPE_LABELS[s] ?? 'Outro documento' }
export function isDocumentSubtype(v: string): v is PatientDocumentSubtype {
  return DOCUMENT_SUBTYPES.some(s => s.value === v)
}

/** Domínios-alvo aos quais um documento pode se ASSOCIAR (categoria da plataforma). Agnóstico de rota. */
export type DocumentTargetDomain =
  | 'medicamento' | 'suplemento' | 'ciclo' | 'composicao' | 'recurso' | 'habito' | 'monitoramento'
  | 'exame' | 'consulta'

/**
 * Rótulo HUMANO do domínio-alvo. As chaves acima são identificadores internos — sem acento, minúsculas,
 * no singular — e não podem aparecer na tela.
 *
 * Achado na homologação (25/08): a tela de Documentos exibia `composicao · habito · recurso` cru para a
 * usuária, porque juntava as chaves direto. Rótulo é apresentação e tem que ter um dono; este é o dono.
 */
const TARGET_LABELS: Record<DocumentTargetDomain, string> = {
  medicamento:   'Medicamento',
  suplemento:    'Suplemento',
  ciclo:         'Ciclo e contracepção',
  composicao:    'Composição corporal',
  recurso:       'Recurso de saúde',
  habito:        'Hábito',
  monitoramento: 'Monitoramento',
  exame:         'Exame',
  consulta:      'Consulta',
}
export function documentTargetLabel(t: DocumentTargetDomain): string {
  return TARGET_LABELS[t] ?? String(t)
}

/** Categorias às quais uma RECEITA pode alimentar informação (decisão da fundadora — os 7 contextos). */
export const RECEITA_TARGET_DOMAINS: DocumentTargetDomain[] = [
  'medicamento', 'suplemento', 'ciclo', 'composicao', 'recurso', 'habito', 'monitoramento',
]

/** Alvos válidos por subtipo. Receita → os 7 contextos; documentos clínicos → o encontro (consulta/exame);
 *  `outro` não exige associação. Mantém a associação DENTRO da especificação (sem alvo improvisado). */
const TARGETS_BY_SUBTYPE: Record<PatientDocumentSubtype, DocumentTargetDomain[]> = {
  receita: RECEITA_TARGET_DOMAINS,
  atestado: ['consulta', 'exame'],
  relatorio: ['consulta', 'exame'],
  encaminhamento: ['consulta', 'exame'],
  outro: [],
}

/** Um subtipo pode se associar a um domínio-alvo? (base para validar links; fora da lista = não). */
export function canAssociate(subtype: PatientDocumentSubtype, target: DocumentTargetDomain): boolean {
  return (TARGETS_BY_SUBTYPE[subtype] ?? []).includes(target)
}
/** Alvos permitidos para um subtipo (para a UI oferecer só o que é válido). */
export function allowedTargets(subtype: PatientDocumentSubtype): DocumentTargetDomain[] {
  return TARGETS_BY_SUBTYPE[subtype] ?? []
}

export interface DocumentAssociation { target_domain: DocumentTargetDomain; target_id: string }

/** dd/mm/aaaa a partir de uma data ISO. Vazio se não houver data. */
function formatDate(iso: string | null | undefined): string {
  const [y, m, d] = (iso ?? '').slice(0, 10).split('-')
  return d && m && y ? `${d}/${m}/${y}` : ''
}

/**
 * Linha de identificação do documento no cartão — o que distingue UM documento dos outros.
 *
 * POR QUE EXISTE: sem isto, três receitas sem emissor preenchido viram três cartões idênticos ("Receita" /
 * "Sem emissor informado") e a pessoa não tem como saber qual é qual. A data de inclusão é a última defesa:
 * pode não haver emissor nem data no documento, mas sempre houve um momento em que ele entrou.
 *
 * Ordem: emissor e data do documento (o que está escrito nele) vencem; na ausência dos dois, a data em que
 * foi guardado. Web e Mobile chamam esta função — o texto não pode divergir entre as telas.
 */
export function documentSubtitle(doc: {
  issuer?: string | null
  doc_date?: string | null
  created_at?: string | null
}): string {
  const partes = [doc.issuer?.trim(), formatDate(doc.doc_date)].filter(Boolean) as string[]
  if (partes.length > 0) return partes.join(' · ')
  const guardado = formatDate(doc.created_at)
  return guardado ? `Adicionado em ${guardado}` : 'Sem emissor informado'
}

/**
 * RECEITA vinculada a um registro — a forma CANÔNICA de arquivar uma receita que pertence a um medicamento,
 * suplemento ou outro contexto.
 *
 * POR QUE ISTO EXISTE: a receita era gravada em `medications.prescription_url`, ou seja, o arquivo tinha um dono
 * por tabela. Quem procurasse a receita em Documentos não a encontrava, porque ela nunca esteve lá. Pelo ADR-001,
 * o domínio de Documentos é o dono do fato "existe este documento"; os outros REFERENCIAM pelo vínculo, nunca
 * copiam o arquivo.
 *
 * Web e Mobile chamam esta função em vez de montar o objeto cada um do seu jeito — assim o subtipo, o vínculo e
 * a proveniência não podem divergir entre as pontas.
 */
export function prescriptionDocumentFor(
  file_url: string,
  target: DocumentAssociation,
  meta?: { issuer?: string | null; doc_date?: string | null; notes?: string | null },
): NewPatientDocument {
  return {
    file_url,
    subtype: 'receita',
    issuer: meta?.issuer ?? null,
    doc_date: meta?.doc_date ?? null,
    notes: meta?.notes ?? null,
    associations: [target],
  }
}

export interface NewPatientDocument {
  file_url: string
  subtype: PatientDocumentSubtype
  issuer?: string | null
  doc_date?: string | null
  notes?: string | null
  document_sha256?: string | null
  source?: string
  /** Associações a registros-alvo (1..N). Uma receita pode alimentar Medicamento E Suplemento, por exemplo. */
  associations?: DocumentAssociation[]
}

/** Linha pronta para `public.patient_documents` (schema DOC-001 — Fase própria, aditiva, NÃO aplicada aqui). */
export interface PatientDocumentInsert {
  user_id: string
  subtype: PatientDocumentSubtype
  file_url: string
  issuer: string | null
  doc_date: string | null
  notes: string | null
  document_sha256: string | null
  source: string
  status: string
}
/**
 * Linha de associação `public.patient_document_links` (N por documento).
 *
 * `user_id` é cópia do dono do documento — denormalização deliberada, igual à de `exam_documents`. Existe para
 * que a RLS e o índice `(user_id, target_domain, target_id)` respondam "quais documentos estão ligados a este
 * medicamento?" sem join. Nunca é editado de forma independente: quem cria a linha é sempre o dono do documento.
 */
export interface DocumentLinkInsert {
  document_id: string
  user_id: string
  target_domain: DocumentTargetDomain
  target_id: string
}

const SOURCE_DEFAULT = 'upload_usuario'

/** Monta a linha do documento — puro. `exam`/`exam_documents` NÃO são tocados (domínio separado). */
export function buildPatientDocumentInsert(user_id: string, doc: NewPatientDocument): PatientDocumentInsert {
  return {
    user_id,
    subtype: doc.subtype,
    file_url: doc.file_url,
    issuer: doc.issuer ?? null,
    doc_date: doc.doc_date ?? null,
    notes: doc.notes ?? null,
    document_sha256: doc.document_sha256 ?? null,
    source: doc.source ?? SOURCE_DEFAULT,
    status: 'pending',
  }
}

/**
 * Monta as linhas de associação de um documento — puro. Valida cada alvo contra o subtipo (`canAssociate`):
 * associação fora da especificação é REJEITADA (lança), evitando "regra provisória". Uma receita gera N links.
 */
export function buildDocumentLinkInserts(
  document_id: string, user_id: string, subtype: PatientDocumentSubtype, associations: DocumentAssociation[],
): DocumentLinkInsert[] {
  return associations.map(a => {
    if (!canAssociate(subtype, a.target_domain))
      throw new Error(`associação inválida: ${subtype} → ${a.target_domain}`)
    return { document_id, user_id, target_domain: a.target_domain, target_id: a.target_id }
  })
}

// ── Escrita isolada (cliente mínimo; SupabaseClient real entra só no wiring gated) ─────────────────────
export interface DocInsertBuilder { select(cols: string): Promise<{ data: { id: string }[] | null; error: unknown }> }
export interface PatientDocWriteClient { from(table: string): { insert(rows: unknown): DocInsertBuilder } }

function toError(e: unknown): Error { return e instanceof Error ? e : new Error(String(e)) }

/**
 * Cria UM documento do paciente e (opcional) suas N associações. INVARIANTE: escreve SÓ em `patient_documents`
 * e `patient_document_links` — NUNCA em `exams`/`exam_documents` nem no registro-alvo (associar ≠ mutar o alvo).
 */
export async function createPatientDocument(
  client: PatientDocWriteClient,
  params: { user_id: string; doc: NewPatientDocument },
): Promise<{ id: string | null; linkIds: string[]; error: Error | null }> {
  const row = buildPatientDocumentInsert(params.user_id, params.doc)
  const { data, error } = await client.from('patient_documents').insert([row]).select('id')
  if (error) return { id: null, linkIds: [], error: toError(error) }
  const id = data?.[0]?.id ?? null
  if (!id) return { id: null, linkIds: [], error: new Error('documento não criado') }

  const associations = params.doc.associations ?? []
  if (associations.length === 0) return { id, linkIds: [], error: null }
  let links: DocumentLinkInsert[]
  try { links = buildDocumentLinkInserts(id, params.user_id, params.doc.subtype, associations) }
  catch (e) { return { id, linkIds: [], error: toError(e) } }
  const { data: ld, error: le } = await client.from('patient_document_links').insert(links).select('id')
  if (le) return { id, linkIds: [], error: toError(le) }
  return { id, linkIds: (ld ?? []).map(r => r.id), error: null }
}

/**
 * ASSOCIAÇÃO POSTERIOR: liga um documento JÁ existente a mais registros-alvo (ex.: a receita passou a alimentar
 * também o Suplemento). INVARIANTE: só insere em `patient_document_links`; não recria documento nem muta o alvo.
 */
export async function associateDocument(
  client: PatientDocWriteClient,
  params: { document_id: string; user_id: string; subtype: PatientDocumentSubtype; associations: DocumentAssociation[] },
): Promise<{ linkIds: string[]; error: Error | null }> {
  if (params.associations.length === 0) return { linkIds: [], error: null }
  let links: DocumentLinkInsert[]
  try { links = buildDocumentLinkInserts(params.document_id, params.user_id, params.subtype, params.associations) }
  catch (e) { return { linkIds: [], error: toError(e) } }
  const { data, error } = await client.from('patient_document_links').insert(links).select('id')
  if (error) return { linkIds: [], error: toError(error) }
  return { linkIds: (data ?? []).map(r => r.id), error: null }
}
