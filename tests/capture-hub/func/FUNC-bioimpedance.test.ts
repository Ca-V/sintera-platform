// FUNC · FB-003 — processador de Bioimpedância (exame → parâmetros de composição corporal). PURO.
import { describe, it, expect } from 'vitest'
import { runBioimpedance } from '@/lib/capture/clinical-processors/bioimpedance'
import type { CertifiedCDU } from '@/lib/capture/clinical-processors/types'

// CDU mínima (o processador só lê content.text + pages).
const cdu = (text: string): CertifiedCDU => ({
  content: { text } as never,
  pages: [1],
} as never)

describe('FB-003 · runBioimpedance', () => {
  it('extrai os parâmetros de um laudo típico de bioimpedância', () => {
    const r = runBioimpedance(cdu(
      `Laudo de Bioimpedância\n` +
      `Peso: 72,4 kg\n` +
      `IMC: 25,7\n` +
      `Percentual de gordura: 24,1 %\n` +
      `Massa muscular esquelética: 30,2 kg\n` +
      `Massa magra: 54,8 kg\n` +
      `Água corporal total: 55,3 %\n` +
      `Gordura visceral: 8\n` +
      `Metabolismo basal: 1480 kcal\n`,
    ))
    expect(r.clinicalModel).toBe('bioimpedance')
    expect(r.output?.kind).toBe('parametric')
    const by = Object.fromEntries((r.output?.kind === 'parametric' ? r.output.parameters : []).map(p => [p.name, p.value]))
    expect(by['Peso']).toBe('72.4')
    expect(by['IMC']).toBe('25.7')
    expect(by['Percentual de gordura']).toBe('24.1')
    expect(by['Massa muscular']).toBe('30.2')
    expect(by['Massa magra']).toBe('54.8')
    expect(by['Gordura visceral']).toBe('8')
    expect(by['Metabolismo basal']).toBe('1480')
    expect(r.extractedUnits).toBeGreaterThanOrEqual(7)
  })

  it('texto sem parâmetros → document_only (não inventa)', () => {
    const r = runBioimpedance(cdu('Relatório sem números reconhecíveis de composição corporal.'))
    expect(r.output).toBeNull()
    expect(r.extractedUnits).toBe(0)
  })
})
