// FHIR-004 — Validação estrutural do Bundle projetado (pura). Não é validação de PERFIL (BR-Core/RNDS) —
// apenas invariantes internos: integridade de referências e unicidade do evento clínico.
import type { FhirBundle } from './projector'

/** Referências internas (`Type/id`) que NÃO resolvem para um recurso presente no Bundle. */
export function unresolvedReferences(bundle: FhirBundle): string[] {
  const present = new Set(bundle.entry.map(e => `${e.resource.resourceType}/${e.resource.id}`))
  const refs: string[] = []
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) { for (const x of v) walk(x); return }
    if (v && typeof v === 'object') {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (k === 'reference' && typeof val === 'string') refs.push(val)
        else walk(val)
      }
    }
  }
  walk(bundle.entry.map(e => e.resource))
  return refs.filter(r => !present.has(r))
}

/** true quando o Bundle tem exatamente UM DiagnosticReport (um evento clínico). */
export function hasSingleClinicalEvent(bundle: FhirBundle): boolean {
  return bundle.entry.filter(e => e.resource.resourceType === 'DiagnosticReport').length === 1
}

/** true quando o Bundle não embute nada específico da RNDS (desacoplamento). */
export function isRndsDecoupled(bundle: FhirBundle): boolean {
  return !JSON.stringify(bundle).toLowerCase().includes('rnds')
}
