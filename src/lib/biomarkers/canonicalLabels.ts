// Canonicalização de rótulos de MATERIAL e NOME DE EXAME para as visões agregadas.
// Funde variantes do texto cru do laudo ("exame de sangue" → Sangue; "urina de 24 horas"
// / "exame de urina 24 horas" → Urina 24h) e dá uma CHAVE estável para agrupar + ordenar.
//
// Regra de domínio (fundadora, 12/07/2026): Urina (coleta simples) e Urina 24h (coleta de
// 24 horas) são exames DIFERENTES → chaves SEPARADAS (vizinhas, nunca fundidas).
//
// Isto é PRESENTAÇÃO: o dado gravado (source_material/source_exam_name) permanece fiel ao
// laudo (Fidelidade da Ingestão). Aqui só decidimos como AGRUPAR e ORDENAR. Sem juízo
// clínico (RDC 657).

export interface CanonLabel { key: string; label: string }

/** Ordem canônica dos materiais quando o catálogo não define (fallback). */
export const MATERIAL_FALLBACK_ORDER = ['sangue', 'urina', 'urina_24h', 'fezes', 'saliva', 'liquor']

/** Normaliza p/ MATCHING: minúsculas, sem acento, espaços colapsados. */
function norm(raw: string | null | undefined): string {
  return (raw ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sentenceCase(s: string): string {
  const t = s.trim()
  if (!t) return t
  // Caixa-alta de laudo ("URINA ROTINA") → "Urina rotina"; caso contrário preserva.
  const letters = t.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  const mostlyUpper = letters.length > 0 && letters === letters.toUpperCase()
  const base = mostlyUpper ? t.toLowerCase() : t
  return base.charAt(0).toUpperCase() + base.slice(1)
}

const has24h = (s: string) => /\b24\s?h(oras?)?\b|vinte e quatro horas|\bde 24\b/.test(s)

/**
 * Material → chave (alinhada aos specimens do catálogo: sangue|urina|urina_24h|…) +
 * rótulo padrão. Usada quando NÃO há specimen reconhecido (fallback do texto cru).
 */
export function canonicalMaterial(raw: string | null | undefined): CanonLabel {
  const s = norm(raw)
  if (!s) return { key: 'outros', label: 'Outros exames' }
  if (/urina|urinalise|\beas\b|urocultura|sedimento urin/.test(s)) {
    return has24h(s) ? { key: 'urina_24h', label: 'Urina 24h' } : { key: 'urina', label: 'Urina' }
  }
  if (/sangue|soro|plasma|serico|sorolog|hematolog/.test(s)) return { key: 'sangue', label: 'Sangue' }
  if (/fezes|coprolog|parasitolog/.test(s)) return { key: 'fezes', label: 'Fezes' }
  if (/saliva/.test(s)) return { key: 'saliva', label: 'Saliva' }
  if (/liquor|liquido cefalo/.test(s)) return { key: 'liquor', label: 'Líquor' }
  // Genérico: tira "exame de", capitaliza; chave prefixada p/ não colidir com specimens.
  const cleanKey = s.replace(/^(exame|amostra|material)\s+(de|do|da)\s+/, '').replace(/^exame\s+/, '').trim()
  const cleanLabel = (raw ?? '').replace(/\s+/g, ' ').trim()
    .replace(/^(exame|amostra|material)\s+(de|do|da)\s+/i, '').replace(/^exame\s+/i, '')
  return { key: `x:${cleanKey}`, label: sentenceCase(cleanLabel) || 'Outros exames' }
}

/** Nome do exame → chave (funde variantes) + rótulo limpo. null quando ausente. */
export function canonicalExamName(raw: string | null | undefined): CanonLabel | null {
  const orig = (raw ?? '').replace(/\s+/g, ' ').trim()
  if (!orig) return null
  const label0 = orig
    .replace(/^(exame|dosagem)\s+(de|do|da)\s+/i, '')
    .replace(/^exame\s+/i, '')
    .replace(/\bde\s+24\s?h(oras?)?\b/i, '24h')
    .replace(/\b24\s?h(oras?)?\b/i, '24h')
    .replace(/\s+/g, ' ').trim()
  const key = norm(label0)
  return { key, label: sentenceCase(label0) }
}

/**
 * Posição de ordenação de um material pela sua chave canônica. Ordem do catálogo primeiro;
 * depois a ordem-fallback conhecida; desconhecidos por último (ordenar por rótulo).
 */
export function materialRank(key: string, specimenOrder: string[]): number {
  const ci = specimenOrder.indexOf(key)
  if (ci >= 0) return ci
  const fi = MATERIAL_FALLBACK_ORDER.indexOf(key)
  if (fi >= 0) return 100 + fi
  return 999
}
