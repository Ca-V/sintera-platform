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

// --- SEC-014 · Gate de rejeição por invariantes internas JÁ DEFINIDAS (aditivo; não altera validateStructural nem
// o projetor). NÃO valida perfis oficiais FHIR R4/BR-Core nem terminologias — isso permanece fora de escopo (gate
// próprio). Nenhum código/perfil/terminologia é inventado: apenas as invariantes que o projeto já declara. ---

/** Identificadores honestos ([NC]): todo `identifier` presente tem `system` e `value` não vazios (o projetor omite
 *  identificador oficial sem `system` — aqui a invariante é enforçada explicitamente na validação). */
export function hasHonestIdentifiers(bundle: FhirBundle): boolean {
  const ids: Record<string, unknown>[] = []
  const walk = (n: unknown): void => {
    if (!n || typeof n !== 'object') return
    if (Array.isArray(n)) { n.forEach(walk); return }
    const obj = n as Record<string, unknown>
    if (Array.isArray(obj.identifier)) for (const i of obj.identifier as Record<string, unknown>[]) ids.push(i)
    for (const v of Object.values(obj)) walk(v)
  }
  walk(bundle)
  return ids.every(i => typeof i.system === 'string' && !!i.system && typeof i.value === 'string' && !!i.value)
}

/** Lista de violações de invariantes internas (mensagens acionáveis). Vazio ⇒ bundle íntegro. */
export function invariantViolations(bundle: FhirBundle): string[] {
  const v: string[] = []
  const unresolved = unresolvedReferences(bundle)
  if (unresolved.length) v.push(`Referências não resolvidas: ${unresolved.join(', ')}`)
  if (!reportIdsUnique(bundle)) v.push('DiagnosticReport com id duplicado.')
  if (!isRndsDecoupled(bundle)) v.push('Acoplamento RNDS presente no grafo (deve permanecer desacoplado).')
  if (!hasHonestCoding(bundle)) v.push('Coding desonesto: há coding sem par system+code.')
  if (!hasHonestIdentifiers(bundle)) v.push('Identifier desonesto: há identifier sem system+value.')
  return v
}

export interface InvariantResult { ok: boolean; violations: string[] }

/** Gate de aceitação/rejeição por invariantes internas. `ok:false` ⇒ payload deve ser REJEITADO (não emitido). */
export function validateInvariants(bundle: FhirBundle): InvariantResult {
  const violations = invariantViolations(bundle)
  return { ok: violations.length === 0, violations }
}

/** Erro de enforcement: bundle canônico viola invariantes internas e NÃO deve ser emitido/consumido. */
export class CanonicalInvariantError extends Error {
  readonly violations: string[]
  constructor(violations: string[]) {
    super(`Bundle canônico inválido (invariantes internas): ${violations.join(' · ')}`)
    this.name = 'CanonicalInvariantError'
    this.violations = violations
  }
}

/** Fronteira de emissão: retorna o bundle se íntegro; **lança** `CanonicalInvariantError` se violar invariantes.
 *  Use antes de qualquer consumo/emissão do bundle (o adaptador RNDS, quando existir, deve passar por aqui). */
export function assertCanonicalValid(bundle: FhirBundle): FhirBundle {
  const { ok, violations } = validateInvariants(bundle)
  if (!ok) throw new CanonicalInvariantError(violations)
  return bundle
}
