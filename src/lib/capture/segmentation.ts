// Segmentação — 3ª etapa do pipeline (após a Análise Estrutural; antes da Identidade).
//
// Recebe a REPRESENTAÇÃO ESTRUTURAL (por página) e decide **quantas CDUs (Clinical Document Units)**
// existem e **quais páginas pertencem a cada uma** — SEM extrair e SEM juízo clínico. Opera sobre a
// estrutura, nunca sobre páginas cruas (Princípio da Descoberta antes da Extração).
//
// Fronteira da CDU (GOVERNANCA): 1 CDU = 1 identidade documental + 1 modalidade; sub-elementos
// (resultados de um painel, os 2 olhos de um Pentacam, os grupos de um EEG) vivem DENTRO da CDU.
//   • Documento de RESULTADOS (laboratório: MATERIAL/RESULTADO/faixa de referência) → 1 CDU com N
//     resultados internos (a Cobertura, depois, valida N × estruturados).
//   • Laudos NARRATIVOS distintos (cada um com seu título/modalidade) → N CDUs (1 por laudo).
//
// A Cobertura é um COMPARADOR PURO a jusante — ela NÃO descobre nada aqui.

import { structuralAnalysis, type StructuralRepresentation } from './structural-analysis'

export type CDUKind = 'results' | 'narrative' | 'unknown'

export interface CDU {
  index: number
  /** Páginas (1-based) que compõem esta CDU. */
  pages: number[]
  kind: CDUKind
  /** Título documental (best-effort — o cabeçalho dominante). Não é identidade ainda. */
  title: string | null
  /** Intra-CDU: quantas unidades a ESTRUTURA descobriu (results = nº de RESULTADO; narrativo = 1). */
  discoveredUnits: number
  /** Representação estrutural agregada da CDU. */
  structure: StructuralRepresentation
}

export interface SegmentationResult {
  cdus: CDU[]
  /** Motivo auditável da segmentação. */
  reason: string
}

const RE_RESULTS_KIND = /\bMATERIAL\s*[-–:]|\bRESULTADO\s*:|\bVALOR(?:ES)?\s+DE\s+REFER[ÊE]NCIA|\bM[ÉE]TODO\s*:/i
const RE_NARRATIVE_KIND = /indica[çc][ãa]o\s+cl[íi]nica|achados|conclus[ãa]o|t[ée]cnica|impress[ãa]o\s+diagn|ecotextura|par[êe]nquima/i

function detectKind(text: string): CDUKind {
  const isResults = RE_RESULTS_KIND.test(text)
  const isNarrative = RE_NARRATIVE_KIND.test(text)
  // Results tem precedência quando ambos aparecem (laudo lab pode citar "conclusão").
  if (isResults) return 'results'
  if (isNarrative) return 'narrative'
  return 'unknown'
}

// Título dominante da página: o 1º cabeçalho de exame detectado pela Análise Estrutural.
function pickTitle(struct: StructuralRepresentation): string | null {
  return struct.examHeaders[0] ?? null
}

const foldTitle = (t: string | null): string => (t ?? '').replace(/\s+/g, ' ').trim().toUpperCase()

function aggregate(pages: { struct: StructuralRepresentation }[]): StructuralRepresentation {
  const acc: StructuralRepresentation = {
    pageCount: pages.length,
    hasText: pages.some(p => p.struct.hasText),
    hasImages: pages.some(p => p.struct.hasImages),
    resultUnits: 0, materialBlocks: 0, examHeaders: [], distinctDates: [], distinctIssuers: [],
    pageMarkers: [], signatures: 0, blocks: [],
  }
  const dates = new Set<string>(), issuers = new Set<string>(), headers = new Set<string>()
  for (const { struct: s } of pages) {
    acc.resultUnits += s.resultUnits
    acc.materialBlocks += s.materialBlocks
    acc.signatures += s.signatures
    acc.pageMarkers.push(...s.pageMarkers)
    acc.blocks.push(...s.blocks)
    s.distinctDates.forEach(d => dates.add(d))
    s.distinctIssuers.forEach(i => issuers.add(i))
    s.examHeaders.forEach(h => { if (!headers.has(h.toUpperCase())) { headers.add(h.toUpperCase()); acc.examHeaders.push(h) } })
  }
  acc.distinctDates = [...dates]; acc.distinctIssuers = [...issuers]
  return acc
}

export interface SegmentationInput {
  /** Texto por página (JÁ reparado). O Bundle já montado; nunca páginas cruas. */
  pageTexts: string[]
  hasImages?: boolean
}

/**
 * Divide o Bundle em CDUs. Determinística. Não extrai; não classifica clinicamente.
 */
export function segment(input: SegmentationInput): SegmentationResult {
  const pageTexts = input.pageTexts.length > 0 ? input.pageTexts : ['']
  const pages = pageTexts.map((t, i) => {
    const struct = structuralAnalysis({ text: t, pageCount: 1, hasImages: input.hasImages })
    return { page: i + 1, text: t, struct, kind: detectKind(t), title: pickTitle(struct) }
  })

  const cdus: CDU[] = []
  let cur: typeof pages | null = null
  let curKind: CDUKind | null = null
  let curTitle = ''

  const flush = () => {
    if (!cur || cur.length === 0) return
    const kind = curKind ?? 'unknown'
    const structure = aggregate(cur)
    const discoveredUnits = kind === 'results' ? Math.max(structure.resultUnits, 1) : 1
    cdus.push({
      index: cdus.length + 1,
      pages: cur.map(p => p.page),
      kind,
      title: cur.map(p => p.title).find(Boolean) ?? null,
      discoveredUnits,
      structure,
    })
    cur = null; curKind = null; curTitle = ''
  }

  for (const p of pages) {
    if (cur === null) { cur = [p]; curKind = p.kind; curTitle = foldTitle(p.title); continue }

    // Continua a MESMA CDU quando:
    //  • ambas as páginas são de RESULTADOS (um relatório laboratorial pode ocupar várias páginas → 1 CDU); OU
    //  • narrativo com o MESMO título (laudo multipágina).
    const sameResults = curKind === 'results' && p.kind === 'results'
    const sameNarrative = curKind === 'narrative' && p.kind === 'narrative'
      && curTitle !== '' && foldTitle(p.title) === curTitle
    const continuationUnknown = p.kind === 'unknown' && curKind !== null // anexo/continuação sem sinal próprio

    if (sameResults || sameNarrative || continuationUnknown) {
      cur.push(p)
      if (curTitle === '' && p.title) curTitle = foldTitle(p.title)
    } else {
      flush()
      cur = [p]; curKind = p.kind; curTitle = foldTitle(p.title)
    }
  }
  flush()

  const reason = cdus.length === 1
    ? `1 CDU (${cdus[0].kind}) — ${cdus[0].discoveredUnits} unidade(s) interna(s) descoberta(s).`
    : `${cdus.length} CDUs por fronteiras estruturais (título/modalidade distintos por página).`

  return { cdus, reason }
}
