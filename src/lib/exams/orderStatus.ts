// Q1 (Pedidos ↔ Exames) — estado do pedido. FONTE ÚNICA movida para `@sintera/core`
// (domain/exams/orderStatus) para paridade Web+Mobile. Este módulo só re-exporta, mantendo o
// caminho de import estável na Web (@/lib/exams/orderStatus).
export {
  type OrderStatus, ORDER_STATUSES, orderStatusOf, ORDER_STATUS_LABEL, orderStatusLabel, effectiveOrderStatus,
} from '@sintera/core'
