// FUNC · HUB-001 — taxonomia do Hub de Registro (intenção antes do mecanismo). PURO.
import { describe, it, expect } from 'vitest'
import {
  REGISTRATION_INTENTS, INTENT_GROUPS, intentsByGroup, type IntentGroup,
} from '@/lib/capture/registrationHub'
// Catálogos em runtime (core) — o teste valida contra a MESMA fonte de que o tipo deriva,
// em vez de manter uma cópia da lista que silenciosamente envelhece.
import { DOCUMENT_KINDS, REGISTRATION_DESTINATIONS, captureDestinationFor } from '@sintera/core'

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
    const valid = new Set<string>(DOCUMENT_KINDS)
    for (const i of REGISTRATION_INTENTS) {
      if (i.mechanism.type === 'capture' && i.mechanism.documentKind) expect(valid.has(i.mechanism.documentKind)).toBe(true)
      if (i.mechanism.type === 'choice') expect(valid.has(i.mechanism.captureKind)).toBe(true)
    }
  })
  it('page/choice referenciam um destino de DOMÍNIO válido (a rota é mapeada na plataforma)', () => {
    const dests = new Set<string>(REGISTRATION_DESTINATIONS)
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
  it('Óculos/Lentes NÃO é categoria própria — trata-se como Recurso de Saúde (decisão de produto)', () => {
    // óculos/lentes vivem em Recursos de Saúde (tipo correcao_visual); não deve existir intent dedicado.
    expect(REGISTRATION_INTENTS.find(i => i.key === 'oculos')).toBeUndefined()
    expect(REGISTRATION_INTENTS.some(i => /óculos|oculos|lente/i.test(i.label))).toBe(false)
  })
  it('destinos de registro apontam para o domínio correto (rota/?novo=1 é mapeada na plataforma)', () => {
    const expected: Record<string, string> = { condicao: 'conditions', medida: 'body', habito: 'habits', recurso: 'resources' }
    for (const [key, dest] of Object.entries(expected)) {
      const i = REGISTRATION_INTENTS.find(x => x.key === key)!
      expect(i.mechanism.type).toBe('page')
      if (i.mechanism.type === 'page') expect(i.mechanism.destination).toBe(dest)
    }
  })
})

// HUB-001 — DESTINO POR TIPO DE DOCUMENTO.
// Defeito da homologação (25/08): no Mobile, "Receita médica" → "Ler receita e cadastrar medicamento" abria a
// tela de ADICIONAR EXAME. O Hub ignorava o `documentKind`. A causa era dono duplicado: a Web tinha o destino
// em cada processador; o Mobile não tinha mapa nenhum.
describe('HUB-001 · captureDestinationFor', () => {
  it('rótulo/receita de medicamento vai para Medicamentos — não para Exames', () => {
    expect(captureDestinationFor('medication_label')).toBe('medications')
  })
  it('receita de óculos vai para Recursos', () => {
    expect(captureDestinationFor('eyeglass_prescription')).toBe('resources-vision')
  })
  it('ômica vai para Ômicas', () => {
    expect(captureDestinationFor('omics')).toBe('omics')
  })
  it('exame e desconhecido NÃO têm destino próprio — seguem para a captura, que classifica', () => {
    expect(captureDestinationFor('exam')).toBeNull()
    expect(captureDestinationFor('other')).toBeNull()
    expect(captureDestinationFor('unknown')).toBeNull()
    expect(captureDestinationFor(undefined)).toBeNull()
  })
  it('todo destino declarado existe no catálogo de destinos', () => {
    for (const k of DOCUMENT_KINDS) {
      const d = captureDestinationFor(k)
      if (d) expect(REGISTRATION_DESTINATIONS).toContain(d)
    }
  })
  it('o caminho de CAPTURA de todo `choice` leva a um destino real', () => {
    // É o que falhou: o Hub do Mobile mandava o choice para ExamUpload sem olhar o captureKind.
    for (const i of REGISTRATION_INTENTS) {
      if (i.mechanism.type !== 'choice') continue
      const d = captureDestinationFor(i.mechanism.captureKind)
      expect(d, `intent "${i.key}" tem captureKind sem destino`).not.toBeNull()
    }
  })
})
