// @sintera/core — UCDA (leitura/exibição): converte linhas de `clinical_results` na representação canônica
// e agrupa para exibição GENÉRICA (sem lógica por modalidade — Convergência Progressiva). Puro. Fonte para o
// Mobile renderizar resultados clínicos não-laboratoriais (Pentacam/ECG/…) com paridade à Web. O lado de
// ESCRITA/persistência (representationFromProcessor, ucdaItemToRow) permanece no pipeline da Web (src/lib/capture/ucda).

/** Item clínico canônico — qualquer informação clínica estruturada, independente de fonte/persistência. */
export interface UcdaItem {
  itemType: 'measure' | 'parameter' | 'finding' | 'classification' | 'observation'
  name: string
  valueText: string
  valueNum?: number | null
  unit?: string
  code?: string
  codeSystem?: string
  valueCode?: string
  region?: string
  anatomy?: string
  specimen?: string
  method?: string
  context?: string
  group?: string
  referenceText?: string
  page?: number
  excerpt?: string
}

export type UcdaResultKind = 'structured' | 'narrative' | 'parametric'

export interface UcdaProvenance {
  source: string
  engineVersion?: string
  processorVersion?: string
  documentId?: string
  producedAt?: string
}

export interface UcdaRepresentation {
  clinicalModel: string
  resultKind: UcdaResultKind
  items: UcdaItem[]
  provenance: UcdaProvenance
}

/** Linha de `clinical_results` (leitura). */
export interface ClinicalResultRow {
  clinical_model: string
  result_kind: string
  item_type: string | null
  name: string
  value_text: string | null
  value_num: number | string | null
  unit: string | null
  code: string | null
  code_system: string | null
  value_code: string | null
  region: string | null
  anatomy: string | null
  specimen: string | null
  method: string | null
  context: string | null
  group_label: string | null
  reference_text: string | null
  page: number | null
  raw_text: string | null
}

const asItemType = (t: string | null): UcdaItem['itemType'] =>
  t === 'measure' || t === 'parameter' || t === 'finding' || t === 'classification' || t === 'observation' ? t : 'observation'

function itemFromRow(r: ClinicalResultRow): UcdaItem {
  const num = r.value_num == null ? null : Number(r.value_num)
  return {
    itemType: asItemType(r.item_type),
    name: r.name,
    valueText: r.value_text ?? '',
    valueNum: Number.isFinite(num as number) ? (num as number) : null,
    ...(r.unit ? { unit: r.unit } : {}),
    ...(r.code ? { code: r.code } : {}),
    ...(r.code_system ? { codeSystem: r.code_system } : {}),
    ...(r.value_code ? { valueCode: r.value_code } : {}),
    ...(r.region ? { region: r.region } : {}),
    ...(r.anatomy ? { anatomy: r.anatomy } : {}),
    ...(r.specimen ? { specimen: r.specimen } : {}),
    ...(r.method ? { method: r.method } : {}),
    ...(r.context ? { context: r.context } : {}),
    ...(r.group_label ? { group: r.group_label } : {}),
    ...(r.reference_text ? { referenceText: r.reference_text } : {}),
    ...(r.page != null ? { page: r.page } : {}),
    ...(r.raw_text ? { excerpt: r.raw_text } : {}),
  }
}

/** Converte linhas de `clinical_results` (de UM exame/modelo) na representação canônica UCDA. Vazio → null. */
export function clinicalResultsToUcda(rows: ClinicalResultRow[]): UcdaRepresentation | null {
  if (!rows.length) return null
  const first = rows[0]
  return {
    clinicalModel: first.clinical_model,
    resultKind: (['structured', 'narrative', 'parametric'].includes(first.result_kind)
      ? first.result_kind : 'structured') as UcdaResultKind,
    items: rows.map(itemFromRow),
    provenance: { source: 'clinical_results' },
  }
}

/** Seção de exibição da UCDA: itens agrupados para leitura. */
export interface UcdaDisplaySection { label: string | null; items: UcdaItem[] }

/** Agrupa itens UCDA para exibição GENÉRICA (chave: group › region › anatomy › null). Determinístico. */
export function groupUcdaForDisplay(rep: UcdaRepresentation): UcdaDisplaySection[] {
  const keyOf = (it: UcdaItem): string | null => it.group ?? it.region ?? it.anatomy ?? null
  const order: (string | null)[] = []
  const map = new Map<string | null, UcdaItem[]>()
  for (const it of rep.items) {
    const k = keyOf(it)
    if (!map.has(k)) { map.set(k, []); order.push(k) }
    map.get(k)!.push(it)
  }
  return order.map(k => ({ label: k, items: map.get(k)! }))
}
