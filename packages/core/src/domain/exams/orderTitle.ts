// @sintera/core — TÍTULO CLÍNICO de um PEDIDO a partir dos PROCEDIMENTOS/EXAMES solicitados (PEDIDO-002).
// Puro/determinístico e SEM dependências (usável no cliente Web e Mobile, e no servidor). NUNCA usa o nome do
// arquivo. Consolida lateralidade quando semanticamente seguro (Esquerdo+Direito ⇒ bilateral) — mesma regra do
// H-10, aqui reimplementada de forma autocontida sobre a lista de nomes de procedimentos extraídos.

type Side = 'esquerdo' | 'direito'

const LEFT_RE = /\b(esquerd[oa]s?|left)\b/i
const RIGHT_RE = /\b(direit[oa]s?|right)\b/i
const CODE_RE = /\((\d{6,10})\)/
const SIDE_SEGMENT_RE = /\s*[|,;/]\s*(esquerd[oa]s?|direit[oa]s?|left|right)\b.*$/i
const SIDE_WORD_RE = /\b(esquerd[oa]s?|direit[oa]s?|left|right)\b/gi
const QUALIFIER_RE = /\s*[-–—]?\s*\b(unilateral|bilateral)\b/gi

function detectSide(text: string): Side | null {
  const left = LEFT_RE.test(text)
  const right = RIGHT_RE.test(text)
  if (left && !right) return 'esquerdo'
  if (right && !left) return 'direito'
  return null
}

/** Texto-base do procedimento: sem lado, sem código, sem qualificador ("unilateral"/"bilateral"). */
export function orderProcedureBase(text: string): string {
  let s = text ?? ''
  s = s.replace(CODE_RE, ' ')
  s = s.replace(SIDE_SEGMENT_RE, '')
  s = s.replace(SIDE_WORD_RE, ' ')
  s = s.replace(QUALIFIER_RE, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  s = s.replace(/^[\s\-–—|,;/]+/, '').replace(/[\s\-–—|,;/]+$/, '').trim()
  return s
}

const normKey = (base: string): string => base.toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Título do pedido a partir dos nomes dos procedimentos solicitados. Agrupa por procedimento (base sem lado);
 * dois lados complementares ⇒ "— bilateral"; um lado ⇒ aquele lado; sem lado ⇒ só a base. Procedimentos
 * DIFERENTES são unidos por " · " (nunca fundidos em bilateral). Retorna null quando não há procedimento
 * utilizável (o chamador NÃO deve cair no filename então).
 */
export function deriveOrderTitle(procedureNames: (string | null | undefined)[]): string | null {
  const groups = new Map<string, { base: string; sides: Set<Side> }>()
  const order: string[] = []
  for (const raw of procedureNames ?? []) {
    const val = (raw ?? '').trim()
    if (!val) continue
    const base = orderProcedureBase(val)
    if (!base) continue
    const key = normKey(base)
    let g = groups.get(key)
    if (!g) { g = { base, sides: new Set<Side>() }; groups.set(key, g); order.push(key) }
    const side = detectSide(val)
    if (side) g.sides.add(side)
    if (base.length > g.base.length) g.base = base
  }
  if (groups.size === 0) return null
  const titles = order.map(key => {
    const g = groups.get(key)!
    const hasL = g.sides.has('esquerdo'), hasR = g.sides.has('direito')
    if (hasL && hasR) return `${g.base} — bilateral`
    if (hasL) return `${g.base} — esquerdo`
    if (hasR) return `${g.base} — direito`
    return g.base
  })
  return titles.join(' · ')
}

/**
 * FUNÇÃO ÚNICA de título de exibição do PEDIDO — usada por LISTA e DETALHE, em Web e Mobile (sem divergência).
 * Prefixa "Pedido de " ao título clínico derivado dos procedimentos solicitados. Ex.: "Pedido de Doppler colorido
 * venoso de membro inferior — bilateral".
 *
 * NOTA DE NOMENCLATURA: o prefixo "Pedido de " é uma decisão de PRODUTO da SINTERA (rótulo compreensível para a
 * usuária) — NÃO uma exigência do FHIR/RNDS. A semântica interoperável (o documento é uma SOLICITAÇÃO de
 * procedimento — ServiceRequest, não o resultado) vive na REPRESENTAÇÃO INTERNA (document_type=medical_order,
 * separação pedido×resultado), não na string da interface.
 *
 * Retorna null quando não há procedimento utilizável (o chamador NUNCA deve cair no nome do arquivo — usa um
 * fallback controlado). A primeira letra do título clínico é minusculizada, exceto quando é sigla (RM/USG/TC) ou
 * nome próprio (Doppler), para ler "Pedido de Doppler…" e também "Pedido de ultrassonografia…".
 */
export function deriveOrderDisplayTitle(procedureNames: (string | null | undefined)[]): string | null {
  const clinical = deriveOrderTitle(procedureNames)
  if (!clinical) return null
  return `Pedido de ${lowerLeadIfCommon(clinical)}`
}

// Nomes próprios comuns em exames de imagem/procedimentos que devem PRESERVAR a maiúscula após "Pedido de".
const PROPER_NOUNS = new Set(['doppler', 'holter', 'mapa', 'papanicolau', 'wada', 'schirmer'])

/** Minusculiza a primeira letra, exceto quando a palavra inicial é sigla (RM/USG/TC) ou nome próprio (Doppler). */
function lowerLeadIfCommon(title: string): string {
  const firstWord = title.split(/\s+/, 1)[0] ?? ''
  const isAcronym = /^[A-ZÀ-Ý]{2,}$/.test(firstWord)          // sigla toda em maiúsculas (RM, USG, TC)
  const isProperNoun = PROPER_NOUNS.has(firstWord.toLowerCase())
  if (isAcronym || isProperNoun) return title
  return `${title.charAt(0).toLowerCase()}${title.slice(1)}`
}
