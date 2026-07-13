// Bundle Split (M3) — planejador PURO de "1 upload → N registros".
//
// Fundadora (13/07): gerar 1 registro por CDU é CONSEQUÊNCIA DIRETA da Segmentação, não uma nova decisão
// de produto. A única decisão de produto remanescente é a UX de confirmar/revisar a segmentação quando
// necessário — por isso: se QUALQUER CDU está em revisão TÉCNICA, NÃO fazemos split automático (fica
// retido para revisão). Nunca "achatar" N exames num só (evidência AXIAL: 3 laudos mesclados).
//
// Determinístico e sem I/O: recebe as CDUs (já certificadas pelo pipeline) + o contexto do exame atual e
// devolve o PLANO. Quem materializa os registros e restringe a extração por página é o Analyze.
//
// Princípios: nenhuma camada compensa a anterior (o split confia na Segmentação/Identity Validator);
// a proveniência do Bundle é preservada (todo registro aponta para o exame-raiz + seu intervalo).

/** Intervalo de páginas (0-based, inclusivo) que um registro/CDU cobre no arquivo de origem. */
export interface PageRange {
  start: number
  end: number
}

/** CDU-irmã a materializar como novo registro (CDUs 2..N do bundle). */
export interface SiblingCdu {
  index: number            // índice 1-based da CDU no bundle
  range: PageRange
  title: string | null
  discoveredUnits: number
}

export interface SplitPlan {
  /** true → materializar as `siblings` como novos registros (bundle multi-CDU, tudo certificado). */
  split: boolean
  /** true → há CDU em revisão TÉCNICA: NÃO faz split automático (retido para revisão — UX de produto). */
  blockedTechnical: boolean
  /** total de CDUs no bundle. */
  count: number
  /** intervalo de páginas que ESTE exame deve processar (CDU#1 na raiz, ou o intervalo já atribuído). */
  thisRange: PageRange | null
  /** CDUs-irmãs (2..N) a criar. Vazio quando não há split. */
  siblings: SiblingCdu[]
}

/** Menor CDU-like que o planejador precisa (evita acoplar ao CertifiedCDU inteiro). */
export interface SplitInputCdu {
  index: number
  pages: number[]
  title: string | null
  discoveredUnits: number
  status: string           // 'certified' | 'needs_review'
  reviewType?: string      // 'technical' | 'clinical'
}

function rangeOf(pages: number[]): PageRange {
  const s = [...pages].sort((a, b) => a - b)
  return { start: s[0] ?? 0, end: s[s.length - 1] ?? 0 }
}

/**
 * Planeja o split de um bundle. Puro e determinístico.
 *
 * @param cdus         CDUs do bundle (saída do ClinicalInformationPipeline).
 * @param isRoot       true quando o exame atual é a RAIZ do bundle (ainda não foi dividido / não é irmã).
 * @param existingRange intervalo já atribuído a este exame (é uma CDU-irmã) — quando presente, não divide.
 */
export function planBundleSplit(args: {
  cdus: SplitInputCdu[]
  isRoot: boolean
  existingRange?: PageRange | null
}): SplitPlan {
  const { cdus, isRoot } = args
  const existingRange = args.existingRange ?? null
  const count = cdus.length

  // Exame já é uma CDU-irmã com intervalo atribuído: processa só o seu intervalo, nunca redivide.
  if (existingRange) {
    return { split: false, blockedTechnical: false, count: Math.max(count, 1), thisRange: existingRange, siblings: [] }
  }

  // Revisão TÉCNICA em qualquer CDU: retém (não divide automaticamente). A UX de revisão é decisão de produto.
  const blockedTechnical = cdus.some(c => c.status === 'needs_review' && c.reviewType === 'technical')
  if (blockedTechnical) {
    return { split: false, blockedTechnical: true, count, thisRange: null, siblings: [] }
  }

  // Bundle de 1 CDU (ou vazio): sem split. O exame processa o intervalo da própria CDU (ou tudo).
  if (count <= 1) {
    return { split: false, blockedTechnical: false, count, thisRange: cdus[0] ? rangeOf(cdus[0].pages) : null, siblings: [] }
  }

  // Bundle multi-CDU e tudo certificado: ESTE exame vira a CDU#1; as demais viram registros-irmãos.
  const ordered = [...cdus].sort((a, b) => a.index - b.index)
  const [first, ...rest] = ordered
  return {
    split: isRoot,
    blockedTechnical: false,
    count,
    thisRange: rangeOf(first.pages),
    siblings: isRoot
      ? rest.map(c => ({ index: c.index, range: rangeOf(c.pages), title: c.title, discoveredUnits: c.discoveredUnits }))
      : [],
  }
}

/** Restringe as páginas do bundle ao intervalo (inclusivo). Fora do intervalo → array vazio. */
export function restrictPages(pageTexts: string[], range: PageRange | null): string[] {
  if (!range) return pageTexts
  return pageTexts.slice(range.start, range.end + 1)
}
