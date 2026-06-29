// ════════ HealthPresentationConfig — Camada 1 (APRESENTAÇÃO) ════════
// Fonte ÚNICA de apresentação dos TIPOS DE CATÁLOGO (medications.kind). label · ícone
// · ordem (a do array) · grupo · cor. Toda superfície (Relatório, Linha do Tempo,
// Busca, Dashboard, Exportações) consome ISTO — sem mapas locais divergentes.
//
// Critério (ADR-013): só MUDA A FORMA de apresentar dados que já existem (kind) — não
// muda significado. A Camada 2 (HealthTaxonomy completo: Ação·Objeto·Entidade,
// relacionamentos, regras) nasce no T2-D2B. Os rótulos de TIPO DE EVENTO já têm fonte
// única própria (typeLabel/EVENT_TYPE_LABELS, ADR-012); este módulo cobre o CATÁLOGO.

import { Pill, Leaf, Package, Glasses } from 'lucide-react'
import type React from 'react'

export type CatalogKind = 'medicamento' | 'suplemento' | 'produto' | 'dispositivo'

export interface CatalogKindDef {
  key: CatalogKind
  label: string          // plural (rótulo de grupo)
  singular: string       // singular (sufixo em item, ex.: "(suplemento)")
  Icon: React.ElementType
  tint: string           // cor do ícone (classe Tailwind)
}

export const CATALOG_KINDS: CatalogKindDef[] = [
  { key: 'medicamento', label: 'Medicamentos', singular: 'medicamento', Icon: Pill,    tint: 'text-sage' },
  { key: 'suplemento',  label: 'Suplementos',  singular: 'suplemento',  Icon: Leaf,    tint: 'text-sage' },
  { key: 'produto',     label: 'Produtos',     singular: 'produto',     Icon: Package, tint: 'text-petal' },
  { key: 'dispositivo', label: 'Dispositivos', singular: 'dispositivo', Icon: Glasses, tint: 'text-lavender' },
]

/** Normaliza um kind cru para um dos 4 oficiais (default: medicamento). */
export function normalizeKind(kind: string | null | undefined): CatalogKind {
  return (['suplemento', 'produto', 'dispositivo'].includes(kind ?? '') ? kind : 'medicamento') as CatalogKind
}

/** Rótulo PLURAL do tipo de catálogo (fonte única). */
export function catalogKindLabel(kind: string | null | undefined): string {
  return CATALOG_KINDS.find(c => c.key === kind)?.label ?? 'Outros'
}
