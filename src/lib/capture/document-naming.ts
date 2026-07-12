// Content Classifier — Convenção de nomenclatura documental (CAP-002 §Content Classifier).
//
// REGRA DE DOMÍNIO (fundadora, 12/07/2026): o nome de um registro representa o DOCUMENTO,
// NUNCA um dos seus resultados internos. É vedado nomear um painel pelo primeiro biomarcador
// (bug real: painel de sangue+urina do Hermes Pardini nomeado "IgE específico para látex").
//
// A IA NÃO inventa o título — ela apenas descreve a ESTRUTURA do documento
// ({ documentType, examCount, singleExamName, modality }). A regra de nomenclatura vive AQUI,
// no domínio da aplicação, e é DETERMINÍSTICA (mesma estrutura → mesmo nome, sempre).
//
// Reutilizável por TODO adaptador do Capture Hub (Exames, Condições, Medicamentos, Inbox…),
// não só pelo pipeline de exames.

export type DocumentType =
  | 'laboratory_single'   // um único exame laboratorial (ex.: TSH isolado)
  | 'laboratory_panel'    // vários exames num só documento (sangue, urina, misto)
  | 'laboratory_urine'    // exame de urina isolado
  | 'imaging'             // exame de imagem (RM, TC, US, RX…)
  | 'anatomopathology'    // laudo anatomopatológico / histopatológico
  | 'medical_report'      // relatório/laudo médico textual
  | 'prescription'        // receita médica
  | 'vaccination'         // comprovante de vacinação
  | 'attestation'         // atestado médico
  | 'unknown'

/** Estrutura do documento — o que a IA descreve. NÃO contém um "título" pronto. */
export interface DocumentStructure {
  documentType: DocumentType
  /** Nº de exames DISTINTOS no documento (não de biomarcadores). Painel > 1. */
  examCount: number
  /** Nome do exame quando há apenas um (ex.: "TSH", "Hemograma completo"). */
  singleExamName?: string | null
  /** Modalidade de imagem, quando documentType === 'imaging'. */
  modality?: string | null
}

const FIXED_TITLE: Partial<Record<DocumentType, string>> = {
  anatomopathology: 'Anatomopatológico',
  medical_report:   'Relatório médico',
  prescription:     'Receita médica',
  vaccination:      'Comprovante de vacinação',
  attestation:      'Atestado médico',
}

const PANEL_TITLE = 'Exames laboratoriais'

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Deriva o nome de EXIBIÇÃO do documento a partir da sua estrutura.
 * Determinística — nunca devolve um biomarcador para representar um painel.
 */
export function deriveDisplayTitle(s: DocumentStructure): string {
  // 1. Tipos não-laboratoriais com nome fixo têm precedência.
  if (s.documentType === 'imaging') {
    return clean(s.modality) || 'Exame de imagem'
  }
  const fixed = FIXED_TITLE[s.documentType]
  if (fixed) return fixed

  // 2. Laboratoriais: o CONJUNTO manda. Vários exames → nunca um biomarcador.
  if (s.examCount > 1) return PANEL_TITLE

  if (s.documentType === 'laboratory_urine') return 'Exame de urina'

  // 3. Exame único → o nome do próprio exame.
  const single = clean(s.singleExamName)
  if (single) return single

  // 4. Sem estrutura suficiente: rótulo neutro, seguro (nunca um resultado interno).
  return s.documentType === 'unknown' ? 'Documento' : 'Exame laboratorial'
}

/**
 * Enriquecimento opcional de proveniência: "Exames laboratoriais • Hermes Pardini • 12/07/2026".
 * Mantém o título-base limpo; a emissora/data ficam a cargo de quem exibe.
 */
export function withProvenance(
  title: string,
  meta?: { issuer?: string | null; date?: string | null },
): string {
  const parts = [title]
  const issuer = clean(meta?.issuer)
  if (issuer) parts.push(issuer)
  if (meta?.date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(meta.date)
    if (m) parts.push(`${m[3]}/${m[2]}/${m[1]}`)
  }
  return parts.join(' • ')
}

// ── Classificação a partir da extração de exames laboratoriais/imagem ──────────────
// Ponte entre o extractor atual (que devolve examType livre + biomarcadores com
// sourceExamName) e a DocumentStructure. À medida que a IA passar a devolver
// documentType/examCount explicitamente, esta ponte encolhe — a regra de nome não muda.

const IMAGING_RE = /(resson[âa]ncia|tomografia|ultrassonografia|ultrassom|ultra-som|radiografia|raio.?x|densitometria|mamografia|ecocardiograma|ecodoppler|doppler|cintilografia|pet.?ct|angiografia|imagem)/i
const ANATOMO_RE = /(anatomopatol|histopatol|bi[óo]psia|citol[óo]gic|imuno.?histoqu[íi]mic|papanicolau|colpocitol)/i
const URINE_RE   = /(urina|urin[áa]lise|\beas\b|urocultura|sedimento urin)/i

export interface ExamExtractionLike {
  /** Categoria livre que a IA devolve hoje (parsed.exam_type). */
  examType: string | null
  /** Biomarcadores extraídos; cada um carrega o exame de origem (sourceExamName). */
  biomarkers: Array<{ name: string; sourceExamName: string | null }>
}

/** Conta exames DISTINTOS pelo sourceExamName (fallback: nº de biomarcadores). */
export function distinctExamNames(biomarkers: ExamExtractionLike['biomarkers']): string[] {
  const seen = new Map<string, string>()
  for (const b of biomarkers) {
    const raw = clean(b.sourceExamName)
    if (!raw) continue
    const key = raw.toLowerCase()
    if (!seen.has(key)) seen.set(key, raw)
  }
  return [...seen.values()]
}

export function classifyExamDocument(ex: ExamExtractionLike): DocumentStructure {
  const examType = clean(ex.examType)
  const distinct = distinctExamNames(ex.biomarkers)
  // Sem sourceExamName? cai para a contagem de biomarcadores (proxy conservador).
  const examCount = distinct.length > 0 ? distinct.length : ex.biomarkers.length

  if (examType && IMAGING_RE.test(examType)) {
    return { documentType: 'imaging', examCount: 0, modality: examType }
  }
  if (examType && ANATOMO_RE.test(examType)) {
    return { documentType: 'anatomopathology', examCount: 0 }
  }

  const single = distinct[0] ?? (ex.biomarkers[0]?.sourceExamName ?? null) ?? (examType || null)
  const isUrineOnly =
    examCount <= 1 && URINE_RE.test(single ?? '') && !distinct.some(n => !URINE_RE.test(n))

  if (isUrineOnly) {
    return { documentType: 'laboratory_urine', examCount, singleExamName: single }
  }
  if (examCount > 1) {
    return { documentType: 'laboratory_panel', examCount, singleExamName: single }
  }
  return { documentType: 'laboratory_single', examCount, singleExamName: single }
}
