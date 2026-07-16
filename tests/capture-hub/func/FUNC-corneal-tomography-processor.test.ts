import { describe, it, expect } from 'vitest'
import { runCornealTomography } from '@/lib/capture/clinical-processors/corneal-tomography'
import { processClinical } from '@/lib/capture/clinical-processing-engine'
import type { CertifiedCDU } from '@/lib/capture/identity-validator'

// FUNC — Modelo Clínico "corneal-tomography", DIRIGIDO POR GS-004. Extrai parâmetros tomográficos por olho
// a partir da CertifiedCDU (só o content.text). Organizado por MODELO (não fabricante); não interpreta
// (RDC 657). A fachada processClinical(cdu) identifica → seleciona o modelo → executa o processador.

const cdu = (text: string): CertifiedCDU => ({
  content: { format: 'text', text, pageCount: 1 },
  contractVersion: 'v1', index: 1, pages: [1], documentalModality: 'narrative',
  title: 'OCULUS Pentacam', discoveredUnits: 1, date: null, issuer: 'oculus',
  fingerprint: 'x', status: 'certified', confidence: 'high', issues: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structure: {} as any,
})

const CORNEAL_TEXT = [
  'OCULUS Pentacam - Belin/Ambrósio Enhanced Ectasia Display',
  'OD  K1 43,2 D   K2 44,1 D   Kmax 45,3 D   Thinnest 530 µm   BAD-D 1,25   Ele. Front 8   Ele. Back 15',
  'OE  K1 42,8 D   K2 43,6 D   Kmax 44,0 D   Thinnest 545 µm   BAD-D 0,98   Ele. Front 6   Ele. Back 11',
].join('\n')

describe('FUNC · runCornealTomography (GS-004)', () => {
  it('extrai K1/K2/Kmax/espessura mínima/BAD-D/elevações por olho (OD e OE)', () => {
    const r = runCornealTomography(cdu(CORNEAL_TEXT))
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
    const r = runCornealTomography(cdu(CORNEAL_TEXT))
    expect(r.extractedUnits).toBeGreaterThanOrEqual(12) // 6+ parâmetros × 2 olhos
    expect(r.output?.kind).not.toBe('structured')
    expect(r.clinicalModel).toBe('corneal-tomography')
  })

  it('vírgula decimal vira ponto (normalização de valor)', () => {
    const r = runCornealTomography(cdu('OD K1 43,2 D'))
    const params = r.output?.kind === 'parametric' ? r.output.parameters : []
    expect(params[0].value).toBe('43.2')
  })

  it('texto sem parâmetros reconhecíveis → document_only (output null; não inventa)', () => {
    const r = runCornealTomography(cdu('documento oftalmológico sem números reconhecíveis'))
    expect(r.output).toBeNull()
    expect(r.extractedUnits).toBe(0)
  })

  it('o artigo "os" NÃO é lido como olho esquerdo (OD/OS/OE são maiúsculos)', () => {
    const r = runCornealTomography(cdu('Os valores tomográficos médios: K1 43,2 D'))
    const params = r.output?.kind === 'parametric' ? r.output.parameters : []
    expect(params.find(p => p.name === 'K1')?.region).toBeUndefined() // não OE
  })

  it('é DETERMINÍSTICO', () => {
    const a = JSON.stringify(runCornealTomography(cdu(CORNEAL_TEXT)))
    const b = JSON.stringify(runCornealTomography(cdu(CORNEAL_TEXT)))
    expect(a).toBe(b)
  })
})

describe('FUNC · processClinical (fachada única do CPE)', () => {
  it('CDU de Pentacam → identifica corneal-tomography → executa o processador (parametric)', () => {
    const r = processClinical(cdu(CORNEAL_TEXT))
    expect(r.identity.clinicalModel).toBe('corneal-tomography')
    expect(r.result.clinicalModel).toBe('corneal-tomography')
    expect(r.result.output?.kind).toBe('parametric')
  })

  it('CDU de Galilei (outro fabricante) → MESMO modelo corneal-tomography', () => {
    const galilei = cdu('GALILEI G4 topografia de córnea Kmax 45,0 paquimetria 540 BAD-D 1,1 elevação')
    const r = processClinical(galilei)
    expect(r.identity.clinicalModel).toBe('corneal-tomography')
  })

  it('CDU sem identidade confiável → document_only (output null; não bloqueia)', () => {
    const r = processClinical(cdu('documento genérico sem sinais claros'))
    expect(r.result.output).toBeNull()
    expect(r.route.review).toBe('clinical')
  })
})
