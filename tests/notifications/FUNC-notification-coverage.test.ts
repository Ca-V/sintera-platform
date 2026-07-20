// FUNC · NOTIF-001 — cobertura: todo tipo de evento agendável resolve a uma categoria de
// notificação (nenhum item agendável fica sem canal). Trava a integração: os event_types REAIS
// usados pelos módulos (EVENT_TYPE_DEFS + os projetados por Medicamentos/Ciclo) mapeiam para as
// categorias configuráveis; nenhum cai fora do modelo (Modelo Aberto: desconhecido → 'outro').

import { describe, it, expect } from 'vitest'
import { EVENT_TYPE_DEFS, EVENT_TYPE_LABELS } from '@/lib/agenda/presentation'
import { categoryForEventType, categoryForEvent, NOTIFICATION_CATEGORIES } from '@/lib/notifications/preferences'

const CATEGORY_KEYS = new Set(NOTIFICATION_CATEGORIES.map(c => c.key))

describe('NOTIF-001 · cobertura de categorias', () => {
  it('todo tipo do seletor de eventos resolve a uma categoria conhecida', () => {
    for (const def of EVENT_TYPE_DEFS) {
      expect(CATEGORY_KEYS.has(categoryForEventType(def.id)), `${def.id} → ${categoryForEventType(def.id)}`).toBe(true)
    }
  })

  it('tipos projetados por outros módulos também resolvem (medicação/atividade/ômica/cirurgia/retorno)', () => {
    // 'medicacao' = Medicamentos/Ciclo (recompra/contracepção); demais = subtipos renderizáveis.
    const projected = ['medicacao', 'atividade', 'omica', 'cirurgia', 'retorno', 'suplemento', 'protocolo', 'estetico']
    for (const t of projected) {
      expect(CATEGORY_KEYS.has(categoryForEventType(t)), `${t} → ${categoryForEventType(t)}`).toBe(true)
    }
  })

  it('todos os rótulos internos de tipo (EVENT_TYPE_LABELS) resolvem a categoria (nenhum órfão)', () => {
    for (const key of Object.keys(EVENT_TYPE_LABELS)) {
      expect(CATEGORY_KEYS.has(categoryForEventType(key)), `${key} → ${categoryForEventType(key)}`).toBe(true)
    }
  })
})

describe('FB-017 · categorias = domínios da Sidebar (roteamento por domínio de origem)', () => {
  it('eventos agendados (qualquer tipo) → "agenda"', () => {
    for (const t of ['consulta', 'exame', 'procedimento', 'vacina', 'retorno', 'cirurgia', 'plano', 'outro']) {
      expect(categoryForEventType(t)).toBe('agenda')
    }
  })
  it('origem específica → seu domínio', () => {
    expect(categoryForEventType('medicacao')).toBe('medicamento')
    expect(categoryForEventType('suplemento')).toBe('suplemento')
    expect(categoryForEventType('contracepcao')).toBe('ciclo')
  })
  it('lembrete vinculado a RECURSO → "recurso" (mesmo tipo genérico "outro")', () => {
    expect(categoryForEvent({ type: 'outro', links: [{ type: 'resource' }] })).toBe('recurso')
    expect(categoryForEvent({ type: 'outro', links: [] })).toBe('agenda')
    expect(categoryForEvent({ type: 'medicacao', links: null })).toBe('medicamento')
  })
  it('toda categoria pertence a uma seção da Sidebar', () => {
    for (const c of NOTIFICATION_CATEGORIES) expect(['Acompanhamento', 'Minha Saúde']).toContain(c.section)
  })
})
