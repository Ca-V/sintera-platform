// @sintera/core — taxonomia e apresentação PURAS de SESSÃO DE ATIVIDADE FÍSICA (HIP-014 §3).
// Fonte ÚNICA Web + Mobile. Registro FACTUAL: descreve o que aconteceu, sem juízo clínico e sem avaliar
// desempenho (RDC 657/2022) — a plataforma organiza e preserva, não interpreta.
//
// A sessão é FATO OBSERVADO, distinta de `life_habits`, que guarda a INTENÇÃO declarada ("correr 3x por semana").
// Ver HIP-014 §3.

/**
 * Tipos de atividade. Lista ABERTA (Modelo Aberto): o catálogo do Health Connect é grande e muda, e uma
 * modalidade desconhecida deve virar registro rotulado "Outra atividade" — nunca falha de ingestão.
 */
export type ActivityType =
  | 'caminhada' | 'corrida' | 'ciclismo' | 'natacao' | 'musculacao' | 'funcional'
  | 'pilates' | 'yoga' | 'danca' | 'esporte_coletivo' | 'outro'

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'caminhada',        label: 'Caminhada' },
  { value: 'corrida',          label: 'Corrida' },
  { value: 'ciclismo',         label: 'Ciclismo' },
  { value: 'natacao',          label: 'Natação' },
  { value: 'musculacao',       label: 'Musculação' },
  { value: 'funcional',        label: 'Treino funcional' },
  { value: 'pilates',          label: 'Pilates' },
  { value: 'yoga',             label: 'Yoga' },
  { value: 'danca',            label: 'Dança' },
  { value: 'esporte_coletivo', label: 'Esporte coletivo' },
  { value: 'outro',            label: 'Outra atividade' },
]

const ACTIVITY_LABELS: Record<string, string> = Object.fromEntries(ACTIVITY_TYPES.map(a => [a.value, a.label]))

/** Rótulo do tipo. Desconhecido degrada para "Outra atividade" — não quebra, não some. */
export function activityTypeLabel(t: string | null | undefined): string {
  return ACTIVITY_LABELS[(t ?? '').trim()] ?? 'Outra atividade'
}

/** Duração legível a partir de segundos: "45 min", "1 h 23 min", "1 h". Nulo quando não houve medida. */
export function activityDurationLabel(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null
  const totalMin = Math.round(seconds / 60)
  if (totalMin === 0) return 'menos de 1 min'
  const h = Math.floor(totalMin / 60)
  const min = totalMin % 60
  if (h === 0) return `${min} min`
  return min === 0 ? `${h} h` : `${h} h ${min} min`
}

/** Distância legível a partir de metros: "800 m", "5,2 km". Vírgula decimal (pt-BR). */
export function activityDistanceLabel(meters: number | null | undefined): string | null {
  if (meters == null || !Number.isFinite(meters) || meters < 0) return null
  if (meters < 1000) return `${Math.round(meters)} m`
  const km = meters / 1000
  // Uma casa decimal basta e evita falsa precisão; ".0" some (5 km, não 5,0 km).
  const txt = (Math.round(km * 10) / 10).toFixed(1).replace('.0', '').replace('.', ',')
  return `${txt} km`
}

/**
 * Linha de resumo da sessão: duração · distância · energia. Só o que a fonte mediu entra — ausência de métrica
 * é informação legítima, e preencher com zero o que não foi medido seria afirmar algo falso.
 * Devolve `null` quando a fonte não trouxe nenhuma grandeza.
 */
export function activitySummary(s: {
  duration_s?: number | null
  distance_m?: number | null
  active_energy_kcal?: number | null
}): string | null {
  const partes = [
    activityDurationLabel(s.duration_s),
    activityDistanceLabel(s.distance_m),
    s.active_energy_kcal != null && Number.isFinite(s.active_energy_kcal) && s.active_energy_kcal >= 0
      ? `${Math.round(s.active_energy_kcal)} kcal`
      : null,
  ].filter((p): p is string => !!p)
  return partes.length ? partes.join(' · ') : null
}

/**
 * Duração em segundos a partir da janela, quando a fonte não informou `duration_s` explicitamente.
 * Determinístico. `null` se faltar ponta, se as datas forem inválidas ou se o fim anteceder o início — nesse
 * caso a janela é incoerente e inventar um número seria pior que não ter.
 */
export function durationFromWindow(startedAt: string | null | undefined, endedAt: string | null | undefined): number | null {
  if (!startedAt || !endedAt) return null
  const ini = new Date(startedAt).getTime()
  const fim = new Date(endedAt).getTime()
  if (Number.isNaN(ini) || Number.isNaN(fim) || fim < ini) return null
  return Math.round((fim - ini) / 1000)
}
