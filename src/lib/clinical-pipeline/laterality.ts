// Consolidação de LATERALIDADE — regra de REPRESENTAÇÃO estrutural (não seleção de fato conflitante).
//
// Problema real (H-10, pedido ab5b5816): uma guia com o MESMO procedimento em duas linhas —
//   "Doppler colorido venoso de membro inferior - unilateral | Esquerdo (40901483)"
//   "Doppler colorido venoso de membro inferior - unilateral | Direito  (40901483)"
// foi colapsada pelo modelo da DUE ao "texto comum", que MANTÉM o descritor por-linha "unilateral" e
// DESCARTA os lados. As lateralidades continuam PRESERVADAS nas OBSERVAÇÕES (fonte rastreável); aqui a
// ORQUESTRAÇÃO as CONSOLIDA: dois lados complementares (Esquerdo + Direito) ⇒ bilateral.
//
// PRINCÍPIOS (governança H-10 — aprovados):
//  • NÃO é substituição textual unilateral→bilateral: a lateralidade é INFERIDA da EVIDÊNCIA (observações).
//  • Chave de procedimento CONFIÁVEL primeiro (código TUSS quando houver); texto-base como complemento.
//  • Lado detectado por PALAVRA no contexto da observação (esquerdo/direito/left/right) — nunca letra isolada.
//  • Só consolida DENTRO do mesmo procedimento (mesma chave) e do MESMO documento (as observações recebidas).
//  • bilateral só quando os DOIS lados estão presentes; um lado → aquele lado; sem lado → NÃO inventa.
//  • Ao consolidar, remove o qualificador por-linha ("unilateral") da REPRESENTAÇÃO; a evidência fica intacta.
//  • Genérico: vale para QUALQUER procedimento com ocorrências de lados complementares (não é regra do Doppler).
import type { Observation } from '@/lib/capture/document-understanding'

export type Side = 'esquerdo' | 'direito'
export type Laterality = 'esquerdo' | 'direito' | 'bilateral'

export interface LateralityConsolidation {
  name: string                  // nome consolidado: "<base> — <lateralidade>"
  laterality: Laterality
  sides: Side[]                 // lados observados (ordem estável: esquerdo, direito)
  key: string                   // chave do procedimento consolidado (TUSS quando houver)
  observationIds: string[]      // observações que sustentam a consolidação (evidência preservada)
}

// Lado por PALAVRA (Ajuste A): esquerd*/direit*/left/right. Nunca letra isolada (\bE\b/\bD\b) — evita falso
// positivo. "Lateral"/"Medial"/"Anterior"/"Posterior" NÃO casam (não contêm as palavras de lado).
const LEFT_RE  = /\b(esquerd[oa]s?|left)\b/i
const RIGHT_RE = /\b(direit[oa]s?|right)\b/i
// Código de procedimento entre parênteses (TUSS = 8 dígitos; range tolerante a variações de tabela).
const CODE_RE  = /\((\d{6,10})\)/
// Segmento de lado a partir de um separador ("| Esquerdo", ", Direito", "/ left"…) — corta ele e o que vier depois.
const SIDE_SEGMENT_RE = /\s*[|,;/]\s*(esquerd[oa]s?|direit[oa]s?|left|right)\b.*$/i
// Palavra de lado remanescente (sem separador).
const SIDE_WORD_RE = /\b(esquerd[oa]s?|direit[oa]s?|left|right)\b/gi
// Qualificador de lateralidade por-linha (o descritor do procedimento, ex.: TUSS "…- unilateral").
const QUALIFIER_RE = /\s*[-–—]?\s*\b(unilateral|bilateral)\b/gi

/** Lado explícito de UMA ocorrência (null quando ausente OU ambíguo — ambos os lados no mesmo texto). */
function detectSide(text: string): Side | null {
  const left = LEFT_RE.test(text)
  const right = RIGHT_RE.test(text)
  if (left && !right) return 'esquerdo'
  if (right && !left) return 'direito'
  return null // nenhum, ou ambíguo → não conta como ocorrência lateralizada
}

function extractCode(text: string): string | null {
  const m = CODE_RE.exec(text)
  return m ? m[1] : null
}

/** Texto-base do procedimento: sem lado, sem código, sem qualificador ("unilateral"/"bilateral"). Casing preservado. */
export function stripToBase(text: string): string {
  let s = text ?? ''
  s = s.replace(CODE_RE, ' ')            // remove (código)
  s = s.replace(SIDE_SEGMENT_RE, '')     // corta "| Esquerdo …"
  s = s.replace(SIDE_WORD_RE, ' ')       // remove palavra de lado remanescente
  s = s.replace(QUALIFIER_RE, ' ')       // remove "unilateral"/"bilateral" por-linha
  s = s.replace(/\s+/g, ' ').trim()      // normaliza espaços
  s = s.replace(/^[\s\-–—|,;/]+/, '').replace(/[\s\-–—|,;/]+$/, '').trim() // apara separadores nas bordas
  return s
}

const normKey = (base: string): string => base.toLowerCase().replace(/\s+/g, ' ').trim()

interface Group { key: string; base: string; sides: Side[]; observationIds: string[] }

/**
 * Consolida a lateralidade de um documento a partir das suas OBSERVAÇÕES e do nome atual (colapsado).
 * Puro/determinístico. Retorna null quando não há o que consolidar (nome inalterado).
 */
export function consolidateLaterality(
  currentName: string | null | undefined,
  observations: Observation[] | null | undefined,
): LateralityConsolidation | null {
  const name = (currentName ?? '').trim()
  if (!name) return null

  // 1) Ocorrências de procedimento COM lado explícito (o sinal que autoriza consolidar). Sem lado ⇒ ignorada
  //    (procedimento repetido sem lateralidade → não inferir).
  const groups = new Map<string, Group>()
  for (const o of observations ?? []) {
    const val = (o?.value ?? '').trim()
    if (!val) continue
    const side = detectSide(val)
    if (!side) continue
    const base = stripToBase(val)
    if (!base) continue
    // 2) Chave CONFIÁVEL: TUSS quando houver; senão, base normalizada (Ajuste A).
    const key = extractCode(val) ?? normKey(base)
    const g = groups.get(key) ?? { key, base, sides: [], observationIds: [] }
    if (!g.sides.includes(side)) g.sides.push(side)
    g.observationIds.push(o.id)
    if (base.length > g.base.length) g.base = base // preferir a base mais informativa p/ exibição
    groups.set(key, g)
  }
  if (groups.size === 0) return null

  // 3) Grupo que corresponde ao nome atual (base sem lateralidade). Fallback: grupo único (o nome colapsado
  //    veio dele). Procedimentos DIFERENTES ficam em grupos distintos — nunca são fundidos em "bilateral".
  const target = normKey(stripToBase(name))
  let chosen: Group | null = null
  for (const g of groups.values()) {
    if (normKey(g.base) === target) { chosen = g; break }
  }
  if (!chosen && groups.size === 1) chosen = [...groups.values()][0]
  if (!chosen) return null

  // 4) Consolidar: dois lados ⇒ bilateral; um lado ⇒ aquele lado; nenhum ⇒ não infere (já filtrado acima).
  const hasLeft = chosen.sides.includes('esquerdo')
  const hasRight = chosen.sides.includes('direito')
  const laterality: Laterality = hasLeft && hasRight ? 'bilateral' : hasLeft ? 'esquerdo' : 'direito'

  // 5) Compor: base (do nome atual, casing preservado) + lateralidade consolidada. Remove "unilateral" da
  //    REPRESENTAÇÃO (evidência intacta nas observações). Sem consolidar → nome nunca muda.
  const displayBase = stripToBase(name) || chosen.base
  const sides: Side[] = (['esquerdo', 'direito'] as Side[]).filter(s => chosen!.sides.includes(s))
  return { name: `${displayBase} — ${laterality}`, laterality, sides, key: chosen.key, observationIds: chosen.observationIds }
}
