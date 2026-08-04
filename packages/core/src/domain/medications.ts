// @sintera/core — taxonomia PURA de Medicamentos/Suplementos (kind/status/forma farmacêutica/via). Fonte ÚNICA
// (Web + Mobile). Suplementos é a MESMA tabela (medications) com kind='suplemento'.

export type MedKind = 'medicamento' | 'suplemento' | 'produto' | 'dispositivo' | 'outro'
export type MedStatus = 'em_uso' | 'programado' | 'suspenso' | 'encerrado'

export const MED_KINDS: { value: MedKind; label: string }[] = [
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'suplemento',  label: 'Suplemento' },
  { value: 'produto',     label: 'Produto' },
  { value: 'dispositivo', label: 'Dispositivo' },
  { value: 'outro',       label: 'Outro' },
]

export const MED_STATUSES: { value: MedStatus; label: string }[] = [
  { value: 'em_uso',    label: 'Em uso' },
  { value: 'programado', label: 'Programado' },
  { value: 'suspenso',  label: 'Suspenso' },
  { value: 'encerrado', label: 'Encerrado' },
]

/** Formas farmacêuticas (valor · rótulo · unidade de estoque). */
export const MED_FORMS: { value: string; label: string; unit: string }[] = [
  { value: 'comprimido', label: 'Comprimido', unit: 'comprimidos' },
  { value: 'capsula', label: 'Cápsula', unit: 'cápsulas' },
  { value: 'dragea', label: 'Drágea', unit: 'drágeas' },
  { value: 'solucao_oral', label: 'Solução oral', unit: 'mL' },
  { value: 'suspensao_oral', label: 'Suspensão oral', unit: 'mL' },
  { value: 'xarope', label: 'Xarope', unit: 'mL' },
  { value: 'gotas', label: 'Gotas', unit: 'mL' },
  { value: 'spray', label: 'Spray', unit: 'doses' },
  { value: 'gel', label: 'Gel', unit: 'g' },
  { value: 'creme', label: 'Creme', unit: 'g' },
  { value: 'pomada', label: 'Pomada', unit: 'g' },
  { value: 'locao', label: 'Loção', unit: 'mL' },
  { value: 'injetavel', label: 'Injetável', unit: 'mL' },
  { value: 'colirio', label: 'Colírio', unit: 'mL' },
  { value: 'sache', label: 'Sachê', unit: 'sachês' },
  { value: 'adesivo', label: 'Adesivo', unit: 'adesivos' },
  { value: 'outro', label: 'Outro', unit: '' },
]

export const MED_ROUTES = ['Oral', 'Tópica', 'Oftálmica', 'Nasal', 'Inalatória', 'Sublingual', 'Vaginal', 'Retal', 'Intramuscular', 'Endovenosa', 'Subcutânea', 'Outra'] as const

const KIND_LABELS: Record<string, string> = Object.fromEntries(MED_KINDS.map(k => [k.value, k.label]))
const STATUS_LABELS: Record<string, string> = Object.fromEntries(MED_STATUSES.map(s => [s.value, s.label]))
const FORM_LABELS: Record<string, string> = Object.fromEntries(MED_FORMS.map(f => [f.value, f.label]))

export function medKindLabel(v: string | null | undefined): string { return KIND_LABELS[(v ?? '').trim()] ?? 'Medicamento' }
export function medStatusLabel(v: string | null | undefined): string { return STATUS_LABELS[(v ?? '').trim()] ?? 'Em uso' }
export function medFormLabel(v: string | null | undefined): string | null { const k = (v ?? '').trim(); return k ? (FORM_LABELS[k] ?? null) : null }
export function medFormUnit(v: string | null | undefined): string { return MED_FORMS.find(f => f.value === (v ?? '').trim())?.unit ?? '' }

/**
 * Estimativa de dias até o fim do estoque (acquired ÷ dailyConsumption). Puro. Null se não estimável.
 * Espelha a regra da Web (@/lib/medications/repurchase) sem a aritmética de calendário.
 */
export function estimatedRunoutDays(acquired: number | null, dailyConsumption: number | null): number | null {
  if (acquired == null || dailyConsumption == null || dailyConsumption <= 0) return null
  return Math.max(0, Math.floor(acquired / dailyConsumption))
}

// Vocabulário de RECOMPRA compartilhado com a Web (coluna medications.repurchase_frequency guarda strings PT).
// Evita corrupção cross-plataforma: o Mobile NÃO deve gravar o enum de recorrência genérico nessa coluna.
// value = string PT gravada · freq = RecurrenceFrequency equivalente p/ o lembrete (Evento). null = não repetir.
export const MED_REPURCHASE_FREQUENCIES: { value: string; label: string; freq: 'weekly' | 'biweekly' | 'monthly' | 'yearly' }[] = [
  { value: 'semanal',   label: 'Semanal',   freq: 'weekly' },
  { value: 'quinzenal', label: 'Quinzenal', freq: 'biweekly' },
  { value: 'mensal',    label: 'Mensal',    freq: 'monthly' },
  { value: 'bimestral', label: 'Bimestral', freq: 'monthly' },   // aprox. no lembrete genérico (mensal)
  { value: 'trimestral', label: 'Trimestral', freq: 'monthly' },
  { value: 'semestral', label: 'Semestral', freq: 'yearly' },
  { value: 'anual',     label: 'Anual',     freq: 'yearly' },
]

/** RecurrenceFrequency do lembrete a partir do valor PT de recompra (para serializar o Evento). */
export function repurchaseFreqToRecurrence(ptValue: string | null | undefined): 'none' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' {
  return MED_REPURCHASE_FREQUENCIES.find(m => m.value === (ptValue ?? '').trim())?.freq ?? 'none'
}
