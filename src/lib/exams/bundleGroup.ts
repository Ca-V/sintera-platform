// Multi-exame (EXA-C1 / NC-0010): reconstrói a relação "partes do mesmo documento" na UI.
// Um upload que a Segmentação dividiu em N CDUs vira N registros irmãos: o RAIZ
// (`source_bundle_exam_id === id`, `bundle_cdu_index === 1`) + irmãos (`source_bundle_exam_id === rootId`,
// `bundle_cdu_index` 2..N), todos com `bundle_cdu_count === N`. Puro/determinístico — a UI apenas apresenta.

// Campos opcionais: os tipos gerados do Supabase podem não declarar as colunas de bundle (embora
// existam no banco e venham no `select('*')`). As funções abaixo tratam ausência com `?? null`/`?? 0`.
export interface BundleFields {
  id: string
  source_bundle_exam_id?: string | null
  bundle_cdu_index?: number | null
  bundle_cdu_count?: number | null
}

export interface BundlePartInfo {
  /** Pertence a um documento com 2+ partes? */
  isPart: boolean
  /** Índice da parte (1-based) dentro do documento. */
  index: number | null
  /** Total de partes do documento. */
  count: number | null
  /** Id do registro-RAIZ do documento (o que representa a 1ª parte). */
  rootId: string | null
  /** Este é o registro-raiz do documento? */
  isRoot: boolean
}

/** Deriva a informação de "parte do documento" de um exame. Não é parte → tudo neutro. */
export function bundlePartInfo(e: BundleFields): BundlePartInfo {
  const count = e.bundle_cdu_count ?? 0
  const isPart = count > 1
  const rootId = e.source_bundle_exam_id ?? null
  return {
    isPart,
    index: isPart ? (e.bundle_cdu_index ?? null) : null,
    count: isPart ? count : null,
    rootId: isPart ? rootId : null,
    isRoot: isPart && rootId != null && rootId === e.id,
  }
}

/** Rótulo curto "Parte X de N de um documento" — null quando não é parte. */
export function bundlePartLabel(info: BundlePartInfo): string | null {
  if (!info.isPart || info.index == null || info.count == null) return null
  return `Parte ${info.index} de ${info.count} de um documento`
}

/**
 * Agrupa exames por documento-bundle preservando a ordem de entrada dos GRUPOS (pela 1ª aparição),
 * mas mantendo as partes de um mesmo documento ADJACENTES e ordenadas por `bundle_cdu_index`.
 * Exames sem bundle (ou bundle de 1) ficam isolados, na posição de sua 1ª aparição. Determinístico.
 */
export function groupBundleParts<T extends BundleFields>(exams: T[]): T[] {
  const groupKey = (e: T): string => {
    const info = bundlePartInfo(e)
    return info.isPart && info.rootId ? `b:${info.rootId}` : `s:${e.id}`
  }
  const order: string[] = []
  const groups = new Map<string, T[]>()
  for (const e of exams) {
    const k = groupKey(e)
    if (!groups.has(k)) { groups.set(k, []); order.push(k) }
    groups.get(k)!.push(e)
  }
  const out: T[] = []
  for (const k of order) {
    const g = groups.get(k)!
    if (g.length > 1) g.sort((a, b) => (a.bundle_cdu_index ?? 0) - (b.bundle_cdu_index ?? 0))
    out.push(...g)
  }
  return out
}
