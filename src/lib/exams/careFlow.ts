// Fluxo assistencial do exame (fundadora 15/07): a arquitetura prevê EXPLICITAMENTE as etapas
//   Pedido → Agendamento → Realização → Resultado
// para que um evento AGENDADO não seja interpretado como exame REALIZADO, nem realizado como
// tendo RESULTADO. A UI pode expor só parte destes estados; o domínio os modela por inteiro.
//
// Camada de DOMÍNIO: pura/determinística, sem IO. Reutiliza o status do Evento Assistencial
// (planejado/realizado) e a existência de documento de pedido / de resultado.

export type CareStage = 'requested' | 'scheduled' | 'performed' | 'resulted'

/** Etapas em ORDEM + rótulo pt-BR (para timeline/stepper na UI, quando exposto). */
export const CARE_STAGES: { key: CareStage; label: string }[] = [
  { key: 'requested', label: 'Pedido' },
  { key: 'scheduled', label: 'Agendamento' },
  { key: 'performed', label: 'Realização' },
  { key: 'resulted',  label: 'Resultado' },
]

const ORDER: CareStage[] = CARE_STAGES.map(s => s.key)

/** Índice ordinal da etapa (para comparar progresso). */
export function stageIndex(stage: CareStage): number {
  return ORDER.indexOf(stage)
}

/** Próxima etapa do fluxo (null se já é a última). */
export function nextStage(stage: CareStage): CareStage | null {
  const i = ORDER.indexOf(stage)
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null
}

/**
 * Resolve a etapa ATUAL a partir dos fatos disponíveis. Prioriza a etapa mais AVANÇADA já atingida:
 * ter resultado > realizado > agendado > pedido. Agendado NÃO implica realizado; realizado NÃO
 * implica resultado. Retorna null quando não há nenhum sinal (nada a exibir).
 */
export function resolveCareStage(facts: {
  hasResult?: boolean          // existe documento/registro de RESULTADO do exame
  eventPerformed?: boolean     // o evento assistencial está 'realizado'
  hasScheduledEvent?: boolean  // existe evento (planejado) para a realização
  hasRequest?: boolean         // existe pedido/solicitação
}): CareStage | null {
  if (facts.hasResult) return 'resulted'
  if (facts.eventPerformed) return 'performed'
  if (facts.hasScheduledEvent) return 'scheduled'
  if (facts.hasRequest) return 'requested'
  return null
}

/** Uma etapa já foi ALCANÇADA no fluxo atual? (útil para stepper: marcar passos concluídos). */
export function stageReached(current: CareStage | null, target: CareStage): boolean {
  return current != null && stageIndex(current) >= stageIndex(target)
}

/**
 * Mapeia o CONTEXTO de um registro de exame para a etapa atual do fluxo. Puro e desacoplado do
 * modelo de Evento (recebe apenas os STATUS dos eventos vinculados, não o tipo HealthEvent).
 * - `hasResult`: o documento traz resultado (biomarcadores/resultados clínicos).
 * - `isOrder`: o próprio documento é um PEDIDO/solicitação (medical_order/insurance_guide).
 * - `linkedEventStatuses`: status dos eventos assistenciais vinculados a este exame ('realizado' etc.).
 */
export function careStageFor(input: {
  hasResult: boolean
  isOrder: boolean
  linkedEventStatuses: readonly string[]
}): CareStage | null {
  return resolveCareStage({
    hasResult: input.hasResult,
    eventPerformed: input.linkedEventStatuses.includes('realizado'),
    hasScheduledEvent: input.linkedEventStatuses.length > 0,
    hasRequest: input.isOrder,
  })
}
