// @sintera/core — taxonomia PURA das medidas de Composição Corporal (BOD-001). Fonte ÚNICA (Web + Mobile).
// Registro FACTUAL autorrelatado (peso/altura/circunferência/bioimpedância). Sem juízo clínico (RDC 657/2022).

export type BodyMetric =
  | 'peso' | 'altura' | 'circunferencia_cintura'
  | 'imc' | 'gordura_corporal' | 'massa_muscular' | 'massa_magra' | 'agua_corporal' | 'gordura_visceral' | 'massa_ossea' | 'taxa_metabolica'
  | 'outro'

export const BODY_METRICS: { value: BodyMetric; label: string; unit: string; placeholder: string }[] = [
  { value: 'peso', label: 'Peso', unit: 'kg', placeholder: 'Ex.: 72,5' },
  { value: 'altura', label: 'Altura', unit: 'cm', placeholder: 'Ex.: 165' },
  { value: 'circunferencia_cintura', label: 'Circunferência (cintura)', unit: 'cm', placeholder: 'Ex.: 84' },
  { value: 'imc', label: 'IMC', unit: 'kg/m²', placeholder: 'Ex.: 24,2' },
  { value: 'gordura_corporal', label: 'Gordura corporal', unit: '%', placeholder: 'Ex.: 28' },
  { value: 'massa_muscular', label: 'Massa muscular', unit: 'kg', placeholder: 'Ex.: 24' },
  { value: 'massa_magra', label: 'Massa magra', unit: 'kg', placeholder: 'Ex.: 54' },
  { value: 'agua_corporal', label: 'Água corporal', unit: '%', placeholder: 'Ex.: 55' },
  { value: 'gordura_visceral', label: 'Gordura visceral', unit: 'nível', placeholder: 'Ex.: 7' },
  { value: 'massa_ossea', label: 'Massa óssea', unit: 'kg', placeholder: 'Ex.: 2,8' },
  { value: 'taxa_metabolica', label: 'Taxa metabólica basal', unit: 'kcal', placeholder: 'Ex.: 1450' },
  { value: 'outro', label: 'Outra medida', unit: '', placeholder: 'Valor' },
]

/** Métricas extraídas de um laudo de bioimpedância (IMC é calculado à parte). */
export const BIO_METRICS: BodyMetric[] = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica']

// FB-003/BOD-001: cada ponto mostra a ORIGEM de onde nasceu.
export const BODY_SOURCE_LABEL: Record<string, string> = {
  bioimpedancia: 'Bioimpedância', dexa: 'DEXA', balanca: 'Balança', wearable: 'Dispositivo', manual: 'Registro manual', outro: 'Outra origem',
}

const M = new Map(BODY_METRICS.map(m => [m.value, m]))
export function bodyMetricLabel(m: string | null | undefined): string { return M.get((m ?? '') as BodyMetric)?.label ?? 'Outra medida' }
export function bodyMetricUnit(m: string | null | undefined): string { return M.get((m ?? '') as BodyMetric)?.unit ?? '' }
export function bodySourceLabel(s: string | null | undefined): string | null { const k = (s ?? '').trim(); return k ? (BODY_SOURCE_LABEL[k] ?? 'Outra origem') : null }
