// INT · SEC-014 — enforcement de invariantes no FLUXO COMPLETO: CanonicalSource(fake) → loadCanonicalModel →
// projeção → validação → gate de rejeição. Prova que o runner reprova (approved=false) um grafo com invariante
// violada e que a fronteira de emissão (assertCanonicalValid) LANÇA. Dados 100% sintéticos; sem DB/rede/RNDS.
import { describe, it, expect } from 'vitest'
import { createFakeSource } from '@/lib/fhir/canonical/source'
import { runCanonicalPreview } from '@/lib/fhir/canonical/preview'
import { projectCanonicalToFhir, type CanonProjectionInput } from '@/lib/fhir/canonical/projector'
import { assertCanonicalValid, CanonicalInvariantError } from '@/lib/fhir/canonical/validate'

const scope = { userId: 'u1' }

// Grafo íntegro: observação referencia um documento presente.
const valido: CanonProjectionInput = {
  resultEvents: [{ examId: 'ex1', code: 'Doppler venoso MI' }],
  documents: [{ id: 'd1', examId: 'ex1', fileUrl: 'synthetic://x.pdf', role: 'laudo_final', uploadedAt: '2026-08-01T10:00:00Z' }],
  observations: [{ id: 'o1', examId: 'ex1', examDocumentId: 'd1', name: 'Fluxo' }],
}

// Grafo inválido: observação aponta a um documento inexistente → derivedFrom órfão (referência não resolvida).
const invalido: CanonProjectionInput = {
  resultEvents: [{ examId: 'ex1' }],
  observations: [{ id: 'o1', examId: 'ex1', examDocumentId: 'ghost', name: 'Fluxo' }],
}

describe('INT · SEC-014 — enforcement no fluxo completo', () => {
  it('grafo íntegro → runner aprova (estrutural + invariantes) e a fronteira de emissão aceita', async () => {
    const report = await runCanonicalPreview(createFakeSource(valido), scope)
    expect(report.structural.ok).toBe(true)
    expect(report.invariants.ok).toBe(true)
    expect(report.invariants.violations).toEqual([])
    expect(report.approved).toBe(true)
    // fronteira de emissão aceita e retorna o bundle
    const bundle = projectCanonicalToFhir(valido)
    expect(assertCanonicalValid(bundle)).toBe(bundle)
  })

  it('grafo com referência órfã → runner REPROVA (approved=false) com violação registrada', async () => {
    const report = await runCanonicalPreview(createFakeSource(invalido), scope)
    expect(report.invariants.ok).toBe(false)
    expect(report.invariants.violations.some(v => v.includes('não resolvidas'))).toBe(true)
    expect(report.approved).toBe(false)   // enforcement: não aprova grafo inválido
  })

  it('fronteira de emissão LANÇA CanonicalInvariantError no grafo inválido (não emite)', () => {
    const bundle = projectCanonicalToFhir(invalido)
    expect(() => assertCanonicalValid(bundle)).toThrow(CanonicalInvariantError)
  })
})
