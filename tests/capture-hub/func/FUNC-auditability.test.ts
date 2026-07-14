import { describe, it, expect } from 'vitest'
import { representationFromProcessor, ENGINE_VERSION } from '@/lib/capture/ucda'
import { runCornealTomography } from '@/lib/capture/clinical-processors/corneal-tomography'
import type { CertifiedCDU } from '@/lib/capture/identity-validator'

// FUNC — AUDITABILIDADE (Certificação da Plataforma §4): para QUALQUER elemento representado deve ser possível
// responder de qual documento · página · trecho · versão do Engine · versão do processador · quando.

const cdu = (text: string, pages = [3]): CertifiedCDU => ({
  content: { format: 'text', text, pageCount: pages.length }, pages,
  contractVersion: 'v1', index: 1, documentalModality: 'narrative',
  title: 'OCULUS Pentacam', discoveredUnits: 1, date: null, issuer: 'oculus',
  fingerprint: 'x', status: 'certified', confidence: 'high', issues: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  structure: {} as any,
})

const TEXT = 'OD  K1 43,2 D   K2 44,1 D   Kmax 45,3 D   BAD-D 1,25'

describe('FUNC · Auditabilidade por elemento', () => {
  it('cada parâmetro carrega PÁGINA e TRECHO-fonte', () => {
    const r = runCornealTomography(cdu(TEXT, [3]))
    const params = r.output?.kind === 'parametric' ? r.output.parameters : []
    for (const p of params) {
      expect(p.page).toBe(3)                       // de qual página
      expect(p.excerpt).toContain('K1')            // de qual trecho (a linha lida)
    }
  })

  it('a representação UCDA carrega versão do ENGINE e do PROCESSADOR', () => {
    const r = runCornealTomography(cdu(TEXT))
    const ucda = representationFromProcessor(r)!
    expect(ucda.provenance.engineVersion).toBe(ENGINE_VERSION)  // por qual versão do Engine
    expect(ucda.provenance.processorVersion).toBe('v1')          // por qual versão do processador
    expect(ucda.items[0].page).toBe(3)
    expect(ucda.items[0].excerpt).toBeTruthy()
  })

  it('o ciclo de rastreabilidade fecha: documento(exam_id) + página + trecho + engine + processador + quando', () => {
    // documento = exam_id (persistência) · quando = created_at (persistência). Aqui: página+trecho+versões.
    const r = runCornealTomography(cdu(TEXT, [1]))
    const ucda = representationFromProcessor(r)!
    const it0 = ucda.items[0]
    expect({
      page: it0.page, hasExcerpt: !!it0.excerpt,
      engine: ucda.provenance.engineVersion, processor: ucda.provenance.processorVersion,
    }).toEqual({ page: 1, hasExcerpt: true, engine: ENGINE_VERSION, processor: 'v1' })
  })
})
