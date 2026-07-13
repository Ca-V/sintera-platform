// Análise Estrutural — 2ª etapa do pipeline (após a Ingestão/Bundle; antes da Segmentação).
//
// Princípio da Descoberta antes da Extração (GOVERNANCA): a plataforma NUNCA extrai antes de compreender
// a ESTRUTURA do documento. Esta etapa é READ-ONLY e é ENGENHARIA DA INFORMAÇÃO — não interpreta medicina.
// Ela apenas OBSERVA a organização física/lógica do material e produz uma REPRESENTAÇÃO ESTRUTURAL
// TRANSITÓRIA (StructuralRepresentation) sobre a qual a Segmentação opera (nunca sobre páginas cruas).
//
// Format-agnostic por design (hoje: texto de PDF/imagem já reparado; amanhã: DICOM/HL7/FHIR/XML alimentam
// a mesma StructuralRepresentation por outros adaptadores). Determinística: mesmo texto → mesma saída.

// Natureza estrutural do documento (engenharia da informação, não clínica):
//  results = laudo tabular (MATERIAL/RESULTADO/faixa de referência) · narrative = laudo textual
//  (indicação/técnica/achados/conclusão) · unknown = sem sinal claro.
export type StructuralKind = 'results' | 'narrative' | 'unknown'

export type StructuralBlockKind =
  | 'exam_header'   // cabeçalho/nome de um exame (ex.: "GLICEMIA - JEJUM")
  | 'result'        // uma unidade de RESULTADO
  | 'material'      // bloco de MATERIAL/amostra (ex.: "MATERIAL - SANGUE")
  | 'reference'     // faixa de referência
  | 'method'        // método
  | 'signature'     // assinatura/CRM do responsável
  | 'page_marker'   // marcador "página X de Y"

export interface StructuralBlock {
  kind: StructuralBlockKind
  page?: number
  text: string
}

export interface StructuralRepresentation {
  pageCount: number
  hasText: boolean
  hasImages: boolean
  /** Natureza estrutural (results/narrative/unknown) — usada pela Segmentação. */
  kind: StructuralKind
  /** Ocorrências de "RESULTADO:" — unidades de resultado (base da COBERTURA em laboratório). */
  resultUnits: number
  /** Blocos de "MATERIAL -" (amostras/materiais distintos citados). */
  materialBlocks: number
  /** Nomes de exame detectados (best-effort — cabeçalhos em caixa-alta, sem boilerplate). */
  examHeaders: string[]
  /** Datas distintas encontradas (dd/mm/aaaa e variantes). */
  distinctDates: string[]
  /** Emissores/labs distintos (heurística leve — nomes conhecidos + CRM/CNPJ como âncora). */
  distinctIssuers: string[]
  /** Marcadores "página X de Y" encontrados. */
  pageMarkers: string[]
  /** Assinaturas/CRM detectadas. */
  signatures: number
  /** Todos os blocos estruturais observados. */
  blocks: StructuralBlock[]
}

export interface StructuralAnalysisInput {
  /** Texto do documento (JÁ reparado — sem byte-swap). */
  text: string | null | undefined
  pageCount?: number | null
  hasImages?: boolean
}

// Boilerplate de laudo que NÃO é nome de exame (evita falso cabeçalho) — casa por PREFIXO da linha,
// pois vêm com sufixos ("MATERIAL - SANGUE", "VALORES DE REFERÊNCIA: …").
const HEADER_BOILERPLATE_RE =
  /^(MATERIAL|RESULTADOS?|VALOR(ES)?\s+DE\s+REFER[ÊE]NCIA|M[ÉE]TODO|FAIXA\s+ET[ÁA]RIA|HOR[ÁA]RIO\s+DA\s+COLETA|DATA\s+DA\s+COLETA|RESULTADO\s+DE\s+EXAMES|RESULTADODEEXAMES|RESPONS[ÁA]VEL|LIBERADO|HORAS?|ANOS?|DIAS?|HOMEM|MULHER|MASCULINO|FEMININO|OS\s+VALORES)/i

const norm = (s: string): string => s.replace(/\s+/g, ' ').trim()
const foldUpper = (s: string): string =>
  norm(s).toUpperCase().replace(/[.:,;]+$/, '')

// Emissores/labs reconhecidos (lista de sanidade DOCUMENTAL — não é o registro clínico).
const KNOWN_ISSUERS = [
  'hermes pardini', 'fleury', 'dasa', 'sabin', 'lavoisier', 'delboni', 'axial', 'sava',
  'unimed', 'einstein', 'sírio', 'sirio', 'oswaldo cruz', 'cdb', 'alta diagnósticos', 'alta diagnosticos',
]

// Natureza estrutural (results vs narrative) — sinais estruturais, não clínicos.
const RE_RESULTS_KIND = /\bMATERIAL\s*[-–:]|\bRESULTADO\s*:|\bVALOR(?:ES)?\s+DE\s+REFER[ÊE]NCIA|\bM[ÉE]TODO\s*:/i
const RE_NARRATIVE_KIND = /indica[çc][ãa]o\s+cl[íi]nica|achados|conclus[ãa]o|t[ée]cnica|impress[ãa]o\s+diagn|ecotextura|par[êe]nquima/i

function detectKind(text: string): StructuralKind {
  if (RE_RESULTS_KIND.test(text)) return 'results' // precedência (laudo lab pode citar "conclusão")
  if (RE_NARRATIVE_KIND.test(text)) return 'narrative'
  return 'unknown'
}

const RE_RESULT   = /\bRESULTADO\s*:/gi
const RE_MATERIAL = /\bMATERIAL\s*[-–:]/gi
const RE_DATE     = /\b(\d{2})[/.\-](\d{2})[/.\-](\d{2,4})\b/g
const RE_PAGEMARK = /p[áa]gina\s+\d+\s+de\s+\d+/gi
const RE_SIGNATURE = /\bCRM\b|\bCRF\b|\bCRBM\b|respons[áa]vel\s+t[ée]cnico/gi

function countMatches(text: string, re: RegExp): number {
  const m = text.match(re)
  return m ? m.length : 0
}

/**
 * Produz a REPRESENTAÇÃO ESTRUTURAL TRANSITÓRIA do documento. Read-only, determinística, sem juízo clínico.
 * É a base da Segmentação (quantas unidades) e da Cobertura (quantas dentro de cada unidade foram lidas).
 */
export function structuralAnalysis(input: StructuralAnalysisInput): StructuralRepresentation {
  const text = norm(input.text ?? '')
  const hasText = text.length > 0
  const pageCount = input.pageCount ?? (hasText ? 1 : 0)

  const blocks: StructuralBlock[] = []

  // Datas distintas (normalizadas para dd/mm/aaaa; ano 2 dígitos preservado como veio).
  const dateSet = new Set<string>()
  for (const m of text.matchAll(RE_DATE)) {
    dateSet.add(`${m[1]}/${m[2]}/${m[3]}`)
    blocks.push({ kind: 'page_marker', text: m[0] }) // (data também é sinal de fronteira)
  }

  // Emissores conhecidos (âncora leve). Distintos.
  const lower = text.toLowerCase()
  const issuerSet = new Set<string>()
  for (const name of KNOWN_ISSUERS) {
    if (lower.includes(name)) issuerSet.add(name)
  }

  const pageMarkers = text.match(RE_PAGEMARK) ?? []
  const resultUnits = countMatches(text, RE_RESULT)
  const materialBlocks = countMatches(text, RE_MATERIAL)
  const signatures = countMatches(text, RE_SIGNATURE)

  // Cabeçalhos de exame (best-effort): linhas majoritariamente em CAIXA-ALTA, sem boilerplate,
  // que costumam preceder um "RESULTADO:". Não é a base da contagem (essa é resultUnits) — é apoio.
  const examHeaders: string[] = []
  const seenHeaders = new Set<string>()
  for (const rawLine of (input.text ?? '').split('\n')) {
    const line = norm(rawLine)
    if (line.length < 4 || line.length > 80) continue
    const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, '')
    if (letters.length < 3) continue
    const upperRatio = letters.replace(/[^A-ZÀ-Þ]/g, '').length / letters.length
    if (upperRatio < 0.7) continue // precisa ser majoritariamente maiúsculo
    const key = foldUpper(line)
    if (HEADER_BOILERPLATE_RE.test(key)) continue
    if (/^\d/.test(key) || /^(DR|DRA|CRM|CNPJ|CEP|TEL|END|R\.)/.test(key)) continue
    if (seenHeaders.has(key)) continue
    seenHeaders.add(key)
    examHeaders.push(line)
    blocks.push({ kind: 'exam_header', text: line })
  }

  return {
    pageCount,
    hasText,
    hasImages: !!input.hasImages,
    kind: detectKind(input.text ?? ''),
    resultUnits,
    materialBlocks,
    examHeaders,
    distinctDates: [...dateSet],
    distinctIssuers: [...issuerSet],
    pageMarkers,
    signatures,
    blocks,
  }
}
