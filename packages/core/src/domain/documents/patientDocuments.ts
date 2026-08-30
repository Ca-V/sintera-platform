// @sintera/core — DOC-001 · DOC-002 — Domínio "Documentos do paciente". Fonte ÚNICA Web↔Mobile.
//
// A capitalização do complemento no título vem de `lowerLeadIfCommon`, do domínio Exames: é a MESMA regra
// ("Receita de paracetamol", mas "Receita de Doppler"), e duas implementações divergiriam em silêncio.
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
import { lowerLeadIfCommon } from '../exams/orderTitle'

export type PatientDocumentSubtype = 'receita' | 'atestado' | 'relatorio' | 'encaminhamento' | 'outro'

/**
 * Chave do filtro "todos" na lista de documentos. Estava declarada nas DUAS pontas, com o mesmo valor —
 * duplicação achada pela catraca de base única (27/08). Trocá-la num lado e esquecer o outro faria o filtro
 * parar de casar em silêncio.
 */
export const DOCUMENT_FILTER_ALL = 'todos'

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
/**
 * Preposição de cada subtipo. "Receita DE paracetamol", mas "Encaminhamento PARA cardiologia" — a mesma
 * preposição nos dois sairia errada em um deles, e nomenclatura torta em prontuário é o tipo de coisa que a
 * pessoa lê e desconfia da plataforma inteira.
 *
 * `null` = o subtipo não ganha complemento; o título fica só o rótulo.
 */
const PREPOSICAO: Record<PatientDocumentSubtype, string | null> = {
  receita:        'de',
  atestado:       null,   // "Atestado de gripe" seria conteúdo clínico — a plataforma não diz do que é (RDC 657)
  relatorio:      'de',
  encaminhamento: 'para',
  outro:          null,
}

/**
 * Nome do documento como a pessoa o reconhece: "Receita de paracetamol", "Encaminhamento para cardiologia".
 *
 * Pedido da fundadora (25/08): o card não pode dizer só "Receita" quando a plataforma SABE do que ela é — o
 * vínculo com o medicamento já existe no banco, e escondê-lo obriga a abrir o documento para descobrir.
 *
 * Sem alvo conhecido, devolve o rótulo puro. NUNCA inventa complemento: um título que afirma mais do que se
 * sabe é pior que um título curto.
 *
 * ATESTADO nunca ganha complemento, mesmo com alvo: dizer do que é o atestado seria afirmar conteúdo clínico,
 * que a plataforma não produz (RDC 657).
 */
export function deriveDocumentTitle(
  subtype: PatientDocumentSubtype,
  alvos: readonly (string | null | undefined)[] = [],
): string {
  const rotulo = documentSubtypeLabel(subtype)
  const prep = PREPOSICAO[subtype]
  if (!prep) return rotulo

  const nomes = alvos.map(a => a?.trim()).filter((a): a is string => !!a)
  if (nomes.length === 0) return rotulo

  const primeiro = lowerLeadIfCommon(nomes[0])
  // Mais de um alvo: nomear todos alongaria o card sem ajudar a distinguir. Diz quantos faltam, e a pessoa
  // abre se precisar — a informação continua acessível, só não ocupa a lista.
  if (nomes.length === 1) return `${rotulo} ${prep} ${primeiro}`
  return `${rotulo} ${prep} ${primeiro} +${nomes.length - 1}`
}

/**
 * QUEM aparece na frente, num documento que tem médico E instituição.
 *
 * A regra é da fundadora (28/08) e é por NATUREZA do documento. Neste domínio a resposta é sempre a mesma —
 * receita, atestado, relatório e encaminhamento são todos ASSINADOS por um profissional, e é ele quem responde
 * pelo que está escrito. A instituição é onde aconteceu, não quem afirmou.
 *
 * A OUTRA METADE DA REGRA DELA NÃO MORA AQUI. "No caso de um exame, geralmente tem duas informações de médico:
 * o solicitante e o que laudou — não tem tanta relevância o que laudou, e sim o que solicitou." Laudo e pedido
 * de exame pertencem ao domínio Exames (`exams`), não a `patient_documents`; a preferência pelo solicitante é
 * aplicada lá. Espelhá-la aqui criaria uma segunda regra sobre documentos que este domínio nunca recebe.
 *
 * Cai em `issuer` quando os campos novos estão vazios — todo documento anterior à migração 151. Assim eles
 * continuam legíveis pelo campo antigo, em vez de passarem a aparecer sem nome nenhum.
 */
export function documentPrimaryName(doc: {
  professional_name?: string | null
  institution_name?: string | null
  issuer?: string | null
}): string | null {
  return doc.professional_name?.trim() || doc.institution_name?.trim() || doc.issuer?.trim() || null
}

/** A instituição, quando ela existe E não é o que já foi mostrado. Vem depois, nunca no lugar do profissional. */
export function documentSecondaryName(doc: {
  professional_name?: string | null
  institution_name?: string | null
  issuer?: string | null
}): string | null {
  const inst = doc.institution_name?.trim() || null
  return inst && inst !== documentPrimaryName(doc) ? inst : null
}

export function documentSubtitle(doc: {
  professional_name?: string | null
  institution_name?: string | null
  issuer?: string | null
  doc_date?: string | null
  created_at?: string | null
  prescribed_items?: string[] | null
}): string {
  // O QUE FOI PRESCRITO VEM PRIMEIRO — "o item mais importante", nas palavras dela. Uma receita identificada
  // só por médico e data obriga a abrir o arquivo para saber do que se trata.
  const itens = prescribedSummary(doc.prescribed_items)
  const partes = [
    itens,
    documentPrimaryName(doc),
    documentSecondaryName(doc),
    formatDate(doc.doc_date),
  ].filter(Boolean) as string[]
  if (partes.length > 0) return partes.join(' · ')
  const guardado = formatDate(doc.created_at)
  return guardado ? `Adicionado em ${guardado}` : 'Sem emissor informado'
}

/**
 * O campo de texto do formulário → a lista que vai ao banco.
 *
 * Uma linha por item. Linhas vazias somem, espaços nas pontas somem, e uma lista sem nada vira `null` — porque
 * `[]` afirmaria que a receita foi lida e não prescreve nada, e ausência de leitura não é ausência de conteúdo.
 *
 * Mora no core porque Web e aplicativo editam o MESMO campo: dois analisadores divergiriam na primeira linha
 * em branco, e a mesma receita ficaria com itens diferentes conforme a ponta em que fosse salva.
 */
export function parsePrescribedItems(texto: string | null | undefined): string[] | null {
  const itens = (texto ?? '').split('\n').map(l => l.trim()).filter(Boolean)
  return itens.length ? itens : null
}

/** A lista → o campo de texto, para editar. O inverso exato de `parsePrescribedItems`. */
export function prescribedItemsToText(itens?: readonly string[] | null): string {
  return (itens ?? []).join('\n')
}

/**
 * Os itens prescritos, resumidos para caber num cartão. Dois nomes e a contagem do resto — mais que isso vira
 * parágrafo, e um cartão que vira parágrafo deixa de ser lido.
 */
export function prescribedSummary(itens?: readonly string[] | null): string | null {
  const limpos = (itens ?? []).map(i => i.trim()).filter(Boolean)
  if (limpos.length === 0) return null
  if (limpos.length <= 2) return limpos.join(' · ')
  return `${limpos.slice(0, 2).join(' · ')} +${limpos.length - 2}`
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
  /**
   * O que a receita prescreve, TRANSCRITO do papel ("Losartana 50mg").
   *
   * Pedido da fundadora (30/08): uma receita identificada só por médico e data obriga a abrir o arquivo para
   * saber do que se trata — que é exatamente o trabalho que a plataforma existe para poupar. A leitura já
   * transcrevia isto e o descartava, por não haver onde guardar (migração 151).
   */
  prescribed_items?: string[] | null
  /**
   * QUEM ASSINOU e QUAL INSTITUIÇÃO são fatos diferentes, e a diferença importa por tipo de documento: numa
   * receita interessa quem assinou; num laudo, quem realizou. `issuer` guardava um dos dois e perdia o outro —
   * foi o que fez a clínica aparecer no lugar do médico num atestado.
   */
  professional_name?: string | null
  institution_name?: string | null
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
  prescribed_items: string[] | null
  professional_name: string | null
  institution_name: string | null
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
    // Vazio permanece VAZIO: lista sem itens não é o mesmo que "nada prescrito". Gravar `[]` afirmaria que a
    // receita foi lida e não prescreve nada — falso quando a leitura simplesmente não rodou.
    prescribed_items: doc.prescribed_items?.length ? doc.prescribed_items : null,
    professional_name: doc.professional_name?.trim() || null,
    institution_name: doc.institution_name?.trim() || null,
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
