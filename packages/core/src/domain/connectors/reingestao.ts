// @sintera/core — O QUE UMA NOVA SINCRONIZAÇÃO PODE CORRIGIR num registro que já entrou.
//
// O CASO (30/08). Doze atividades do Strava entraram com o tipo errado ("Outra atividade") e sem distância,
// por dois defeitos de leitura nossos. Corrigimos a leitura — e descobrimos que não adiantava: a ingestão pula
// o que já existe, então as doze ficariam erradas para sempre. A pessoa teria de apagar uma a uma e sincronizar
// de novo, para consertar um erro que não foi dela.
//
// "Pular o que já existe" estava certo pelo motivo certo — impedir que a fonte sobrescreva o que a pessoa
// corrigiu à mão. Mas confundia duas coisas muito diferentes: PRESERVAR o que já se sabe, e CONGELAR o que
// ainda não se sabia.
//
// A REGRA, e ela é conservadora de propósito:
//
//   - PREENCHE o que está vazio. Um campo nulo não é uma decisão de ninguém; é ausência.
//   - CORRIGE apenas o que era PALPITE nosso — o tipo 'outro' é o valor que a plataforma usa quando não
//     reconheceu, e substituí-lo por um tipo reconhecido não descarta informação, acrescenta.
//   - NUNCA sobrescreve um valor existente. Se o registro diz 8 km e a fonte agora diz 8,2 km, fica 8 km:
//     pode ter sido a pessoa quem corrigiu, e não há como distinguir. Perder uma correção dela é pior do que
//     conviver com uma imprecisão da fonte.
//
// Fica no core porque é regra de domínio — a decisão sobre o que um dado novo pode fazer com um dado antigo —
// e vale igual em toda ingestão, de qualquer conector, nas duas pontas.

/** Só os campos que uma re-sincronização tem permissão de tocar. */
export interface CamposDeFonte {
  activity_type?: string | null
  title?: string | null
  ended_at?: string | null
  duration_s?: number | null
  distance_m?: number | null
  elevation_gain_m?: number | null
  active_energy_kcal?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
  steps?: number | null
  connector_version?: string | null
}

/** O valor que a plataforma usa quando não reconheceu o tipo. É palpite, não afirmação — e por isso corrigível. */
const TIPO_DESCONHECIDO = 'outro'

const ausente = (v: unknown): boolean => v === null || v === undefined || v === ''

/**
 * O que mudar num registro já gravado, à luz do que a fonte manda agora. `null` quando não há nada a fazer —
 * e não haver nada a fazer é o caso normal, então não se escreve no banco à toa.
 *
 * `connector_version` acompanha a correção: sem ela, não dá para saber depois QUAL versão produziu cada campo,
 * e a auditoria de uma leitura corrigida fica impossível de reconstruir.
 */
export function camposACorrigir(
  existente: Readonly<CamposDeFonte>,
  novo: Readonly<CamposDeFonte>,
): Partial<CamposDeFonte> | null {
  const mudancas: Partial<CamposDeFonte> = {}

  // O tipo é o único campo em que se substitui algo já preenchido — e só quando o que está lá é o nosso palpite.
  if (
    !ausente(novo.activity_type) && novo.activity_type !== TIPO_DESCONHECIDO &&
    (ausente(existente.activity_type) || existente.activity_type === TIPO_DESCONHECIDO)
  ) {
    mudancas.activity_type = novo.activity_type
  }

  // Todos os demais: preenche o vazio, nunca sobrescreve.
  const preencher = ['title', 'ended_at', 'duration_s', 'distance_m', 'elevation_gain_m',
    'active_energy_kcal', 'avg_heart_rate', 'max_heart_rate', 'steps'] as const
  for (const campo of preencher) {
    if (ausente(existente[campo]) && !ausente(novo[campo])) {
      (mudancas as Record<string, unknown>)[campo] = novo[campo]
    }
  }

  if (Object.keys(mudancas).length === 0) return null
  if (!ausente(novo.connector_version)) mudancas.connector_version = novo.connector_version
  return mudancas
}
