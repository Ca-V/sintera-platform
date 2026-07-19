// FUNC · HUB-001 — taxonomia do Hub de Registro (intenção antes do mecanismo). PURO.
import { describe, it, expect } from 'vitest'
import {
  REGISTRATION_INTENTS, INTENT_GROUPS, intentsByGroup, type IntentGroup,
} from '@/lib/capture/registrationHub'

describe('HUB-001 · taxonomia', () => {
  it('todo intent pertence a um grupo declarado', () => {
    const groups = new Set(INTENT_GROUPS.map(g => g.group))
    for (const i of REGISTRATION_INTENTS) expect(groups.has(i.group)).toBe(true)
  })
  it('chaves únicas', () => {
    const keys = REGISTRATION_INTENTS.map(i => i.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('mecanismo capture referencia DocumentKind válido quando presente', () => {
    const valid = new Set(['exam', 'medication_label', 'eyeglass_prescription', 'omics', 'other', 'unknown'])
    for (const i of REGISTRATION_INTENTS) {
      if (i.mechanism.type === 'capture' && i.mechanism.documentKind) expect(valid.has(i.mechanism.documentKind)).toBe(true)
      if (i.mechanism.type === 'choice') expect(valid.has(i.mechanism.captureKind)).toBe(true)
    }
  })
  it('page/choice apontam para rota de dashboard', () => {
    for (const i of REGISTRATION_INTENTS) {
      if (i.mechanism.type === 'page') expect(i.mechanism.href.startsWith('/dashboard/')).toBe(true)
      if (i.mechanism.type === 'choice') expect(i.mechanism.pageHref.startsWith('/dashboard/')).toBe(true)
    }
  })
  it('intentsByGroup ordena disponíveis antes de "em breve"', () => {
    for (const g of INTENT_GROUPS.map(x => x.group) as IntentGroup[]) {
      const list = intentsByGroup(g)
      const firstUnavailable = list.findIndex(i => !i.available)
      if (firstUnavailable === -1) continue
      // nenhum "disponível" depois do primeiro "em breve"
      expect(list.slice(firstUnavailable).every(i => !i.available)).toBe(true)
    }
  })
  it('os três grupos têm ao menos um intent disponível', () => {
    for (const g of INTENT_GROUPS.map(x => x.group) as IntentGroup[]) {
      expect(intentsByGroup(g).some(i => i.available)).toBe(true)
    }
  })
})
