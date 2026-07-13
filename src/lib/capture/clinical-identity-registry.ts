// Clinical Identity Registry — 5ª etapa (Identidade Clínica; após a Identidade Documental).
//
// Fundadora (CEF §3.0): identificar a modalidade por ENSEMBLE de evidências (auditável), não por um LLM
// sozinho (caixa-preta). Cada modalidade traz nomes/sinônimos, evidências FORTES e MODERADAS com PESO,
// fabricantes e o EXTRATOR correspondente. Produz um SCORE; o LLM é apenas MAIS UMA evidência (integração
// posterior). Escala por CONTEÚDO (novo exame = novo registro), não por código. Multi-match forte =
// possivelmente N documentos (fala com a Segmentação). Abaixo do limiar → `unknown` (draft).
//
// Determinístico; AUDITÁVEL (retorna as evidências que casaram e por quê).

export interface ModalityEntry {
  clinicalType: string          // ex.: "Mamografia"
  clinicalFamily: string        // ex.: "Imagem — mama"
  extractor: string             // leitor do CEF a chamar (M5)
  strong: RegExp[]              // evidências fortes (peso 3)
  moderate: RegExp[]            // evidências moderadas (peso 1)
  manufacturers?: RegExp[]      // fabricantes reconhecidos (peso 2)
}

// Registro por modalidade — começar pelas de EVIDÊNCIA REAL (casos GS); cresce puxado pelo CRC.
export const CLINICAL_IDENTITY_REGISTRY: ModalityEntry[] = [
  {
    clinicalType: 'Mamografia', clinicalFamily: 'Imagem — mama', extractor: 'MammographyExtractor',
    strong: [/bi-?rads/i, /mamografia/i, /mastografia/i, /cr[âa]nio-?caudal/i, /\bMLO\b/, /\bCC\b/, /eklund/i, /digital\s+mammography/i],
    moderate: [/calcifica[çc]/i, /par[êe]nquima\s+mam/i, /mama\s+(direita|esquerda)/i, /n[óo]dulo/i],
    manufacturers: [/hologic/i, /lorad/i, /selenia/i],
  },
  {
    clinicalType: 'Ultrassonografia', clinicalFamily: 'Imagem — ultrassom', extractor: 'UltrasoundExtractor',
    strong: [/ultrassonografia/i, /ultrassom/i, /ultra-?som/i, /ecodoppler/i, /\bdoppler\b/i],
    moderate: [/ecotextura/i, /modo\s+bidimensional/i, /transdutor/i, /ecogenicidade/i],
  },
  {
    clinicalType: 'Tomografia de córnea (Pentacam)', clinicalFamily: 'Oftalmologia', extractor: 'CorneaTomographyExtractor',
    strong: [/pentacam/i, /\bBAD-?D\b/i, /pachymetry|paquimetria/i, /belin/i, /\bKmax\b/i, /topografia\s+de\s+c[óo]rnea/i],
    moderate: [/\bK1\b/, /\bK2\b/, /ceratometria/i, /elevac[ãa]o/i, /ectas/i],
    manufacturers: [/oculus/i],
  },
  {
    clinicalType: 'Eletroencefalograma', clinicalFamily: 'Neurofisiologia', extractor: 'EEGExtractor',
    strong: [/eletroencefalograma/i, /\bEEG\b/, /mapeamento\s+cerebral/i],
    moderate: [/ritmo\s+(de\s+base|alfa)/i, /hiperventila[çc]/i, /fotoestimula[çc]/i, /descargas?\s+epileptiform/i],
  },
  {
    clinicalType: 'Laboratorial', clinicalFamily: 'Laboratório', extractor: 'LaboratoryExtractor',
    strong: [/valor(?:es)?\s+de\s+refer[êe]ncia/i, /\bmg\/dL\b/, /\bng\/mL\b/i, /material\s*[-–:]\s*(sangue|urina|soro)/i],
    moderate: [/m[ée]todo\s*:/i, /resultado\s*:/i, /coleta/i],
  },
]

export interface ClinicalIdentity {
  clinicalType: string | null
  clinicalFamily: string | null
  extractor: string | null
  /** 0..1 (score do vencedor sobre um teto de saturação). */
  score: number
  confidence: 'high' | 'medium' | 'low'
  /** Evidências que casaram (auditoria). */
  matched: string[]
  /** true quando 2+ modalidades pontuam forte — possivelmente N documentos (ver Segmentação). */
  ambiguous: boolean
}

const SCORE_STRONG = 3, SCORE_MODERATE = 1, SCORE_MANUF = 2
const SATURATION = 9 // teto para normalizar (≈ 3 evidências fortes)
const MIN_SCORE = 3  // abaixo disto → unknown (draft)

function scoreEntry(text: string, e: ModalityEntry): { score: number; matched: string[] } {
  let score = 0
  const matched: string[] = []
  for (const re of e.strong) if (re.test(text)) { score += SCORE_STRONG; matched.push(re.source) }
  for (const re of e.moderate) if (re.test(text)) { score += SCORE_MODERATE; matched.push(re.source) }
  for (const re of e.manufacturers ?? []) if (re.test(text)) { score += SCORE_MANUF; matched.push(re.source) }
  return { score, matched }
}

/**
 * Identifica a modalidade clínica por ensemble de evidências. Determinístico e auditável.
 */
export function identifyClinical(text: string | null | undefined): ClinicalIdentity {
  const t = (text ?? '')
  const scored = CLINICAL_IDENTITY_REGISTRY
    .map(e => ({ e, ...scoreEntry(t, e) }))
    .sort((a, b) => b.score - a.score)

  const top = scored[0]
  const second = scored[1]

  if (!top || top.score < MIN_SCORE) {
    return { clinicalType: null, clinicalFamily: null, extractor: null, score: 0, confidence: 'low', matched: [], ambiguous: false }
  }

  // Ambiguidade: 2ª modalidade também pontua forte (≥ MIN_SCORE) e perto do topo.
  const ambiguous = !!second && second.score >= MIN_SCORE && second.score >= top.score - 1
  const norm = Math.min(top.score / SATURATION, 1)
  const confidence: ClinicalIdentity['confidence'] =
    ambiguous ? 'low' : norm >= 0.66 ? 'high' : norm >= 0.34 ? 'medium' : 'low'

  return {
    clinicalType: top.e.clinicalType,
    clinicalFamily: top.e.clinicalFamily,
    extractor: top.e.extractor,
    score: norm,
    confidence,
    matched: top.matched,
    ambiguous,
  }
}
