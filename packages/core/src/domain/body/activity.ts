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
 * Qual medida de desempenho faz sentido para cada modalidade.
 *
 * Quem corre fala em RITMO (minutos por quilômetro); quem pedala fala em VELOCIDADE (km/h). Mostrar "12 km/h"
 * para uma corrida ou "5:00 /km" para uma pedalada é tecnicamente correto e ninguém entende — a unidade certa
 * é a que a pessoa usa quando conta o que fez.
 *
 * Modalidade sem deslocamento (musculação, yoga) não tem nenhuma das duas: `null`.
 */
export type ActivityPaceKind = 'ritmo' | 'velocidade' | null

const RITMO = new Set<ActivityType>(['caminhada', 'corrida', 'natacao'])
const VELOCIDADE = new Set<ActivityType>(['ciclismo'])

export function paceKindFor(type: string | null | undefined): ActivityPaceKind {
  const t = (type ?? '').trim() as ActivityType
  if (RITMO.has(t)) return 'ritmo'
  if (VELOCIDADE.has(t)) return 'velocidade'
  return null
}

/**
 * Ritmo em minutos por quilômetro: "5:46 /km".
 *
 * `null` sem os dois dados, ou com distância zero — dividir por zero produziria "Infinity /km", que é pior
 * que não mostrar nada. Este número é DERIVADO, nunca gravado: recalculá-lo a partir da fonte garante que ele
 * nunca contradiga a duração e a distância que estão ali do lado.
 */
export function activityPace(durationS: number | null | undefined, distanceM: number | null | undefined): string | null {
  if (durationS == null || distanceM == null) return null
  if (!Number.isFinite(durationS) || !Number.isFinite(distanceM)) return null
  if (durationS <= 0 || distanceM <= 0) return null

  const segPorKm = durationS / (distanceM / 1000)
  const min = Math.floor(segPorKm / 60)
  const seg = Math.round(segPorKm % 60)
  // 5:60 não existe — o arredondamento dos segundos vira um minuto.
  const [m, s] = seg === 60 ? [min + 1, 0] : [min, seg]
  if (m > 99) return null   // acima disto não é ritmo, é erro de digitação
  return `${m}:${String(s).padStart(2, '0')} /km`
}

/** Velocidade média em km/h: "22,4 km/h". Vírgula decimal (pt-BR). */
export function activitySpeed(durationS: number | null | undefined, distanceM: number | null | undefined): string | null {
  if (durationS == null || distanceM == null) return null
  if (!Number.isFinite(durationS) || !Number.isFinite(distanceM)) return null
  if (durationS <= 0 || distanceM <= 0) return null

  const kmh = (distanceM / 1000) / (durationS / 3600)
  if (kmh > 200) return null   // não é velocidade humana; é erro de digitação
  const txt = (Math.round(kmh * 10) / 10).toFixed(1).replace('.0', '').replace('.', ',')
  return `${txt} km/h`
}

/** A medida de desempenho da sessão, na unidade que a modalidade usa. `null` quando não faz sentido. */
export function activityDerivedPace(s: {
  activity_type?: string | null
  duration_s?: number | null
  distance_m?: number | null
}): string | null {
  const tipo = paceKindFor(s.activity_type)
  if (tipo === 'ritmo') return activityPace(s.duration_s, s.distance_m)
  if (tipo === 'velocidade') return activitySpeed(s.duration_s, s.distance_m)
  return null
}

/**
 * Linha de resumo da sessão. Só o que a fonte mediu entra — ausência de métrica é informação legítima, e
 * preencher com zero o que não foi medido seria afirmar algo falso.
 * Devolve `null` quando a fonte não trouxe nenhuma grandeza.
 *
 * O RITMO/VELOCIDADE é derivado, e entra logo após a distância porque é dela que sai. Não é dado gravado:
 * recalcular garante que nunca contradiga a duração e a distância que estão ao lado dele.
 */
export function activitySummary(s: {
  activity_type?: string | null
  duration_s?: number | null
  distance_m?: number | null
  active_energy_kcal?: number | null
  avg_heart_rate?: number | null
  elevation_gain_m?: number | null
}): string | null {
  const positivo = (n: number | null | undefined) => n != null && Number.isFinite(n) && n >= 0
  const partes = [
    activityDurationLabel(s.duration_s),
    activityDistanceLabel(s.distance_m),
    activityDerivedPace(s),
    positivo(s.avg_heart_rate) && (s.avg_heart_rate as number) > 0 ? `${Math.round(s.avg_heart_rate as number)} bpm` : null,
    positivo(s.elevation_gain_m) && (s.elevation_gain_m as number) > 0 ? `${Math.round(s.elevation_gain_m as number)} m de subida` : null,
    positivo(s.active_energy_kcal) ? `${Math.round(s.active_energy_kcal as number)} kcal` : null,
  ].filter((p): p is string => !!p)
  return partes.length ? partes.join(' · ') : null
}

/**
 * Texto digitado → número, aceitando vírgula decimal (pt-BR). Vazio, inválido ou negativo → `null`.
 *
 * O `null` é o ponto: campo em branco precisa chegar ao banco como AUSENTE, nunca como 0. Uma musculação com
 * "0 km" afirmaria que alguém mediu a distância e ela foi zero — o que é falso, e sobre saúde (HIP-014 §3).
 */
function numeroOuNulo(texto: string | null | undefined): number | null {
  const t = (texto ?? '').trim()
  if (!t) return null
  const limpo = t.replace(',', '.').replace(/[^\d.-]/g, '')
  // Limpar "abc" deixa string vazia, e `Number('')` é 0 — que gravaria "0 km" como se alguém tivesse medido.
  // Exigir que sobre um número de verdade é o que impede o texto inválido de virar afirmação falsa.
  if (!/^-?\d+(\.\d+)?$/.test(limpo)) return null
  const n = Number(limpo)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/**
 * Campo numérico digitado → número, para gravar. Mesma regra dos demais: em branco vira AUSENTE, nunca zero.
 * Serve os campos que já estão na unidade final (frequência cardíaca em bpm, energia em kcal).
 */
export function numberFromField(texto: string | null | undefined): number | null {
  return numeroOuNulo(texto)
}

/** Minutos digitados → segundos, para gravar. Fonte ÚNICA: as duas telas convertiam por conta própria. */
export function durationSecondsFromMinutes(texto: string | null | undefined): number | null {
  const min = numeroOuNulo(texto)
  return min == null ? null : Math.round(min * 60)
}

/** Quilômetros digitados → metros, para gravar. Aceita "5,2" e "5.2". */
export function distanceMetersFromKm(texto: string | null | undefined): number | null {
  const km = numeroOuNulo(texto)
  return km == null ? null : Math.round(km * 1000)
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
