// Rótulos de material/painel — ORIGEM ÚNICA no Scientific Catalog v2 (tabelas
// `materials`/`panels`). Substitui o transicional `panels.ts`: a nomenclatura
// (rótulo + ordenação) agora vem do catálogo (Princípio #12 — SSOT). A LÓGICA de
// agrupamento (groupBySpecimen) é do DOMÍNIO e permanece aqui; só os RÓTULOS
// deixam de ser hardcoded. Sem juízo clínico (RDC 657).

import type { SupabaseClient } from '@supabase/supabase-js'

export interface CatalogLabels {
  /** Ordem dos materiais (specimen) por sort_order do catálogo. */
  specimenOrder: string[]
  /** Rótulo do material (fallback 'Outros exames' — preserva o comportamento anterior). */
  materialLabel: (code: string | null | undefined) => string
  /** Rótulo do painel (fallback null — preserva o comportamento anterior). */
  panelLabel: (code: string | null | undefined) => string | null
}

interface RefRow { id: string; label: string; sort_order: number }

/** Constrói os resolvedores de rótulo a partir das linhas de materials/panels. Puro/testável. */
export function buildCatalogLabels(materials: RefRow[], panels: RefRow[]): CatalogLabels {
  const matMap = new Map(materials.map(m => [m.id, m.label]))
  const panMap = new Map(panels.map(p => [p.id, p.label]))
  const specimenOrder = [...materials].sort((a, b) => a.sort_order - b.sort_order).map(m => m.id)
  return {
    specimenOrder,
    materialLabel: (c) => matMap.get(c ?? '') ?? 'Outros exames',
    panelLabel: (c) => panMap.get(c ?? '') ?? null,
  }
}

/** Carrega materials/panels do catálogo e devolve os resolvedores de rótulo. */
export async function loadCatalogLabels(supabase: SupabaseClient): Promise<CatalogLabels> {
  const [mats, pans] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('materials').select('id, label, sort_order'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('panels').select('id, label, sort_order'),
  ])
  return buildCatalogLabels((mats.data ?? []) as RefRow[], (pans.data ?? []) as RefRow[])
}

export interface MaterialGroup<T> {
  key: string
  label: string
  items: T[]
}

/**
 * Agrupa itens SÓ por material (specimen), preservando a ordem de entrada.
 * SEM nível de painel fisiológico — a dimensão científica (category) NÃO segmenta a
 * UI (ela pertence ao Knowledge Graph). Usado na Evolução (série longitudinal por
 * biomarcador): Material → Biomarcadores. Rótulos/ordem do catálogo. (ING-003)
 */
export function groupByMaterial<T>(
  items: T[],
  get: (t: T) => { specimen: string | null },
  labels: CatalogLabels,
): MaterialGroup<T>[] {
  const mats = new Map<string, T[]>()
  for (const it of items) {
    const sk = get(it).specimen ?? 'outros'
    if (!mats.has(sk)) mats.set(sk, [])
    mats.get(sk)!.push(it)
  }
  const rank = (k: string) => { const i = labels.specimenOrder.indexOf(k); return i < 0 ? 99 : i }
  return [...mats.keys()]
    .sort((a, b) => rank(a) - rank(b))
    .map(sk => ({ key: sk, label: labels.materialLabel(sk), items: mats.get(sk)! }))
}

export interface PanelGroup<T> {
  key: string
  label: string
  categories: { key: string; label: string | null; items: T[] }[]
}

/**
 * Agrupa itens por material (specimen) → painel (category), preservando a ordem de
 * entrada. Os rótulos e a ordenação vêm do catálogo (CatalogLabels). A lógica de
 * agrupamento é a mesma do antigo panels.ts (domínio) — só a fonte dos rótulos mudou.
 */
export function groupBySpecimen<T>(
  items: T[],
  get: (t: T) => { specimen: string | null; category: string | null },
  labels: CatalogLabels,
): PanelGroup<T>[] {
  const specs = new Map<string, Map<string, T[]>>()
  for (const it of items) {
    const { specimen, category } = get(it)
    const sk = specimen ?? 'outros'
    const ck = category ?? 'outros'
    if (!specs.has(sk)) specs.set(sk, new Map())
    const cats = specs.get(sk)!
    if (!cats.has(ck)) cats.set(ck, [])
    cats.get(ck)!.push(it)
  }
  const rank = (k: string) => { const i = labels.specimenOrder.indexOf(k); return i < 0 ? 99 : i }
  return [...specs.keys()]
    .sort((a, b) => rank(a) - rank(b))
    .map(sk => ({
      key: sk,
      label: labels.materialLabel(sk),
      categories: [...specs.get(sk)!.entries()].map(([ck, items]) => ({
        key: ck,
        label: labels.panelLabel(ck),
        items,
      })),
    }))
}
