// Content Classifier — Convenção de nomenclatura documental (CAP-002 §Content Classifier).
//
// REGRA DE DOMÍNIO (fundadora, 12/07/2026), a partir de bug real: um painel de sangue+urina
// do Hermes Pardini foi nomeado "IGE Específico para Látex" — um único biomarcador
// representando um documento composto. O nome do registro representa o DOCUMENTO, nunca um
// resultado interno.
//
// Algoritmo (fundadora): classificar documento → identificar CATEGORIA documental → aplicar
// convenção de nomenclatura. NÃO apenas "contar exames". A IA descreve a estrutura; o nome
// é DETERMINÍSTICO e vive AQUI, no domínio — reutilizável por todo adaptador do Capture Hub.
//
// Conceitos SEPARADOS (para não misturar categorias):
//   • documentType  — a MÍDIA/categoria do documento (laboratory, imaging, prescription…)
//   • documentScope — a abrangência (single | panel | mixed)
//   • clinicalCategory — agrupamento clínico do painel (ex.: "hormonal") → "Painel hormonal".
//     Reservado: só é populado quando conseguimos identificar o agrupamento com segurança;
//     enquanto nulo, painel laboratorial cai para "Exames laboratoriais".

export type DocumentType =
  | 'laboratory'
  | 'imaging'
  | 'neurophysiology'   // EEG, mapeamento cerebral, ENMG…
  | 'ophthalmology'     // retinografia, OCT, topografia de córnea, campimetria…
  | 'cardiology'        // ECG, Holter, MAPA, ergometria…
  | 'endoscopy'         // endoscopia, colonoscopia…
  | 'anatomopathology'
  | 'medical_report'
  | 'prescription'
  | 'vaccination'
  | 'omics'
  | 'attestation'
  | 'medical_order'     // pedido/solicitação/requisição de exame
  | 'insurance_guide'   // guia de convênio (SADT)
  | 'unknown'

export type DocumentScope = 'single' | 'panel' | 'mixed'

export interface DocumentStructure {
  documentType: DocumentType
  documentScope: DocumentScope
  /** Nº de exames DISTINTOS identificados (por source_exam_name). 0 = não classificável. */
  examCount: number
  /** Nome do exame quando há apenas um (ex.: "Hemograma", "TSH"). */
  singleExamName?: string | null
  /** Texto da modalidade de imagem, quando documentType === 'imaging'. */
  modality?: string | null
  /** Agrupamento clínico do painel (ex.: "hormonal"). Reservado; ver nota no topo. */
  clinicalCategory?: string | null
}

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

const URINE_RE   = /(urina|urin[áa]lise|\beas\b|urocultura|sedimento urin)/i
const IMAGING_RE = /(resson[âa]ncia|tomografia|ultrassonografia|ultrassom|ultra-som|radiografia|raio.?x|densitometria|mamografia|ecocardiograma|ecodoppler|doppler|cintilografia|pet.?ct|angiografia|imagem)/i
const ANATOMO_RE = /(anatomopatol|histopatol|bi[óo]psia|citol[óo]gic|imuno.?histoqu[íi]mic|papanicolau|colpocitol)/i

function isUrine(name: string | null | undefined): boolean {
  return URINE_RE.test(name ?? '')
}

// Categorias reconhecidas por palavra-chave (nome do exame OU texto do laudo). O nome do
// registro passa a ser o do próprio exame. Ordem importa: PEDIDO/GUIA primeiro (um pedido
// pode citar nomes de exames), depois exames especializados. Sem juízo clínico (RDC 657).
const CATEGORY_RULES: { type: DocumentType; re: RegExp; label: string }[] = [
  // Pedido / solicitação / guia de convênio (documento = uma SOLICITAÇÃO, não resultado).
  { type: 'insurance_guide', re: /guia\s*(sadt|de\s*(conv[êe]nio|autoriza[çc][ãa]o|servi[çc]os?))/i, label: 'Guia de convênio' },
  { type: 'medical_order',   re: /pedido\s*(m[ée]dico|de\s*exames?)|solicita[çc][ãa]o\s*de\s*exames?|requisi[çc][ãa]o\s*(de\s*exames?|m[ée]dica)/i, label: 'Pedido médico' },
  // Neurofisiologia.
  { type: 'neurophysiology', re: /eletroencefalograma|\beeg\b/i, label: 'Eletroencefalograma' },
  { type: 'neurophysiology', re: /mapeamento\s*cerebral/i, label: 'Mapeamento cerebral' },
  { type: 'neurophysiology', re: /eletroneuromiografia|\benmg\b|eletromiografia/i, label: 'Eletroneuromiografia' },
  { type: 'neurophysiology', re: /potencial\s*evocado/i, label: 'Potencial evocado' },
  // Oftalmologia.
  { type: 'ophthalmology', re: /retinografia|mapeamento\s*de\s*retina/i, label: 'Mapeamento de retina' },
  { type: 'ophthalmology', re: /(topografia|tomografia|paquimetria)\s*(de\s*)?c[óo]rnea/i, label: 'Exame de córnea' },
  { type: 'ophthalmology', re: /\boct\b|tomografia\s*de\s*coer[êe]ncia\s*[óo]ptica/i, label: 'OCT (tomografia de coerência óptica)' },
  { type: 'ophthalmology', re: /campimetria|campo\s*visual/i, label: 'Campimetria' },
  { type: 'ophthalmology', re: /fundoscopia|fundo\s*de\s*olho|biomicroscopia|mapeamento\s*de\s*fundo/i, label: 'Exame oftalmológico' },
  // Cardiologia gráfica.
  { type: 'cardiology', re: /eletrocardiograma|\becg\b/i, label: 'Eletrocardiograma' },
  { type: 'cardiology', re: /\bholter\b/i, label: 'Holter 24h' },
  { type: 'cardiology', re: /monitoriza[çc][ãa]o\s*ambulatorial\s*da\s*press|\bm\.?a\.?p\.?a\b/i, label: 'MAPA' },
  { type: 'cardiology', re: /teste\s*ergom[ée]trico|ergometria/i, label: 'Teste ergométrico' },
  // Endoscopia.
  { type: 'endoscopy', re: /colonoscopia/i, label: 'Colonoscopia' },
  { type: 'endoscopy', re: /endoscopia\s*digestiva|endoscopia/i, label: 'Endoscopia digestiva' },
  { type: 'endoscopy', re: /broncoscopia/i, label: 'Broncoscopia' },
  { type: 'endoscopy', re: /colposcopia/i, label: 'Colposcopia' },
]

function detectCategory(haystack: string): { documentType: DocumentType; name: string } | null {
  for (const r of CATEGORY_RULES) {
    if (r.re.test(haystack)) return { documentType: r.type, name: r.label }
  }
  return null
}

/** Normaliza a modalidade de imagem para o nome canônico (tabela da fundadora). */
export function normalizeModality(modality: string | null | undefined): string {
  const m = clean(modality)
  if (!m) return 'Exame de imagem'
  // Abreviações padrão (maiúsculas, palavra isolada) — só aqui, já sabendo que é imagem.
  if (/resson[âa]ncia/i.test(m) || /\bRM\b/.test(m))   return 'Ressonância magnética'
  if (/tomografia|pet.?ct/i.test(m) || /\bTC\b/.test(m)) return 'Tomografia computadorizada'
  if (/ultrassonografia|ultrassom|ultra-som|doppler/i.test(m) || /\bUS\b/.test(m)) return 'Ultrassonografia'
  if (/mamografia/i.test(m))                           return 'Mamografia'
  if (/densitometria/i.test(m))                        return 'Densitometria óssea'
  if (/ecocardiograma/i.test(m))                       return 'Ecocardiograma'
  if (/cintilografia/i.test(m))                        return 'Cintilografia'
  if (/radiografia|raio.?x/i.test(m) || /\bRX\b/.test(m)) return 'Radiografia'
  return m // texto original quando não reconhecida (factual, sem inventar)
}

/**
 * Deriva o nome de EXIBIÇÃO a partir da CATEGORIA + ESCOPO do documento.
 * Determinística — nunca devolve um biomarcador para representar um painel.
 */
export function deriveDisplayTitle(s: DocumentStructure): string {
  switch (s.documentType) {
    case 'imaging':          return normalizeModality(s.modality)
    case 'anatomopathology': return 'Anatomopatológico'
    case 'medical_report':   return 'Relatório médico'
    case 'prescription':     return 'Receita médica'
    case 'vaccination':      return 'Comprovante de vacinação'
    case 'attestation':      return 'Atestado médico'
    case 'omics':            return 'Análise ômica'
    // Exames especializados: o nome é o do próprio exame (definido pelo classifier).
    case 'neurophysiology':
    case 'ophthalmology':
    case 'cardiology':
    case 'endoscopy':        return clean(s.singleExamName) || 'Exame'
    case 'medical_order': {
      // Sinaliza que é uma SOLICITAÇÃO (não resultado), mantendo o exame pedido.
      const n = clean(s.singleExamName)
      return n && !/^pedido/i.test(n) ? `Pedido — ${n}` : (n || 'Pedido médico')
    }
    case 'insurance_guide':  return 'Guia de convênio'
    case 'laboratory': {
      if (s.documentScope === 'single') {
        const name = clean(s.singleExamName)
        if (isUrine(name)) return 'Urina tipo I'
        return name || 'Exame laboratorial'
      }
      // panel | mixed → representa o CONJUNTO, nunca um resultado interno.
      const cat = clean(s.clinicalCategory)
      if (cat && s.documentScope === 'panel') return `Painel ${cat.toLowerCase()}`
      return 'Exames laboratoriais'
    }
    default:                 return 'Documento'
  }
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
// Ponte entre o extractor atual (examType livre + biomarcadores com sourceExamName) e a
// DocumentStructure. À medida que a IA passar a devolver documentType/scope explícitos,
// esta ponte encolhe — a regra de nome não muda.

export interface ExamExtractionLike {
  examType: string | null
  biomarkers: Array<{ name: string; sourceExamName: string | null }>
  /** Texto do laudo — usado p/ reconhecer categorias sem biomarcadores (EEG, oftalmo…). */
  text?: string | null
}

/** Conta exames DISTINTOS pelo sourceExamName (um hemograma = 1 exame, não N biomarcadores). */
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
  const examCount = distinct.length

  // Categoria por palavra-chave. Com biomarcadores, só o examType decide (é laboratorial);
  // SEM biomarcadores, o texto do laudo também conta (EEG/oftalmo/pedido não têm biomarcador).
  const haystack = examCount === 0
    ? `${examType} ${clean(ex.text).slice(0, 2000)}`
    : examType
  const cat = detectCategory(haystack)
  if (cat) {
    return { documentType: cat.documentType, documentScope: 'single', examCount: 0, singleExamName: cat.name }
  }

  if (examType && IMAGING_RE.test(examType)) {
    return { documentType: 'imaging', documentScope: 'single', examCount: 0, modality: examType }
  }
  if (examType && ANATOMO_RE.test(examType)) {
    return { documentType: 'anatomopathology', documentScope: 'single', examCount: 0 }
  }

  // examCount = exames DISTINTOS reais; sem source_exam_name → 0 (não classificável).
  const single = distinct[0] ?? (ex.biomarkers[0]?.sourceExamName ?? null) ?? (examType || null)

  if (examCount <= 1) {
    return { documentType: 'laboratory', documentScope: 'single', examCount, singleExamName: single }
  }

  const hasUrine = distinct.some(isUrine)
  const hasNonUrine = distinct.some(n => !isUrine(n))
  const scope: DocumentScope = hasUrine && hasNonUrine ? 'mixed' : 'panel'
  return { documentType: 'laboratory', documentScope: scope, examCount, singleExamName: single }
}
