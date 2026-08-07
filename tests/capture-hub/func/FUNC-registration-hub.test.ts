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
  it('page/choice referenciam um destino de DOMÍNIO válido (a rota é mapeada na plataforma)', () => {
    const dests = new Set(['omics', 'medications', 'supplements', 'resources', 'resources-vision', 'consulta', 'conditions', 'body', 'habits', 'expenses'])
    for (const i of REGISTRATION_INTENTS) {
      if (i.mechanism.type === 'page') expect(dests.has(i.mechanism.destination)).toBe(true)
      if (i.mechanism.type === 'choice') expect(dests.has(i.mechanism.pageDestination)).toBe(true)
    }
  })
  it('todo grupo declarado tem ao menos um intent (nada vazio)', () => {
    for (const g of INTENT_GROUPS.map(x => x.group) as IntentGroup[]) {
      expect(intentsByGroup(g).length).toBeGreaterThan(0)
    }
  })
  it('nenhuma intenção é indisponível — toda opção conclui o registro (sem "em breve")', () => {
    for (const i of REGISTRATION_INTENTS) {
      expect((i as unknown as { available?: boolean }).available).toBeUndefined()
    }
  })
  it('pedido de exame NÃO é pré-classificado como resultado (Q1: pedido ≠ resultado)', () => {
    const pedido = REGISTRATION_INTENTS.find(i => i.key === 'pedido_exame')!
    expect(pedido.mechanism.type).toBe('capture')
    if (pedido.mechanism.type === 'capture') expect(pedido.mechanism.documentKind).toBeUndefined()
  })
  it('Óculos/Lentes vai para Recursos (correção visual) — sem artefato paralelo', () => {
    const oculos = REGISTRATION_INTENTS.find(i => i.key === 'oculos')!
    expect(oculos.mechanism.type).toBe('page')
    if (oculos.mechanism.type === 'page') expect(oculos.mechanism.destination).toBe('resources-vision')
  })
  it('destinos de registro apontam para o domínio correto (rota/?novo=1 é mapeada na plataforma)', () => {
    const expected: Record<string, string> = { condicao: 'conditions', medida: 'body', habito: 'habits', recurso: 'resources', oculos: 'resources-vision' }
    for (const [key, dest] of Object.entries(expected)) {
      const i = REGISTRATION_INTENTS.find(x => x.key === key)!
      expect(i.mechanism.type).toBe('page')
      if (i.mechanism.type === 'page') expect(i.mechanism.destination).toBe(dest)
    }
  })
})
