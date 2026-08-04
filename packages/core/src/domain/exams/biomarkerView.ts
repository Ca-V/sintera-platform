// @sintera/core — Lógica PURA de apresentação de RESULTADOS (biomarcadores), FIEL ao laudo (REG-001).
// Fonte ÚNICA compartilhada Web↔Mobile: interpretação (já calculada pelo backend, NUNCA recomputada aqui),
// ordenação, valor de exibição, agrupamento material→exame, índice experimental e rótulos de origem.
// Sem React/DOM/DS — só dados. Cada plataforma mapeia `status` para suas cores/ícones.

/** Forma estrutural mínima de um resultado (compatível com BiomarkerDTO do api-client). */
export interface BiomarkerLike {
  name: string
  value: number | null
  value_text: string | null
  unit: string | null
  reference_min: number | null
  reference_max: number | null
  interpretation: string | null
  result_type: string | null
  reference_source: string | null
  source: string | null
  source_material: string | null
  source_exam_name: string | null
  specimen?: string | null // enriquecido do catálogo (fallback do material)
}

/** Situação semântica do resultado — a UI escolhe cor/ícone a partir daqui (não o contrário). */
export type BiomarkerStatus =
  | 'above' | 'below' | 'within'      // comparação com a faixa do laudo
  | 'no_reference'                    // resultado presente, sem faixa para comparar
  | 'qualitative'                     // resultado descritivo (Negativo, Ausente…)
  | 'missing'                         // resultado não informado no documento
  | 'failed'                          // não foi possível ler o item
  | 'unavailable'                     // numérico sem interpretação

// Copy dos rótulos de situação — IDÊNTICA à Web (fonte única). Sem pressupor "laboratório".
const STATUS_LABEL: Record<BiomarkerStatus, string> = {
  above:        'Acima da referência informada no documento',
  below:        'Abaixo da referência informada no documento',
  within:       'Dentro da referência informada no documento',
  no_reference: 'Sem faixa de referência para comparação neste documento',
  qualitative:  'Resultado descritivo (em palavras, sem faixa numérica para comparar)',
  missing:      'Este resultado não foi informado no documento',
  failed:       'Não foi possível ler este item do documento',
  unavailable:  'Sem interpretação numérica disponível',
}

// Ordem de exibição (mesma da Web): fora da faixa primeiro, depois dentro, depois sem referência.
const INTERP_ORDER: Record<string, number> = {
  acima_da_referencia: 1,
  abaixo_da_referencia: 2,
  dentro_da_referencia: 3,
  sem_referencia_identificada: 4,
  indisponivel: 5,
}

// Origem dos resultados em linguagem humana (evita expor "ai_extracted").
const SOURCE_LABEL: Record<string, string> = {
  ai_extracted: 'estruturados automaticamente a partir do documento',
  laudo:        'informados no documento',
  manual:       'inseridos manualmente',
  catalog:      'estruturados a partir do documento',
}

/** Situação semântica do resultado. Prioriza o TIPO: um resultado PRESENTE (qualitativo) nunca é "ausente". */
export function biomarkerStatus(b: BiomarkerLike): BiomarkerStatus {
  if (b.result_type === 'extraction_failed') return 'failed'
  if (b.result_type === 'missing')           return 'missing'
  if (b.result_type === 'qualitative')       return 'qualitative'
  switch (b.interpretation) {
    case 'acima_da_referencia':  return 'above'
    case 'abaixo_da_referencia': return 'below'
    case 'dentro_da_referencia': return 'within'
    case 'indisponivel':         return 'unavailable'
    default:                     return 'no_reference'
  }
}

/** Rótulo descritivo da situação (copy única, igual à Web). */
export function biomarkerStatusLabel(b: BiomarkerLike): string {
  return STATUS_LABEL[biomarkerStatus(b)]
}

/** Rótulo humano da origem dos resultados (a partir do 1º resultado, como a Web). */
export function biomarkerSourceLabel(source: string | null | undefined): string {
  return SOURCE_LABEL[source ?? ''] ?? 'estruturados a partir do documento'
}

/** Suaviza valores descritivos em CAIXA ALTA (comuns em laudos) para caixa de frase. */
function prettyValueText(s: string): string {
  const t = s.trim()
  if (t.length > 1 && t === t.toUpperCase() && t !== t.toLowerCase()) {
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  }
  return t
}

/** Formata número no padrão pt-BR (equivalente ao fmtNum da Web: até 2 casas, sem zeros à toa). */
export function formatNumberBR(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

/** Faixa de referência textual (equivalente ao formatRef da Web). */
export function formatReference(min: number | null, max: number | null): string | null {
  if (min !== null && max !== null) return `${formatNumberBR(min)} – ${formatNumberBR(max)}`
  if (min !== null) return `≥ ${formatNumberBR(min)}`
  if (max !== null) return `≤ ${formatNumberBR(max)}`
  return null
}

/** Parte principal + unidade do resultado (NÚMERO e TEXTO com o mesmo tratamento), igual à Web. */
export function displayValue(b: BiomarkerLike): { main: string | null; unit: string | null } {
  if (b.result_type === 'qualitative' && b.value_text) {
    const raw = b.value_text.trim()
    const u = b.unit?.trim()
    if (u && raw.length > u.length && raw.toLowerCase().endsWith(u.toLowerCase())) {
      return { main: prettyValueText(raw.slice(0, raw.length - u.length).trim()), unit: u }
    }
    return { main: prettyValueText(raw), unit: null }
  }
  if (b.value !== null) return { main: formatNumberBR(b.value), unit: b.unit?.trim() || null }
  return { main: null, unit: null }
}

/** Ordena os resultados (situação → nome), igual à Web. PURA (não muta a entrada). */
export function sortBiomarkers<T extends BiomarkerLike>(bms: T[]): T[] {
  return [...bms].sort((a, b) => {
    const oa = INTERP_ORDER[a.interpretation ?? ''] ?? 6
    const ob = INTERP_ORDER[b.interpretation ?? ''] ?? 6
    if (oa !== ob) return oa - ob
    return (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR')
  })
}

/** Contagens do resumo (total · acima · abaixo · dentro), igual à Web. */
export function biomarkerCounts(bms: BiomarkerLike[]): { total: number; acima: number; abaixo: number; dentro: number } {
  return {
    total: bms.length,
    acima: bms.filter(b => b.interpretation === 'acima_da_referencia').length,
    abaixo: bms.filter(b => b.interpretation === 'abaixo_da_referencia').length,
    dentro: bms.filter(b => b.interpretation === 'dentro_da_referencia').length,
  }
}

// ── Índice Experimental (proporção dentro da referência) — mesma regra da Web ──
const MIN_DENOMINATOR = 5
export function experimentalIndex(bms: BiomarkerLike[]): { numerator: number; denominator: number; pct: number } | null {
  const eligible = bms.filter(b => b.reference_source === 'laudo' && b.result_type === 'numeric' && b.interpretation !== null)
  const denominator = eligible.length
  if (denominator < MIN_DENOMINATOR) return null
  const numerator = eligible.filter(b => b.interpretation === 'dentro_da_referencia').length
  return { numerator, denominator, pct: Math.round((numerator / denominator) * 100) }
}

// ── Agrupamento material → exame (fiel ao laudo) ──
// Sem enriquecimento de catálogo aqui (a plataforma pode passar `specimen` já resolvido). A ORDEM segue a
// 1ª aparição do material — o ranqueamento por specimen (catálogo) é opcional e fica na camada que tem o catálogo.
export interface BiomarkerExamGroup<T> {
  material: string
  exams: { label: string | null; items: T[] }[]
}

export function groupByMaterialExam<T extends BiomarkerLike>(bms: T[]): BiomarkerExamGroup<T>[] {
  const materialLabelOf = (b: BiomarkerLike) => b.source_material?.trim() || 'Resultados'
  const examLabelOf = (b: BiomarkerLike) => b.source_exam_name?.trim() || null
  const mats = new Map<string, BiomarkerExamGroup<T>>()
  for (const b of bms) {
    const mLabel = materialLabelOf(b)
    if (!mats.has(mLabel)) mats.set(mLabel, { material: mLabel, exams: [] })
    const mat = mats.get(mLabel)!
    const eLabel = examLabelOf(b)
    const eKey = eLabel ?? '__sem_exame__'
    let ex = mat.exams.find(e => (e.label ?? '__sem_exame__') === eKey)
    if (!ex) { ex = { label: eLabel, items: [] }; mat.exams.push(ex) }
    ex.items.push(b)
  }
  return [...mats.values()]
}
