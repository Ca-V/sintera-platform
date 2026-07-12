// ARCH-003 — Canonicalização de material/exame (Evolução e detalhe).
// Regra de domínio (fundadora 12/07): funde variantes do laudo em rótulos canônicos;
// Urina e Urina 24h SEPARADAS (coletas diferentes); ordena materiais de forma estável.
// Suite RÁPIDA (sem IA).

import { describe, it, expect } from 'vitest'
import {
  canonicalMaterial,
  canonicalExamName,
  materialRank,
  MATERIAL_FALLBACK_ORDER,
} from '@/lib/biomarkers/canonicalLabels'

describe('ARCH-003 · canonicalMaterial funde variantes', () => {
  it('sangue e "exame de sangue" → mesma chave "sangue"', () => {
    expect(canonicalMaterial('SANGUE').key).toBe('sangue')
    expect(canonicalMaterial('Exame de sangue').key).toBe('sangue')
    expect(canonicalMaterial('Soro').key).toBe('sangue')
    expect(canonicalMaterial('SANGUE').label).toBe('Sangue')
  })

  it('urina simples → "urina" (coleta única)', () => {
    expect(canonicalMaterial('URINA').key).toBe('urina')
    expect(canonicalMaterial('Exame de urina').key).toBe('urina')
    expect(canonicalMaterial('Urina rotina').key).toBe('urina')
    expect(canonicalMaterial('EAS').key).toBe('urina')
    expect(canonicalMaterial('URINA').label).toBe('Urina')
  })

  it('urina 24h → "urina_24h", SEPARADA de urina (regra da fundadora)', () => {
    expect(canonicalMaterial('URINA 24 HORAS').key).toBe('urina_24h')
    expect(canonicalMaterial('Exame de urina 24 horas').key).toBe('urina_24h')
    expect(canonicalMaterial('Urina de 24 horas').key).toBe('urina_24h')
    expect(canonicalMaterial('Urina 24h').label).toBe('Urina 24h')
    // NUNCA a mesma chave da urina simples
    expect(canonicalMaterial('Urina 24 horas').key).not.toBe(canonicalMaterial('Urina rotina').key)
  })

  it('desconhecido → chave prefixada + rótulo sentence-case', () => {
    const g = canonicalMaterial('GASOMETRIA VENOSA')
    expect(g.key.startsWith('x:')).toBe(true)
    expect(g.label).toBe('Gasometria venosa')
  })
})

describe('ARCH-003 · canonicalExamName funde variantes de nome de exame', () => {
  it('"exame de urina 24 horas" e "urina de 24 horas" → mesma chave', () => {
    const a = canonicalExamName('EXAME DE URINA 24 HORAS')
    const b = canonicalExamName('Urina de 24 horas')
    expect(a?.key).toBe(b?.key)
  })
  it('rótulo em caixa-alta do laudo vira sentence-case', () => {
    expect(canonicalExamName('URINA ROTINA')?.label).toBe('Urina rotina')
  })
  it('ausente → null', () => {
    expect(canonicalExamName(null)).toBeNull()
    expect(canonicalExamName('   ')).toBeNull()
  })
})

describe('ARCH-003 · materialRank ordena de forma estável', () => {
  it('ordem do catálogo primeiro; sangue antes de urina antes de urina_24h', () => {
    const catalog = ['sangue', 'urina', 'urina_24h'] // specimenOrder
    expect(materialRank('sangue', catalog)).toBeLessThan(materialRank('urina', catalog))
    expect(materialRank('urina', catalog)).toBeLessThan(materialRank('urina_24h', catalog))
  })
  it('sem catálogo, usa a ordem-fallback conhecida', () => {
    expect(materialRank('sangue', [])).toBeLessThan(materialRank('urina', []))
    expect(materialRank('urina', [])).toBeLessThan(materialRank('urina_24h', []))
    expect(MATERIAL_FALLBACK_ORDER.indexOf('urina')).toBeLessThan(MATERIAL_FALLBACK_ORDER.indexOf('urina_24h'))
  })
  it('desconhecido vai por último', () => {
    expect(materialRank('x:gasometria venosa', ['sangue'])).toBe(999)
  })
})
