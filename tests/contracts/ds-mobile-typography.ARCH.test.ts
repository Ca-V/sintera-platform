// ARCH — Contrato do ADAPTADOR TIPOGRÁFICO DS→React Native (mobile · Passo 3 · fundação).
// Garante que a tradução dos papéis do DS para o formato RN preserva a decisão (BRAND-002 v2.1) e trata
// corretamente as diferenças RN × Web: família por peso, lineHeight absoluto, letterSpacing em px, fontVariant.
import { describe, it, expect } from 'vitest'
import { typeRole } from '../../packages/design-system/src'
import {
  toRNTextStyle, resolveRNFontFamily, emToPx, fontVariantFromFeatures, rnNumeric,
} from '../../apps/mobile/src/design-system/typography'

describe('ARCH · DS→RN — família por peso (convenção expo-google-fonts)', () => {
  it('mapeia cada camada para a família RN correta', () => {
    expect(resolveRNFontFamily("'Fraunces', serif", 600)).toBe('Fraunces_600SemiBold')
    expect(resolveRNFontFamily("'Hanken Grotesk', sans-serif", 400)).toBe('HankenGrotesk_400Regular')
    expect(resolveRNFontFamily("'IBM Plex Mono', monospace", 500)).toBe('IBMPlexMono_500Medium')
  })
  it('família desconhecida degrada para System (nunca quebra)', () => {
    expect(resolveRNFontFamily('Comic Sans', 400)).toBe('System')
  })
})

describe('ARCH · DS→RN — conversões de unidade', () => {
  it('lineHeight vira ABSOLUTO em px (multiplicador × fontSize)', () => {
    const rn = toRNTextStyle(typeRole.body)
    expect(rn.lineHeight).toBe(Math.round(typeRole.body.lineHeight * typeRole.body.fontSize))
    // sanity: um multiplicador ~1.6 em ~15px dá ~24px (nunca o multiplicador cru).
    expect(rn.lineHeight).toBeGreaterThan(typeRole.body.fontSize)
  })
  it('letterSpacing em `em` vira px relativo ao fontSize; 0em some', () => {
    expect(emToPx('-0.012em', 15)).toBe(Math.round(-0.012 * 15 * 100) / 100)
    expect(emToPx('0em', 15)).toBe(0)
    // pageTitle usa tracking negativo → letterSpacing definido e negativo.
    const rn = toRNTextStyle(typeRole.pageTitle)
    expect(rn.letterSpacing).toBeLessThan(0)
    // body usa 0em → sem letterSpacing no descritor.
    expect(toRNTextStyle(typeRole.body).letterSpacing).toBeUndefined()
  })
  it('fontWeight numérico do DS vira string no RN', () => {
    expect(toRNTextStyle(typeRole.body).fontWeight).toBe('400')
    expect(toRNTextStyle(typeRole.cardTitle).fontWeight).toBe(String(typeRole.cardTitle.fontWeight))
  })
})

describe('ARCH · DS→RN — dados científicos (IBM Plex Mono) tabulares', () => {
  it('numeric.* usa IBM Plex Mono e fontVariant tabular + lining', () => {
    for (const level of ['primary', 'secondary', 'reference', 'large'] as const) {
      const rn = rnNumeric[level]
      expect(rn.fontFamily.startsWith('IBMPlexMono_')).toBe(true)
      expect(rn.fontVariant).toEqual(expect.arrayContaining(['tabular-nums', 'lining-nums']))
    }
  })
  it('fontVariantFromFeatures deriva de tnum/lnum; ausente → undefined', () => {
    expect(fontVariantFromFeatures("'tnum' 1, 'lnum' 1")).toEqual(['tabular-nums', 'lining-nums'])
    expect(fontVariantFromFeatures(undefined)).toBeUndefined()
  })
  it('texto comum (Hanken) NÃO recebe fontVariant tabular', () => {
    expect(toRNTextStyle(typeRole.body).fontVariant).toBeUndefined()
  })
})
