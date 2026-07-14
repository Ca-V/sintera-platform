import { describe, it, expect } from 'vitest'
import { planRepresentation } from '@/lib/capture/clinical-processing-engine'
import type { CertifiedCDU } from '@/lib/capture/identity-validator'

// FUNC — planRepresentation: o ÚNICO lugar que conhece modalidade (delegação do analyze ao Engine).
// Comportamento EQUIVALENTE ao legado do analyze (Convergência Progressiva): só a DECISÃO mudou de lugar.

const cdu = (text: string): CertifiedCDU => ({
  content: { format: 'text', text, pageCount: 1 },
  contractVersion: 'v1', index: 1, pages: [1], documentalModality: 'results',
  title: 'X', discoveredUnits: 1, date: null, issuer: null,
  fingerprint: 'x', status: 'certified', confidence: 'high', issues: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structure: {} as any,
})

describe('FUNC · planRepresentation (equivalência ao legado)', () => {
  it("imaging → NÃO estruturado (document_only) — equivalente a isNarrativeLaudo", () => {
    const p = planRepresentation(cdu('laudo'), { documentType: 'imaging', examCount: 0, biomarkerCount: 0 })
    expect(p.structured).toBe(false)
    expect(p.documentOnly).toBe(true)
    expect(p.extractorVersion).toBe('heuristic-v0')
    expect(p.family).toBe('imaging')
  })

  it("laboratory com biomarcadores → estruturado + laboratory-v1 + estrutura confiável", () => {
    const p = planRepresentation(cdu('MATERIAL - SANGUE RESULTADO: 85'), { documentType: 'laboratory', examCount: 0, biomarkerCount: 12 })
    expect(p.structured).toBe(true)
    expect(p.extractorVersion).toBe('laboratory-v1')
    expect(p.structureConfident).toBe(true)
  })

  it("laboratory SEM exames e SEM biomarcadores → estrutura NÃO confiável (não nomeia)", () => {
    const p = planRepresentation(cdu('texto'), { documentType: 'laboratory', examCount: 0, biomarkerCount: 0 })
    expect(p.structureConfident).toBe(false)
  })

  it("categoria não-laboratorial e não-imagem (ex.: pedido) → estruturado + heuristic-v0 + confiável", () => {
    const p = planRepresentation(cdu('solicitação'), { documentType: 'medical_order', examCount: 0, biomarkerCount: 0 })
    expect(p.structured).toBe(true)
    expect(p.extractorVersion).toBe('heuristic-v0')
    expect(p.structureConfident).toBe(true)
  })

  it("CDU com identidade especializada (Pentacam) → specialized=true (processador do CPE)", () => {
    const p = planRepresentation(
      cdu('OCULUS Pentacam K1 43,2 K2 44,1 Kmax 45 BAD-D 1,2 Pachymetry 540 Belin'),
      { documentType: 'imaging', examCount: 0, biomarkerCount: 0 },
    )
    expect(p.specialized).toBe(true)
    expect(p.model?.id).toBe('corneal-tomography')
  })

  it('é DETERMINÍSTICO', () => {
    const c = cdu('MATERIAL - SANGUE RESULTADO: 85 mg/dL')
    const ctx = { documentType: 'laboratory', examCount: 1, biomarkerCount: 5 }
    expect(JSON.stringify(planRepresentation(c, ctx))).toBe(JSON.stringify(planRepresentation(c, ctx)))
  })
})
