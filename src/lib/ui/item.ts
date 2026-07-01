// ============================================================
// ItemCard — modelo de apresentação (sem domínio/Estado 2)
// ============================================================
// "Praticamente tudo na SINTERA é um item": medicamento, suplemento, produto,
// dispositivo, exame, condição, programa, documento. Este é o contrato de
// APRESENTAÇÃO parametrizado por `kind` — não importa tabelas/Catálogo aqui.
// ============================================================

export type ItemKind =
  | 'medication'
  | 'supplement'
  | 'product'
  | 'device'
  | 'exam'
  | 'condition'
  | 'program'
  | 'document'

export type ItemStatus = 'active' | 'suspended' | 'pending' | 'archived'

export const ITEM_KIND_LABEL: Record<ItemKind, string> = {
  medication: 'Medicamento',
  supplement: 'Suplemento',
  product: 'Produto',
  device: 'Dispositivo',
  exam: 'Exame',
  condition: 'Condição',
  program: 'Programa',
  document: 'Documento',
}

/** Variante do Badge (componente existente) por status. */
export type BadgeVariant = 'rose' | 'lavender' | 'sage' | 'gold' | 'neutral'

export const STATUS_BADGE: Record<ItemStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Ativo', variant: 'sage' },
  suspended: { label: 'Suspenso', variant: 'gold' },
  pending: { label: 'Pendente', variant: 'lavender' },
  archived: { label: 'Arquivado', variant: 'neutral' },
}

export const ALL_ITEM_KINDS = Object.keys(ITEM_KIND_LABEL) as ItemKind[]

export function itemKindLabel(kind: ItemKind): string {
  return ITEM_KIND_LABEL[kind]
}
