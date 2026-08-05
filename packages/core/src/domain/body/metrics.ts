// @sintera/core — taxonomia PURA das medidas de Composição Corporal (BOD-001). Fonte ÚNICA (Web + Mobile).
// Registro FACTUAL autorrelatado (peso/altura/circunferência/bioimpedância). Sem juízo clínico (RDC 657/2022).

export type BodyMetric =
  | 'peso' | 'altura' | 'circunferencia_cintura'
  | 'imc' | 'gordura_corporal' | 'massa_muscular' | 'massa_magra' | 'agua_corporal' | 'gordura_visceral' | 'massa_ossea' | 'taxa_metabolica'
  | 'outro'
  // Sinais vitais (Monitoramento) — mesma tabela body_metrics, taxonomia separada. Ver isVital/VITAL_SIGNS.
  | 'pressao_arterial' | 'frequencia_cardiaca' | 'glicemia' | 'saturacao' | 'temperatura' | 'outro_sinal'

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

// Sinais vitais (Monitoramento) — série temporal autorrelatada na MESMA tabela body_metrics, taxonomia própria.
export type VitalMetric = 'pressao_arterial' | 'frequencia_cardiaca' | 'glicemia' | 'saturacao' | 'temperatura' | 'outro_sinal'
export const VITAL_SIGNS: { value: VitalMetric; label: string; unit: string; placeholder: string }[] = [
  { value: 'pressao_arterial', label: 'Pressão arterial', unit: 'mmHg', placeholder: 'Ex.: 120/80' },
  { value: 'frequencia_cardiaca', label: 'Frequência cardíaca', unit: 'bpm', placeholder: 'Ex.: 72' },
  { value: 'glicemia', label: 'Glicemia', unit: 'mg/dL', placeholder: 'Ex.: 95' },
  { value: 'saturacao', label: 'Saturação (SpO₂)', unit: '%', placeholder: 'Ex.: 98' },
  { value: 'temperatura', label: 'Temperatura', unit: '°C', placeholder: 'Ex.: 36,5' },
  { value: 'outro_sinal', label: 'Outro sinal', unit: '', placeholder: 'Valor' },
]
const VITAL_KEYS = new Set(VITAL_SIGNS.map(v => v.value as string))
/** Um sinal vital (Monitoramento) vs. medida de Composição Corporal — separa as duas visões da mesma tabela. */
export function isVital(metric: string | null | undefined): boolean { return VITAL_KEYS.has((metric ?? '') as string) }

// FB-003/BOD-001: cada ponto mostra a ORIGEM de onde nasceu.
export const BODY_SOURCE_LABEL: Record<string, string> = {
  bioimpedancia: 'Bioimpedância', dexa: 'DEXA', balanca: 'Balança', wearable: 'Dispositivo', manual: 'Registro manual', outro: 'Outra origem',
}

const M = new Map<string, { label: string; unit: string }>([...BODY_METRICS, ...VITAL_SIGNS].map(m => [m.value, m]))
export function bodyMetricLabel(m: string | null | undefined): string { return M.get(m ?? '')?.label ?? 'Outra medida' }
export function bodyMetricUnit(m: string | null | undefined): string { return M.get(m ?? '')?.unit ?? '' }
export function bodySourceLabel(s: string | null | undefined): string | null { const k = (s ?? '').trim(); return k ? (BODY_SOURCE_LABEL[k] ?? 'Outra origem') : null }
