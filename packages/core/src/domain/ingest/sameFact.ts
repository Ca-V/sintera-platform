// @sintera/core — "ISTO JÁ ESTÁ NA PLATAFORMA?" — detecção do MESMO FATO chegando por caminhos diferentes.
//
// REGRA DA FUNDADORA (28/08, PERMANENTE): "qualquer informação que entre na plataforma — pelo próprio usuário,
// por upload, ou por transferência de dados de alguma empresa — a plataforma precisa ler essa informação,
// identificar se já existe, e se existir informar à usuária e perguntar o que fazer."
//
// O QUE O BANCO JÁ RESOLVE, E O QUE NÃO. As chaves de unicidade impedem a REPETIÇÃO EXATA: a mesma corrida, da
// mesma fonte, com o mesmo identificador, entra uma vez só por mais que se sincronize. O que elas não pegam é o
// MESMO FATO por CAMINHOS diferentes — a corrida que chega pelo Strava direto e também pelo Health Connect. Os
// identificadores externos são outros, os horários diferem por segundos, e o banco vê dois fatos.
//
// POR QUE ISSO NÃO É DETALHE. Uma corrida contada duas vezes vira duas horas de exercício que não existiram, e
// um relatório levado ao médico com o dobro do que a pessoa fez. Num produto que promete fidelidade à fonte,
// duplicar em silêncio é pior do que não importar.
//
// ESTE MÓDULO NUNCA DECIDE SOZINHO. Ele SUSPEITA e explica por quê; quem decide é a pessoa. Apagar
// automaticamente exigiria certeza que não se tem: dois treinos seguidos na mesma esteira são parecidos e
// legítimos. O custo de errar apagando é perder um fato real — irreversível, e o oposto do que a plataforma é.

/** Sessão de atividade reduzida ao que importa para comparar. */
export interface ActivityForMatch {
  readonly id: string
  /** De onde veio: 'strava', 'garmin', 'health_connect', 'manual'… */
  readonly source: string
  readonly activityType?: string | null
  /** Instante ISO de início. */
  readonly startedAt: string
  readonly durationS?: number | null
  readonly distanceM?: number | null
}

export interface DuplicateSuspicion<T> {
  /** O registro que chegou depois — o candidato a ser descartado, se a pessoa quiser. */
  readonly incoming: T
  /** O que já estava na plataforma. */
  readonly existing: T
  /** Por que se parecem, em português, para a tela poder mostrar sem redigir de novo. */
  readonly reason: string
}

/**
 * Tolerância de INÍCIO, em minutos.
 *
 * Relógio e celular não começam a contar no mesmo segundo, e o Strava marca o início quando o movimento começa
 * enquanto o relógio marca quando se apertou o botão. Cinco minutos cobre essa diferença sem alcançar duas
 * corridas de verdade — ninguém faz duas atividades distintas começando com cinco minutos de intervalo.
 */
const TOLERANCIA_INICIO_MIN = 5

/**
 * Tolerância de DISTÂNCIA, proporcional.
 *
 * Dois GPS medindo a mesma corrida divergem alguns por cento — árvores, prédios, taxa de amostragem. Dez por
 * cento acomoda isso.
 */
const TOLERANCIA_DISTANCIA = 0.10

/**
 * Tolerância de DURAÇÃO, proporcional — mais larga que a de distância, de propósito.
 *
 * Aqui está a armadilha: alguns apps reportam tempo EM MOVIMENTO e outros o tempo TOTAL. Uma corrida com duas
 * paradas no semáforo pode aparecer como 28 minutos num e 34 noutro. Uma tolerância estreita perderia justamente
 * o caso mais comum de duplicata entre fontes.
 */
const TOLERANCIA_DURACAO = 0.20

function instante(iso: string): number {
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : NaN
}

/** Diferença proporcional entre dois números. `null` quando algum não existe (não dá para comparar). */
function proximidade(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) return null
  const maior = Math.max(Math.abs(a), Math.abs(b))
  if (maior === 0) return 0
  return Math.abs(a - b) / maior
}

function minutos(ms: number): number { return Math.round(ms / 60000) }

/**
 * `incoming` parece ser o mesmo fato que `existing`?
 *
 * Exige, sempre: fontes DIFERENTES (a mesma fonte o banco já deduplica) e início próximo. Além disso, precisa de
 * pelo menos UMA confirmação — distância parecida ou duração parecida. Só o horário não basta: duas atividades
 * diferentes podem começar juntas (pedalar até a academia e depois treinar).
 *
 * Devolve a razão em português, para a tela não redigir a própria explicação — e para as duas pontas dizerem
 * exatamente a mesma coisa.
 */
export function sameActivityFact(
  incoming: ActivityForMatch, existing: ActivityForMatch,
): DuplicateSuspicion<ActivityForMatch> | null {
  if (incoming.id === existing.id) return null
  // A MESMA fonte já é impedida pela chave do banco. Suspeitar aqui marcaria como duplicata dois treinos
  // seguidos legítimos, do mesmo relógio.
  if (incoming.source === existing.source) return null

  const ti = instante(incoming.startedAt)
  const te = instante(existing.startedAt)
  if (!Number.isFinite(ti) || !Number.isFinite(te)) return null

  const difMin = minutos(Math.abs(ti - te))
  if (difMin > TOLERANCIA_INICIO_MIN) return null

  const dDist = proximidade(incoming.distanceM, existing.distanceM)
  const dDur = proximidade(incoming.durationS, existing.durationS)

  const distanciaBate = dDist != null && dDist <= TOLERANCIA_DISTANCIA
  const duracaoBate = dDur != null && dDur <= TOLERANCIA_DURACAO
  if (!distanciaBate && !duracaoBate) return null

  const quando = difMin === 0 ? 'no mesmo horário' : `com ${difMin} min de diferença`
  const confirmacao = distanciaBate && duracaoBate
    ? 'mesma distância e duração'
    : distanciaBate ? 'mesma distância' : 'mesma duração'

  return {
    incoming,
    existing,
    reason: `Começou ${quando} que uma atividade de ${existing.source}, com ${confirmacao}.`,
  }
}

/**
 * Confronta o que ACABOU de chegar com o que já estava guardado.
 *
 * Cada entrada suspeita aparece UMA vez, emparelhada com a primeira correspondência encontrada. Listar todos os
 * pares possíveis daria à pessoa três perguntas sobre a mesma corrida.
 */
export function suspectedDuplicateActivities(
  incoming: readonly ActivityForMatch[],
  existing: readonly ActivityForMatch[],
): DuplicateSuspicion<ActivityForMatch>[] {
  const achados: DuplicateSuspicion<ActivityForMatch>[] = []
  for (const novo of incoming) {
    for (const antigo of existing) {
      const s = sameActivityFact(novo, antigo)
      if (s) { achados.push(s); break }
    }
  }
  return achados
}

/** Observação pontual (sinal vital, peso) reduzida ao que importa para comparar. */
export interface ObservationForMatch {
  readonly id: string
  readonly source: string
  readonly metric: string
  readonly recordedAt: string
  readonly value?: number | null
}

/**
 * Tolerância de INSTANTE para observações, em minutos.
 *
 * Muito mais estreita que a de atividade, e por um motivo clínico: duas medições de pressão com dois minutos de
 * intervalo podem ser duas medições DE VERDADE — é exatamente o que o médico pede quando manda medir de novo
 * após repouso. Tratar as duas como duplicata apagaria um fato clínico.
 */
const TOLERANCIA_OBS_MIN = 2

/** Tolerância de VALOR: a mesma balança lida por dois apps arredonda diferente. */
const TOLERANCIA_VALOR = 0.02

/**
 * A observação que chegou é o mesmo fato que uma já guardada?
 *
 * Exige fonte diferente, MESMA métrica, instante muito próximo e valor praticamente igual. Sem a checagem de
 * valor, duas medições legítimas e seguidas seriam confundidas.
 */
export function sameObservationFact(
  incoming: ObservationForMatch, existing: ObservationForMatch,
): DuplicateSuspicion<ObservationForMatch> | null {
  if (incoming.id === existing.id) return null
  if (incoming.source === existing.source) return null
  if (incoming.metric !== existing.metric) return null

  const ti = instante(incoming.recordedAt)
  const te = instante(existing.recordedAt)
  if (!Number.isFinite(ti) || !Number.isFinite(te)) return null
  if (minutos(Math.abs(ti - te)) > TOLERANCIA_OBS_MIN) return null

  const dVal = proximidade(incoming.value, existing.value)
  if (dVal == null || dVal > TOLERANCIA_VALOR) return null

  return {
    incoming,
    existing,
    reason: `Mesma medição já registrada por ${existing.source}, no mesmo horário e com o mesmo valor.`,
  }
}

export function suspectedDuplicateObservations(
  incoming: readonly ObservationForMatch[],
  existing: readonly ObservationForMatch[],
): DuplicateSuspicion<ObservationForMatch>[] {
  const achados: DuplicateSuspicion<ObservationForMatch>[] = []
  for (const novo of incoming) {
    for (const antigo of existing) {
      const s = sameObservationFact(novo, antigo)
      if (s) { achados.push(s); break }
    }
  }
  return achados
}

/** O que a plataforma oferece quando encontra um possível duplicado. Nunca decide sozinha. */
export const DUPLICATE_CHOICES = [
  { id: 'manter-ambos', label: 'Manter as duas', hint: 'São fatos diferentes, apesar de parecidos.' },
  { id: 'descartar-novo', label: 'Ficar com a que já estava', hint: 'A nova é a mesma coisa, por outro caminho.' },
  { id: 'substituir', label: 'Substituir pela nova', hint: 'A nova tem mais detalhe ou veio da fonte principal.' },
] as const

export type DuplicateChoice = typeof DUPLICATE_CHOICES[number]['id']
