// Fase C — validação ESTRUTURAL do Bundle canônico (invariantes internos; NÃO é validação de perfil RNDS/BR-Core).
import type { FhirBundle, FhirResource } from './projector'

/** Coleta todas as strings `reference` do grafo (recursivo). */
function collectReferences(node: unknown, acc: string[]): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) { for (const v of node) collectReferences(v, acc); return }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === 'reference' && typeof v === 'string') acc.push(v)
    else collectReferences(v, acc)
  }
}

/** Referências que NÃO resolvem para um recurso presente no bundle (`Tipo/id`). */
export function unresolvedReferences(bundle: FhirBundle): string[] {
  const present = new Set(bundle.entry.map(e => `${e.resource.resourceType}/${e.resource.id}`))
  const refs: string[] = []
  collectReferences(bundle, refs)
  return [...new Set(refs)].filter(r => !present.has(r))
}

const byType = (bundle: FhirBundle, t: string): FhirResource[] => bundle.entry.map(e => e.resource).filter(r => r.resourceType === t)

/** 1 DiagnosticReport por evento-resultado (sem duplicidade de id). */
export function reportIdsUnique(bundle: FhirBundle): boolean {
  const ids = byType(bundle, 'DiagnosticReport').map(r => r.id)
  return ids.length === new Set(ids).size
}

/** Nenhum acoplamento RNDS embutido no grafo. */
export function isRndsDecoupled(bundle: FhirBundle): boolean {
  return !JSON.stringify(bundle).toLowerCase().includes('rnds')
}

/** Coding honesto: nenhum `coding` com system sem code, nem code sem system (só pares reais). */
export function hasHonestCoding(bundle: FhirBundle): boolean {
  const codings: Record<string, unknown>[] = []
  const walk = (n: unknown): void => {
    if (!n || typeof n !== 'object') return
    if (Array.isArray(n)) { n.forEach(walk); return }
    const obj = n as Record<string, unknown>
    if (Array.isArray(obj.coding)) for (const c of obj.coding as Record<string, unknown>[]) codings.push(c)
    for (const v of Object.values(obj)) walk(v)
  }
  walk(bundle)
  return codings.every(c => typeof c.system === 'string' && !!c.system && typeof c.code === 'string' && !!c.code)
}

/** ServiceRequests que compartilham `requisition.value` (agrupamento do bilateral). */
export function requisitionGroups(bundle: FhirBundle): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const s of byType(bundle, 'ServiceRequest')) {
    const value = (s.requisition as { value?: string } | undefined)?.value
    if (!value) continue
    const arr = groups.get(value) ?? []; arr.push(s.id); groups.set(value, arr)
  }
  return groups
}

export interface StructuralReport {
  ok: boolean
  unresolved: string[]
  reportIdsUnique: boolean
  rndsDecoupled: boolean
  honestCoding: boolean
}

/** Roda todos os invariantes estruturais. */
export function validateStructural(bundle: FhirBundle): StructuralReport {
  const unresolved = unresolvedReferences(bundle)
  const r: StructuralReport = {
    unresolved,
    reportIdsUnique: reportIdsUnique(bundle),
    rndsDecoupled: isRndsDecoupled(bundle),
    honestCoding: hasHonestCoding(bundle),
    ok: false,
  }
  r.ok = unresolved.length === 0 && r.reportIdsUnique && r.rndsDecoupled && r.honestCoding
  return r
}
