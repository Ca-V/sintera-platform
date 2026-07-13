import { describe, it, expect } from 'vitest'
import { repairByteSwappedText } from '@/lib/pdf/extractor'

// FUNC — reparo de texto UTF-16 byte-swapped na extração de PDF.
// Regressão do achado RI-001B: o exam_text do Hermes Pardini estava gravado com
// os bytes de cada unidade UTF-16 trocados ('C' 0x0043 -> '䌀' 0x4300), tornando o
// texto ilegível e quebrando a rastreabilidade (âncora da checagem de não-invenção).

// Gera o texto "byte-swapped" a partir de um texto normal (inverso do bug real).
function toByteSwapped(s: string): string {
  let out = ''
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp >= 0x20 && cp <= 0xff) out += String.fromCodePoint(((cp & 0xff) << 8) | (cp >> 8))
    else out += ch
  }
  return out
}

describe('FUNC · repairByteSwappedText', () => {
  it('recupera texto UTF-16 com bytes trocados (caso real Hermes Pardini)', () => {
    const original = 'CARINA SOARES DE PAIVA LEITE\nGLICOSE: NEGATIVO\nREACAO (PH): 5,5'
    const swapped = toByteSwapped(original)
    expect(swapped).not.toContain('CARINA')
    expect(swapped).toContain('䌀') // 'C' byte-swapped

    const { text, repaired } = repairByteSwappedText(swapped)
    expect(repaired).toBe(true)
    expect(text).toBe(original)
  })

  it('preserva acentos do português (á, ç, µ) após o reparo', () => {
    const original = 'REAÇÃO ÁCIDA · µg/dL'
    const { text, repaired } = repairByteSwappedText(toByteSwapped(original))
    expect(repaired).toBe(true)
    expect(text).toBe(original)
  })

  it('NÃO altera texto normal (não byte-swapped)', () => {
    const original = 'Hemograma completo — Glicose 92 mg/dL (70 a 99)'
    const { text, repaired } = repairByteSwappedText(original)
    expect(repaired).toBe(false)
    expect(text).toBe(original)
  })

  it('é seguro com string vazia', () => {
    expect(repairByteSwappedText('')).toEqual({ text: '', repaired: false })
  })
})
