// FUNC · Normalização do emissor/laboratório (EXA-F003) — robustez da identificação do card.
// TRANSCREVE o nome; descarta "sem dado" e rótulo "Emissor:" ecoado, MAS preserva nomes que
// legitimamente começam com "Laboratório/Clínica/Hospital".

import { describe, it, expect } from 'vitest'
import { normalizeIssuer, extractIssuerFromImage, isOrderCodeArtifact } from '@/lib/ai/issuer'

describe('normalizeIssuer (EXA-F003)', () => {
  it('mantém o nome transcrito, aparando aspas/pontuação', () => {
    expect(normalizeIssuer('Fleury')).toBe('Fleury')
    expect(normalizeIssuer('"Hermes Pardini."')).toBe('Hermes Pardini')
  })

  it('PRESERVA nomes que começam com Laboratório/Clínica/Hospital (não são rótulo)', () => {
    expect(normalizeIssuer('Laboratório Sabin')).toBe('Laboratório Sabin')
    expect(normalizeIssuer('Clínica Axial')).toBe('Clínica Axial')
    expect(normalizeIssuer('Hospital Albert Einstein')).toBe('Hospital Albert Einstein')
  })

  it('remove só rótulos seguros ecoados ("Emissor:"/"Emitido por:")', () => {
    expect(normalizeIssuer('Emissor: Fleury')).toBe('Fleury')
    expect(normalizeIssuer('Emitido por - DASA')).toBe('DASA')
  })

  it('respostas de "sem dado" viram null', () => {
    for (const v of ['null', 'N/A', 'não informado', 'não consta', 'nenhum', '—']) {
      expect(normalizeIssuer(v)).toBeNull()
    }
  })

  it('vazio/verboso → null', () => {
    expect(normalizeIssuer('')).toBeNull()
    expect(normalizeIssuer(null)).toBeNull()
    expect(normalizeIssuer('x'.repeat(81))).toBeNull()
  })

  it('extractIssuerFromImage (multimodal) é best-effort: sem API key → null, não lança', async () => {
    const prev = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    await expect(extractIssuerFromImage(Buffer.from('x'), 'image/jpeg')).resolves.toBeNull()
    if (prev) process.env.ANTHROPIC_API_KEY = prev
  })
})

// Obs 11 — guarda determinística: identificador de pedido não pode virar nome de laboratório.
describe('Obs 11 · isOrderCodeArtifact', () => {
  const textoUrina = 'HERMES PARDINI ... Pedido 5003524-SAVA ... CLORETOS RESULTADO 48'

  it('(1) "SAVA" vindo de "5003524-SAVA" é artefato → rejeitado', () => {
    expect(isOrderCodeArtifact('SAVA', 'Pedido 5003524-SAVA')).toBe(true)
  })

  it('(2) emissor explicitamente presente ("Axial") é preservado', () => {
    expect(isOrderCodeArtifact('Axial', 'Laudo AXIAL Inteligência Diagnóstica ...')).toBe(false)
    expect(isOrderCodeArtifact('Axial Inteligência Diagnóstica', 'emitido por Axial Inteligência Diagnóstica')).toBe(false)
  })

  it('(3) evidência insuficiente (candidato só existe colado a código) → ausente', () => {
    expect(isOrderCodeArtifact('X1', 'Requisição 99999-X1 concluída')).toBe(true)
  })

  it('(4) NÃO transforma emissor legítimo em null sem motivo (Hermes Pardini limpo no texto)', () => {
    expect(isOrderCodeArtifact('Hermes Pardini', 'Laboratório Hermes Pardini — resultado')).toBe(false)
    // conservador: candidato ausente do texto (nome de logo/multimodal) NÃO é rejeitado
    expect(isOrderCodeArtifact('Fleury', 'texto sem esse nome')).toBe(false)
    // sem texto / candidato curto → não rejeita
    expect(isOrderCodeArtifact('DASA', '')).toBe(false)
  })

  it('no caso real: "SAVA" é rejeitado e "HERMES PARDINI" preservado no MESMO texto', () => {
    expect(isOrderCodeArtifact('SAVA', textoUrina)).toBe(true)
    expect(isOrderCodeArtifact('HERMES PARDINI', textoUrina)).toBe(false)
  })
})
