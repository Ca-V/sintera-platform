// Laboratory Adapter — o CPE CONSOME o laboratório, não o substitui (fundadora 14/07).
//
// O caminho laboratorial atual (Extração → biomarkers → current_biomarkers → evolução) está validado,
// utilizado e é o domínio mais maduro — NÃO migrar. Este adapter TRANSFORMA o modelo laboratorial existente
// na representação canônica UCDA, para que o laboratório participe do MESMO pipeline arquitetural das demais
// modalidades (CPE → UCDA → Timeline/Evolução/Care/…), sem duplicar lógica e sem migrar os 446 biomarcadores.
//
// ADAPTER TRANSITÓRIO: existe enquanto a persistência laboratorial for `biomarkers`. Quando (e se) houver
// evidência para convergir a persistência, ele é removido — a UCDA continua igual (contrato estável).
//
// Puro/determinístico. RDC 657: transcreve, não interpreta.

import type { UcdaItem, UcdaRepresentation } from './ucda'
import { toNum } from './ucda'

// MODELO GENÉRICO (Princípio do Modelo Aberto): o adapter NÃO conhece uma lista de biomarcadores — opera
// sobre CLASSES de campos. Um analito novo, ou um nome diferente para o mesmo analito, flui sem alteração
// estrutural. Campos além de name/value são abertos e opcionais (código LOINC/outro, método, contexto…).
/** Linha do modelo laboratorial existente (subconjunto genérico de `biomarkers` que o adapter consome). */
export interface LabBiomarkerRow {
  name: string
  value: string | null
  valueText: string | null
  unit: string | null
  referenceMin: string | null
  referenceMax: string | null
  resultType: string | null          // 'numeric' | 'qualitative' | 'missing' | 'extraction_failed'
  sourceMaterial: string | null      // amostra: SANGUE/URINA/FEZES…
  sourceExamName: string | null      // painel/exame: HEMOGRAMA…
  // Abertos/opcionais — preenchidos quando a fonte (catálogo/documento) fornecer; ausência não quebra nada.
  code?: string | null               // código do analito (LOINC ou outro sistema aberto)
  codeSystem?: string | null         // sistema do código (ex.: 'LOINC')
  method?: string | null             // método de análise
  context?: string | null            // contexto/condição de coleta (ex.: jejum)
}

/** Faixa de referência COMO transcrita (não interpreta): "min – max" | "≥ min" | "≤ max" | undefined. */
function referenceText(min: string | null, max: string | null): string | undefined {
  if (min != null && max != null) return `${min} – ${max}`
  if (min != null) return `≥ ${min}`
  if (max != null) return `≤ ${max}`
  return undefined
}

/** Um biomarcador → UcdaItem canônico. Numérico → measure; qualitativo → parameter. */
export function biomarkerToUcdaItem(b: LabBiomarkerRow): UcdaItem {
  const isNumeric = b.resultType === 'numeric'
  const valueText = (b.valueText ?? b.value ?? '').toString()
  const ref = referenceText(b.referenceMin, b.referenceMax)
  return {
    itemType: isNumeric ? 'measure' : 'parameter',
    name: b.name,
    valueText,
    valueNum: isNumeric ? toNum(valueText) : null,
    ...(b.unit ? { unit: b.unit } : {}),
    ...(b.code ? { code: b.code } : {}),
    ...(b.codeSystem ? { codeSystem: b.codeSystem } : {}),
    ...(b.sourceMaterial ? { specimen: b.sourceMaterial } : {}),
    ...(b.method ? { method: b.method } : {}),
    ...(b.context ? { context: b.context } : {}),
    ...(b.sourceExamName ? { group: b.sourceExamName } : {}),
    ...(ref ? { referenceText: ref } : {}),
  }
}

/** Item sem valor a representar (result_type missing/extraction_failed, ou value/value_text vazios). */
function hasValue(item: UcdaItem): boolean {
  return item.valueText.trim() !== '' || item.valueNum != null
}

/**
 * Adapta o resultado laboratorial existente (linhas de `biomarkers`) para a representação canônica UCDA.
 * NÃO persiste nem migra — apenas apresenta o laboratório como UCDA para o restante do pipeline. Puro.
 * Itens SEM valor (missing/extraction_failed) não entram na representação — "rotula, não oculta" vale para
 * dado VÁLIDO; um não-resultado não é evidência a apresentar (validado contra os 446 biomarcadores reais).
 */
export function laboratoryToUcda(rows: LabBiomarkerRow[]): UcdaRepresentation {
  return {
    clinicalModel: 'laboratory',
    resultKind: 'structured',
    items: rows.map(biomarkerToUcdaItem).filter(hasValue),
    provenance: { source: 'laboratory-adapter', processorVersion: 'v1' },
  }
}
