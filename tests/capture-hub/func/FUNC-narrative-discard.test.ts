// FUNC · NC-0008 — Descarte de laudo narrativo preservando o modelo canônico.
// Um laudo narrativo (document_only) descarta os resultados raspados SEM violar append-only:
// de-promove o ponteiro corrente (view fica vazia) e só deleta linhas no caminho legado.

import { describe, it, expect } from 'vitest'
import { planNarrativeDiscard } from '@/lib/exams/narrativeDiscard'

describe('planNarrativeDiscard (NC-0008)', () => {
  it('documento estruturável → não descarta (nenhuma ação)', () => {
    for (const useCanonical of [true, false]) {
      const p = planNarrativeDiscard({ structured: true, biomarkerCount: 12, useCanonical })
      expect(p).toEqual({ discard: false, depromotePointer: false, deleteLegacyRows: false })
    }
  })

  it('narrativo SEM resultados raspados → nada a descartar', () => {
    const p = planNarrativeDiscard({ structured: false, biomarkerCount: 0, useCanonical: true })
    expect(p.discard).toBe(false)
    expect(p.depromotePointer).toBe(false)
    expect(p.deleteLegacyRows).toBe(false)
  })

  it('narrativo com resultados na rota APPEND-ONLY (canônica) → de-promove, NUNCA deleta', () => {
    const p = planNarrativeDiscard({ structured: false, biomarkerCount: 5, useCanonical: true })
    expect(p.discard).toBe(true)
    expect(p.depromotePointer).toBe(true)   // view current_biomarkers fica vazia (document_only)
    expect(p.deleteLegacyRows).toBe(false)  // append-only: histórico versionado é imutável
  })

  it('narrativo com resultados na rota LEGADA → de-promove E deleta as linhas descartadas', () => {
    const p = planNarrativeDiscard({ structured: false, biomarkerCount: 5, useCanonical: false })
    expect(p.discard).toBe(true)
    expect(p.depromotePointer).toBe(true)
    expect(p.deleteLegacyRows).toBe(true)   // caminho não-append-only (delete+replace por design)
  })
})
