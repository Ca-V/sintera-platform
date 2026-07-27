// @sintera/utils — coleções e comparadores genéricos (puros, sem domínio, sem IO).

/** Comparador por campo, para Array.sort (asc por padrão). Compara com </> (strings/números/datas ISO). */
export function byField<T>(field: keyof T, dir: 'asc' | 'desc' = 'asc'): (a: T, b: T) => number {
  const sign = dir === 'desc' ? -1 : 1
  return (a, b) => {
    const av = a[field]
    const bv = b[field]
    if (av === bv) return 0
    return (av < bv ? -1 : 1) * sign
  }
}

/** Agrupa por chave derivada, preservando a ordem de primeira aparição das chaves e dos itens. */
export function groupBy<T, K>(items: readonly T[], keyFn: (item: T) => K): Map<K, T[]> {
  const out = new Map<K, T[]>()
  for (const item of items) {
    const k = keyFn(item)
    const arr = out.get(k)
    if (arr) arr.push(item)
    else out.set(k, [item])
  }
  return out
}

/** Remove duplicados por chave, mantendo o PRIMEIRO de cada chave (ordem estável). */
export function uniqueBy<T, K>(items: readonly T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>()
  const out: T[] = []
  for (const item of items) {
    const k = keyFn(item)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(item)
    }
  }
  return out
}
