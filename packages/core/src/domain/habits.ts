// @sintera/core — taxonomia PURA de Hábitos (categorias). Fonte ÚNICA (Web + Mobile). Lista ABERTA: 'outro'
// cobre o que não se enquadra. Ícones/cores ficam na UI de cada plataforma; aqui só valor + rótulo.
//
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// ATIVIDADE FÍSICA SAIU DAQUI — decisão da fundadora, 31/08/2026.
//
// Com a chegada dos dispositivos, atividade física passou a existir em dois lugares ao mesmo tempo: aqui,
// como INTENÇÃO declarada ("Musculação, diário"), e em Monitoramento, como FATO com data, duração e calorias.
// Duas telas, a mesma palavra, e nenhuma ligação entre elas.
//
// O critério, que vale daqui em diante e evita decidir caso a caso:
//
//     O QUE A PLATAFORMA CONSEGUE MEDIR mora em Monitoramento.
//     O QUE ELA SÓ CONSEGUE PERGUNTAR mora em Hábitos.
//
// Quando a sincronização de sono entrar, 'sono' faz o mesmo caminho pela MESMA regra — não por uma decisão
// nova. Ver `rotinaDeAtividade.ts`, onde a rotina declarada reencontra as sessões observadas.
//
// A categoria NÃO foi apagada do tipo nem dos rótulos, de propósito: os registros que já existem continuam
// legíveis no dossiê, nos relatórios e no histórico. O que mudou é que ela não é mais OFERECIDA em Hábitos.
// Apagar o rótulo faria registros de saúde já guardados aparecerem como "Outro" — perda silenciosa.
// ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export type HabitCategory =
  | 'atividade_fisica' | 'sono' | 'tabagismo' | 'alcool'
  | 'alimentacao' | 'hidratacao' | 'outro'

/** A categoria que MUDOU DE ENDEREÇO. Nomeada para que as telas possam apontar o caminho novo. */
export const HABIT_CATEGORY_MOVED_TO_MONITORING: HabitCategory = 'atividade_fisica'

/**
 * TODAS as categorias já usadas — inclusive as que saíram. Serve para RÓTULO e LEITURA de registros antigos.
 * Nunca use esta lista para montar um seletor: quem escolhe é `HABIT_CATEGORIES`.
 */
export const HABIT_CATEGORIES_ALL: { value: HabitCategory; label: string }[] = [
  { value: 'atividade_fisica', label: 'Atividade física' },
  { value: 'sono',             label: 'Sono' },
  { value: 'tabagismo',        label: 'Tabagismo' },
  { value: 'alcool',           label: 'Álcool' },
  { value: 'alimentacao',      label: 'Alimentação' },
  { value: 'hidratacao',       label: 'Hidratação' },
  { value: 'outro',            label: 'Outro' },
]

/**
 * As categorias OFERECIDAS em Hábitos — o que a plataforma pergunta porque não consegue medir.
 *
 * É desta lista que saem os seletores das duas pontas. A Web mantinha uma cópia escrita à mão deste array,
 * e era só questão de tempo até divergir — como já aconteceu com o sinal do peso e com a lista de formatos
 * aceitos. Agora há um dono só.
 */
export const HABIT_CATEGORIES: { value: HabitCategory; label: string }[] =
  HABIT_CATEGORIES_ALL.filter(c => c.value !== HABIT_CATEGORY_MOVED_TO_MONITORING)

const LABELS: Record<string, string> = Object.fromEntries(HABIT_CATEGORIES_ALL.map(c => [c.value, c.label]))

/** Rótulo da categoria (fallback 'Outro'). Conhece TODAS, inclusive as que saíram do seletor. */
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
