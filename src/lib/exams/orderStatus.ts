// Q1 (Pedidos ↔ Exames) — ESTADO do pedido como entidade histórica (fundadora 18/07).
// O pedido NÃO é substituído pelo exame: ele é a ORIGEM. Ciclo de vida puro/determinístico,
// desacoplado de IO. Complementa careFlow.ts (etapas do exame) — aqui é o estado do PEDIDO.
//
//   pendente  → criado, ainda sem realização registrada
//   realizado → o exame foi feito (marcado manualmente; NÃO exige o laudo — momentos independentes)
//   finalizado→ há ≥1 resultado vinculado ao pedido (rastreabilidade origem↔resultado estabelecida)
//
// 1 pedido → N resultados: um pedido pode originar vários exames; "finalizado" = já tem resultado(s).
// (A completude por item — "quais exames deste pedido faltam" — é evolução futura: exige modelar os
// itens esperados do pedido; aqui não se presume total.)

export type OrderStatus = 'pendente' | 'realizado' | 'finalizado'

export const ORDER_STATUSES: OrderStatus[] = ['pendente', 'realizado', 'finalizado']

/** Normaliza o valor persistido (aberto/legado) para um estado conhecido. Default: 'pendente'. */
export function orderStatusOf(raw: string | null | undefined): OrderStatus {
  return raw === 'realizado' ? 'realizado' : raw === 'finalizado' ? 'finalizado' : 'pendente'
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendente: 'Pendente', realizado: 'Realizado', finalizado: 'Finalizado',
}
export const orderStatusLabel = (raw: string | null | undefined): string => ORDER_STATUS_LABEL[orderStatusOf(raw)]

/**
 * Estado EFETIVO do pedido considerando os resultados vinculados. Ter resultado vinculado é o sinal
 * mais forte (finalizado) e prevalece sobre o valor marcado manualmente. Puro.
 */
export function effectiveOrderStatus(raw: string | null | undefined, linkedResultCount: number): OrderStatus {
  if (linkedResultCount > 0) return 'finalizado'
  return orderStatusOf(raw)
}
