// ============================================================
// ItemCard — modelo de apresentação (sem domínio/Estado 2)
// ============================================================
// "Praticamente tudo na SINTERA é um item": medicamento, suplemento, produto,
// dispositivo, exame, condição, programa, documento. Este é o contrato de
// APRESENTAÇÃO parametrizado por `kind` — não importa tabelas/Catálogo aqui.
// ============================================================

import type { BadgeTone } from '@sintera/design-system'

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

/** Tom do Badge (DS-002) por status — preserva a cor histórica (sage azul → info; lavender terracota → error). */
export const STATUS_BADGE: Record<ItemStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Ativo', tone: 'info' },
  suspended: { label: 'Suspenso', tone: 'attention' },
  pending: { label: 'Pendente', tone: 'error' },
  archived: { label: 'Arquivado', tone: 'neutral' },
}

export const ALL_ITEM_KINDS = Object.keys(ITEM_KIND_LABEL) as ItemKind[]

export function itemKindLabel(kind: ItemKind): string {
  return ITEM_KIND_LABEL[kind]
}
