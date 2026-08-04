// @sintera/core — taxonomia PURA de Hábitos (categorias). Fonte ÚNICA (Web + Mobile). Lista ABERTA: 'outro'
// cobre o que não se enquadra. Ícones/cores ficam na UI de cada plataforma; aqui só valor + rótulo.

export type HabitCategory =
  | 'atividade_fisica' | 'sono' | 'tabagismo' | 'alcool'
  | 'alimentacao' | 'hidratacao' | 'outro'

export const HABIT_CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: 'atividade_fisica', label: 'Atividade física' },
  { value: 'sono',             label: 'Sono' },
  { value: 'tabagismo',        label: 'Tabagismo' },
  { value: 'alcool',           label: 'Álcool' },
  { value: 'alimentacao',      label: 'Alimentação' },
  { value: 'hidratacao',       label: 'Hidratação' },
  { value: 'outro',            label: 'Outro' },
]

const LABELS: Record<string, string> = Object.fromEntries(HABIT_CATEGORIES.map(c => [c.value, c.label]))

/** Rótulo da categoria (fallback 'Outro'). */
export function habitCategoryLabel(c: string | null | undefined): string {
  return LABELS[(c ?? '').trim()] ?? 'Outro'
}

/** Resumo textual da meta divisível (ex.: "2000 ml · 8 partes de 250 ml"). Puro. */
export function habitGoalSummary(goalAmount: number | null, goalUnit: string | null, goalDivisions: number | null): string | null {
  if (goalAmount == null) return null
  const unit = goalUnit ? ` ${goalUnit}` : ''
  if (goalDivisions && goalDivisions > 0) {
    const per = Math.round((goalAmount / goalDivisions) * 100) / 100
    return `${goalAmount}${unit} · ${goalDivisions} partes de ${per}${unit}`
  }
  return `${goalAmount}${unit}`
}
