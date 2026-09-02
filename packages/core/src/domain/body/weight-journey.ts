// FB-007 (BOD-001) — acompanhamento de peso (jornada, útil p/ GLP-1). PURO/FACTUAL.
//
// SINTERA organiza, não interpreta (RDC 657): aqui só ARITMÉTICA sobre os pontos que a própria pessoa registrou
// (peso inicial/atual, perda acumulada, ritmo, meta, preservação de massa magra). Nenhum juízo clínico, nenhuma
// recomendação. Sem dependências de data do runtime (recebe datas ISO das medições).

export interface SeriesPoint {
  value: number
  date: string // ISO yyyy-mm-dd
}

export interface WeightJourney {
  startDate: string | null         // data da 1ª medição de peso (início do acompanhamento)
  startWeight: number | null
  currentWeight: number | null
  lostKg: number | null            // inicial − atual (positivo = perdeu)
  spanWeeks: number | null         // intervalo entre a 1ª e a última medição, em semanas
  rateKgPerWeek: number | null     // ritmo médio (lostKg / spanWeeks)
  goalKg: number | null
  remainingKg: number | null       // atual − meta (positivo = ainda a perder)
  progressPct: number | null       // 0..100 do caminho inicial→meta já percorrido
  leanStartKg: number | null
  leanCurrentKg: number | null
  leanDeltaKg: number | null       // atual − inicial (positivo = preservou/ganhou)
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

function sortAsc(points: SeriesPoint[]): SeriesPoint[] {
  return [...points].filter(p => Number.isFinite(p.value) && !!p.date).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

function round(n: number | null, digits = 1): number | null {
  if (n == null || !Number.isFinite(n)) return null
  const f = Math.pow(10, digits)
  return Math.round(n * f) / f
}

/**
 * Calcula a jornada de peso a partir das séries de peso e de massa magra e de uma meta opcional.
 * Puro/determinístico. Retorna nulos quando não há dados suficientes (nunca inventa).
 */
/**
 * COMO A VARIAÇÃO DE PESO É DITA. Uma regra só, para as duas pontas.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────────
 * O DEFEITO (homologação de 31/08, e é do pior tipo: dado errado com aparência de certo).
 *
 * A fundadora foi de 61,2 kg para 64 kg — GANHOU 2,8. A Jornada de peso mostrava **"−2,8 kg"**, e logo abaixo,
 * no mesmo cartão, "+2,8". O mesmo número com dois sinais opostos, na mesma tela.
 *
 * A causa: `lostKg` é "inicial − atual", então PERDA é positiva e GANHO é negativo. O aplicativo escrevia:
 *
 *     lostKg > 0 ? `−${lostKg}` : `${lostKg}`
 *
 * Os dois ramos imprimem menos. Perdeu 2,8 → "−2,8". Ganhou 2,8 → `lostKg` vale −2,8 e sai "−2,8" também.
 * Ganho e perda ficaram indistinguíveis num registro que vai para o relatório levado ao médico.
 *
 * E a Web ACERTAVA — usava `Math.abs` e escrevia "ganho no período". A regra estava escrita duas vezes, uma
 * por ponta, e divergiu. É exatamente o que a base única existe para impedir, na forma mais cara: não é uma
 * tela feia, é um número errado sobre a saúde de alguém.
 * ─────────────────────────────────────────────────────────────────────────────────────────────────────────
 */
export interface VariacaoPeso {
  /** Já com o sinal certo e vírgula decimal: "+2,8 kg" ou "−2,8 kg". */
  readonly texto: string
  /** Ganhou peso no período? Deixa a tela escolher cor e ícone sem reinterpretar o sinal. */
  readonly ganho: boolean
}

/** Número no formato de quem lê em português: vírgula decimal, sem zeros à toa. */
function pt(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',')
}

/**
 * A variação total. `null` quando não há dois pontos para comparar — ausência permanece ausência.
 *
 * Usa o sinal MENOS tipográfico (−), e não o hífen: num número de saúde a diferença entre "-2,8" e "−2,8" é
 * legibilidade, e a legibilidade aqui é o que evita a leitura errada.
 */
export function variacaoDePeso(lostKg: number | null | undefined): VariacaoPeso | null {
  if (lostKg == null || !Number.isFinite(lostKg)) return null
  const ganho = lostKg < 0
  return { texto: `${ganho ? '+' : '−'}${pt(Math.abs(lostKg))} kg`, ganho }
}

/** O ritmo, com a mesma regra de sinal. Sem ela, "−0,02 kg/semana" descrevia um ganho semanal. */
export function ritmoDePeso(rateKgPerWeek: number | null | undefined): VariacaoPeso | null {
  if (rateKgPerWeek == null || !Number.isFinite(rateKgPerWeek)) return null
  const ganho = rateKgPerWeek < 0
  const v = Math.round(Math.abs(rateKgPerWeek) * 100) / 100
  return { texto: `${ganho ? '+' : '−'}${String(v).replace('.', ',')} kg/semana`, ganho }
}

/** Peso com vírgula decimal, para a linha de início e atual não misturarem "61.2" com "64". */
export function pesoLabel(kg: number | null | undefined): string | null {
  return kg == null || !Number.isFinite(kg) ? null : `${pt(kg)} kg`
}

export function computeWeightJourney(
  weight: SeriesPoint[],
  lean: SeriesPoint[],
  goalKg: number | null,
): WeightJourney {
  const w = sortAsc(weight)
  const l = sortAsc(lean)
  const empty: WeightJourney = {
    startDate: null, startWeight: null, currentWeight: null, lostKg: null, spanWeeks: null, rateKgPerWeek: null,
    goalKg: goalKg ?? null, remainingKg: null, progressPct: null,
    leanStartKg: null, leanCurrentKg: null, leanDeltaKg: null,
  }
  if (w.length === 0) {
    // Sem peso: ainda podemos reportar a massa magra.
    if (l.length > 0) {
      const leanStart = l[0].value, leanCurrent = l[l.length - 1].value
      return { ...empty, leanStartKg: round(leanStart), leanCurrentKg: round(leanCurrent), leanDeltaKg: round(leanCurrent - leanStart) }
    }
    return empty
  }

  const start = w[0], current = w[w.length - 1]
  const lostKg = start.value - current.value
  const spanMs = new Date(`${current.date}T00:00:00Z`).getTime() - new Date(`${start.date}T00:00:00Z`).getTime()
  const spanWeeks = spanMs > 0 ? spanMs / MS_PER_WEEK : null
  const rate = spanWeeks && spanWeeks > 0 ? lostKg / spanWeeks : null

  let remainingKg: number | null = null
  let progressPct: number | null = null
  if (goalKg != null && Number.isFinite(goalKg)) {
    remainingKg = current.value - goalKg
    const totalToLose = start.value - goalKg
    if (totalToLose > 0) progressPct = Math.max(0, Math.min(100, (lostKg / totalToLose) * 100))
    else if (totalToLose === 0) progressPct = 100
  }

  const leanStart = l.length > 0 ? l[0].value : null
  const leanCurrent = l.length > 0 ? l[l.length - 1].value : null
  const leanDelta = leanStart != null && leanCurrent != null ? leanCurrent - leanStart : null

  return {
    startDate: start.date,
    startWeight: round(start.value),
    currentWeight: round(current.value),
    lostKg: round(lostKg),
    spanWeeks: round(spanWeeks),
    rateKgPerWeek: round(rate, 2),
    goalKg: goalKg ?? null,
    remainingKg: round(remainingKg),
    progressPct: round(progressPct, 0),
    leanStartKg: round(leanStart),
    leanCurrentKg: round(leanCurrent),
    leanDeltaKg: round(leanDelta),
  }
}
