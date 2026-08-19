// Fase C — RUNNER de preview (orquestração PURA): fonte → loadCanonicalModel → projeta → valida → sumariza.
// NÃO conhece Supabase/DB: recebe uma CanonicalSource injetada. Com a fonte FAKE, roda sobre dados sintéticos.
// O uso com uma fonte de DADOS REAIS é GATE MATERIAL (preview) — este módulo não fornece adaptador real.
import type { CanonicalSource, CanonScope } from './source'
import { loadCanonicalModel } from './source'
import { projectCanonicalToFhir } from './projector'
import { validateStructural, requisitionGroups } from './validate'

export interface PreviewReport {
  scope: CanonScope
  counts: Record<string, number>          // recursos por tipo
  requisitionGroups: number               // nº de agrupamentos (bilateral)
  structural: ReturnType<typeof validateStructural>
  approved: boolean                        // critério objetivo: grafo estrutural OK
}

/** Executa a projeção+validação sobre a fonte dada. Puro além do IO da fonte injetada. */
export async function runCanonicalPreview(source: CanonicalSource, scope: CanonScope): Promise<PreviewReport> {
  const input = await loadCanonicalModel(source, scope)
  const bundle = projectCanonicalToFhir(input)
  const counts: Record<string, number> = {}
  for (const e of bundle.entry) counts[e.resource.resourceType] = (counts[e.resource.resourceType] ?? 0) + 1
  const structural = validateStructural(bundle)
  return {
    scope,
    counts,
    requisitionGroups: requisitionGroups(bundle).size,
    structural,
    approved: structural.ok,               // aprovação estrutural (Nível B); NÃO é evidência de dados reais (C) nem RNDS (D)
  }
}
