import { describe, it, expect } from 'vitest'
import { runPentacam } from '@/lib/capture/clinical-processors/pentacam'
import { runClinicalProcessing } from '@/lib/capture/clinical-processors'
import { identifyClinical } from '@/lib/capture/clinical-identity-registry'
import type { CertifiedCDU } from '@/lib/capture/identity-validator'

// FUNC — Pentacam Processor, DIRIGIDO POR GS-004. Extrai parâmetros tomográficos por olho a partir da
// CertifiedCDU (só o content.text). Não interpreta (RDC 657); transcreve os valores medidos.

const cdu = (text: string): CertifiedCDU => ({
  content: { format: 'text', text, pageCount: 1 },
  contractVersion: 'v1', index: 1, pages: [1], documentalModality: 'narrative',
  title: 'OCULUS Pentacam', discoveredUnits: 1, date: null, issuer: 'oculus',
  fingerprint: 'x', status: 'certified', confidence: 'high', issues: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structure: {} as any,
})

const PENTACAM_TEXT = [
  'OCULUS Pentacam - Belin/Ambrósio Enhanced Ectasia Display',
  'OD  K1 43,2 D   K2 44,1 D   Kmax 45,3 D   Thinnest 530 µm   BAD-D 1,25   Ele. Front 8   Ele. Back 15',
  'OE  K1 42,8 D   K2 43,6 D   Kmax 44,0 D   Thinnest 545 µm   BAD-D 0,98   Ele. Front 6   Ele. Back 11',
].join('\n')

describe('FUNC · runPentacam (GS-004)', () => {
  it('extrai K1/K2/Kmax/espessura mínima/BAD-D/elevações por olho (OD e OE)', () => {
    const r = runPentacam(cdu(PENTACAM_TEXT))
    expect(r.output?.kind).toBe('parametric')
    const params = r.output?.kind === 'parametric' ? r.output.parameters : []

    const od = params.filter(p => p.region === 'OD')
    const oe = params.filter(p => p.region === 'OE')
    expect(od.find(p => p.name === 'K1')?.value).toBe('43.2')
    expect(od.find(p => p.name === 'Kmax')?.value).toBe('45.3')
    expect(od.find(p => p.name === 'Espessura mínima')?.value).toBe('530')
    expect(od.find(p => p.name === 'BAD-D')?.value).toBe('1.25')
    expect(oe.find(p => p.name === 'K2')?.value).toBe('43.6')
    expect(oe.find(p => p.name === 'Elevação posterior')?.value).toBe('11')
  })

  it('conta as unidades extraídas (alimenta a Cobertura) e não são biomarcadores', () => {
    const r = runPentacam(cdu(PENTACAM_TEXT))
    expect(r.extractedUnits).toBeGreaterThanOrEqual(12) // 6+ parâmetros × 2 olhos
    expect(r.output?.kind).not.toBe('structured')
  })

  it('vírgula decimal vira ponto (normalização de valor)', () => {
    const r = runPentacam(cdu('OD K1 43,2 D'))
    const params = r.output?.kind === 'parametric' ? r.output.parameters : []
    expect(params[0].value).toBe('43.2')
  })

  it('texto sem parâmetros reconhecíveis → document_only (output null; não inventa)', () => {
    const r = runPentacam(cdu('documento oftalmológico sem números reconhecíveis'))
    expect(r.output).toBeNull()
    expect(r.extractedUnits).toBe(0)
  })

  it('é DETERMINÍSTICO', () => {
    const a = JSON.stringify(runPentacam(cdu(PENTACAM_TEXT)))
    const b = JSON.stringify(runPentacam(cdu(PENTACAM_TEXT)))
    expect(a).toBe(b)
  })

  it('integração: Identidade Clínica (Pentacam) → runClinicalProcessing → Pentacam Processor', () => {
    const identity = identifyClinical('OCULUS Pentacam K1 43,2 K2 44,1 Kmax 45 BAD-D 1,2 Pachymetry 540 Belin')
    const r = runClinicalProcessing(cdu(PENTACAM_TEXT), identity)
    expect(r.extractor).toBe('CorneaTomographyExtractor')
    expect(r.output?.kind).toBe('parametric')
  })

  it('runClinicalProcessing com identidade fraca → document_only', () => {
    const identity = identifyClinical('documento genérico')
    const r = runClinicalProcessing(cdu(PENTACAM_TEXT), identity)
    expect(r.output).toBeNull()
  })
})
