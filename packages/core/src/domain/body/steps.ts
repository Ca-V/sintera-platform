// @sintera/core — PASSOS por dia. Observação de atividade, não sinal vital.
//
// POR QUE ISTO EXISTE. O Health Connect entrega passos, e eles chegavam à plataforma sem lugar nenhum: não são
// métrica corporal (a coluna `body_metrics.metric` tem restrição que não os aceita) nem sessão de atividade
// (uma sessão tem início, fim e duração; passos são uma contagem contínua do dia). Ficavam guardados no bruto,
// com procedência, e invisíveis.
//
// A ALTERNATIVA QUE NÃO SEGUI. Dava para acrescentar 'passos' à restrição de `body_metrics` e projetá-los junto
// dos sinais vitais. Isso exigiria migração em produção e, pior, colocaria uma contagem acumulada do dia ao lado
// de medições instantâneas — pressão e glicemia são um instante; passos são um total. Somar as duas naturezas na
// mesma lista faria a tela mentir sobre o que cada número é.
//
// O QUE FAÇO. Leio do bruto (`wearable_readings`), onde os passos já estão, e agrego por DIA. Sem mudança de
// esquema, sem inventar sessão, sem misturar natureza.

/** Leitura crua de passos, como vem de `wearable_readings`. */
export interface StepReading {
  readonly recordedAt: string
  readonly value: number | null
  /** De onde veio — Strava, Garmin, o próprio aparelho. A procedência acompanha o número. */
  readonly provider: string
}

export interface DailySteps {
  /** 'YYYY-MM-DD', em UTC (DATE-001: determinístico). */
  readonly day: string
  readonly total: number
  /** Fontes que contribuíram naquele dia. Duas fontes no mesmo dia é caso normal, não erro. */
  readonly providers: readonly string[]
}

/**
 * Soma os passos por dia.
 *
 * SOMAR é o certo aqui, e é diferente do que se faz com sinal vital. O Health Connect entrega passos em
 * intervalos curtos — vários registros por dia, cada um com a contagem daquele trecho. O total do dia é a soma.
 * Já pressão arterial nunca se soma: cada medição é um fato isolado, e a projeção guarda a última do dia.
 *
 * FONTES DIFERENTES TAMBÉM SOMAM? Não — e é a decisão mais delicada aqui. Se o relógio e o celular contarem os
 * mesmos passos, somar daria o dobro. Fica o MAIOR total por fonte no dia: a fonte que mais viu é a que mais se
 * aproxima do real, e nenhuma contagem é inventada. As outras fontes continuam registradas em `providers`, para
 * a tela poder dizer de onde veio.
 */
export function dailySteps(readings: readonly StepReading[]): DailySteps[] {
  // dia → fonte → total daquela fonte
  const porDia = new Map<string, Map<string, number>>()
  const ordem: string[] = []

  for (const r of readings) {
    if (r.value == null || !Number.isFinite(r.value) || r.value < 0) continue
    const dia = (r.recordedAt ?? '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue

    if (!porDia.has(dia)) { porDia.set(dia, new Map()); ordem.push(dia) }
    const fontes = porDia.get(dia)!
    const fonte = (r.provider ?? '').trim() || 'desconhecida'
    fontes.set(fonte, (fontes.get(fonte) ?? 0) + r.value)
  }

  return ordem
    .map(dia => {
      const fontes = porDia.get(dia)!
      const total = Math.max(...fontes.values())
      return {
        day: dia,
        total: Math.round(total),
        providers: [...fontes.keys()].sort(),
      }
    })
    // Mais recente primeiro, como toda série da plataforma.
    .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0))
}

/** "8.432 passos" — com separador de milhar, que é como se lê um número desse tamanho. */
export function stepsLabel(total: number): string {
  return `${Math.round(total).toLocaleString('pt-BR')} passos`
}

/**
 * Linha de origem dos passos do dia. `null` quando não há fonte conhecida.
 *
 * Diz "Strava" quando uma fonte contou, e "Strava e Garmin" quando duas contaram — caso em que o total exibido
 * é o da que mais viu, não a soma. Sem esta linha, o número pareceria vir do nada.
 */
export function stepsProvenance(day: DailySteps): string | null {
  const fontes = day.providers.filter(p => p && p !== 'desconhecida')
  if (fontes.length === 0) return null
  if (fontes.length === 1) return fontes[0]
  return `${fontes.slice(0, -1).join(', ')} e ${fontes[fontes.length - 1]}`
}
