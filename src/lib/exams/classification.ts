// Classificação Exame × Pedido/Solicitação (F4) — separa os dois objetos por documentType.
// Um "pedido" (medical_order) ou "guia de convênio" (insurance_guide) é uma SOLICITAÇÃO, com ciclo
// de vida distinto do exame realizado. Determinística; reutilizada na página de Exames (abas).

export const ORDER_DOCUMENT_TYPES = new Set(['medical_order', 'insurance_guide'])

/** É um documento de pedido/solicitação (vai para a aba "Pedidos e Solicitações")? */
export function isOrderDocumentType(documentType: string | null | undefined): boolean {
  return ORDER_DOCUMENT_TYPES.has((documentType ?? '').trim())
}
