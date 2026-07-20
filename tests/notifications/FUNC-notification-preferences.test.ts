// FUNC · NOTIF-001 — Preferências de notificação (domínio puro).
//
// Certifica o CONTRATO da infraestrutura única: resolução de canal por categoria, continuidade do
// comportamento atual sem preferência, Modelo Aberto (categoria desconhecida nunca quebra) e a
// semântica das 4 opções (e-mail · WhatsApp · ambos · nenhum).

import { describe, it, expect } from 'vitest'
import {
  resolveChannels,
  resolveChannelsForEvent,
  categoryForEventType,
  DEFAULT_CHANNEL,
  NOTIFICATION_CATEGORIES,
  MANDATORY_NOTIFICATIONS,
  recommendedChannels,
  type NotificationChannel,
} from '@/lib/notifications/preferences'

describe('NOTIF-001 · resolveChannels — 4 opções', () => {
  const cases: Array<[NotificationChannel, boolean, boolean]> = [
    ['email', true, false],
    ['whatsapp', false, true],
    ['both', true, true],
    ['none', false, false],
  ]
  it.each(cases)('%s → email=%s whatsapp=%s', (ch, email, whatsapp) => {
    expect(resolveChannels(ch)).toEqual({ email, whatsapp })
  })
})

describe('NOTIF-001 · categoria por tipo de evento (mapa aberto)', () => {
  it('FB-017: eventos agendados → domínio "agenda"; origem específica → seu domínio', () => {
    expect(categoryForEventType('consulta')).toBe('agenda')
    expect(categoryForEventType('retorno')).toBe('agenda')
    expect(categoryForEventType('cirurgia')).toBe('agenda')
    expect(categoryForEventType('omica')).toBe('agenda')
    expect(categoryForEventType('medicacao')).toBe('medicamento')
    expect(categoryForEventType('suplemento')).toBe('suplemento')
    expect(categoryForEventType('contracepcao')).toBe('ciclo')
  })

  it('tipo desconhecido/nulo cai em "outro" (nunca quebra — Modelo Aberto)', () => {
    expect(categoryForEventType('tipo-que-nao-existe-2050')).toBe('outro')
    expect(categoryForEventType(null)).toBe('outro')
    expect(categoryForEventType('')).toBe('outro')
  })

  it('é insensível a caixa/espaços', () => {
    expect(categoryForEventType('  EXAME ')).toBe('agenda')
  })
})

describe('NOTIF-001 · resolveChannelsForEvent — preferência manda; sem ela, comportamento atual', () => {
  it('SEM preferência e SEM opt-in legado → e-mail apenas (default, não regride)', () => {
    const r = resolveChannelsForEvent({ prefsByCategory: new Map(), eventType: 'exame', legacyWhatsAppOptIn: false })
    expect(r).toEqual({ email: true, whatsapp: false, channel: DEFAULT_CHANNEL })
  })

  it('SEM preferência e COM opt-in legado de WhatsApp → ambos (continuidade)', () => {
    const r = resolveChannelsForEvent({ prefsByCategory: new Map(), eventType: 'consulta', legacyWhatsAppOptIn: true })
    expect(r).toEqual({ email: true, whatsapp: true, channel: 'both' })
  })

  it('preferência explícita da categoria SOBREPÕE o opt-in legado', () => {
    const prefs = new Map<string, NotificationChannel>([['agenda', 'none']])   // exame → domínio 'agenda'
    const r = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'exame', legacyWhatsAppOptIn: true })
    expect(r).toEqual({ email: false, whatsapp: false, channel: 'none' })
  })

  it('preferência por categoria é isolada — outro domínio mantém o default', () => {
    const prefs = new Map<string, NotificationChannel>([['agenda', 'whatsapp']])
    const exame = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'exame', legacyWhatsAppOptIn: false })
    const med = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'medicacao', legacyWhatsAppOptIn: false })
    expect(exame.channel).toBe('whatsapp')          // agenda
    expect(med.channel).toBe(DEFAULT_CHANNEL)        // medicamento (outro domínio)
  })

  it('FB-017: lembrete vinculado a recurso usa a preferência de "recurso"', () => {
    const prefs = new Map<string, NotificationChannel>([['recurso', 'both']])
    const r = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'outro', links: [{ type: 'resource' }], legacyWhatsAppOptIn: false })
    expect(r.channel).toBe('both')
  })

  it('a categoria de um tipo desconhecido usa a preferência de "outro" quando definida', () => {
    const prefs = new Map<string, NotificationChannel>([['outro', 'both']])
    const r = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'coisa-nova', legacyWhatsAppOptIn: false })
    expect(r.channel).toBe('both')
  })
})

// FB-011 — enriquecimento da Central: prioridade (obrigatórias) + recomendados ("Restaurar recomendadas").
describe('NOTIF-001 · obrigatórias e recomendados (FB-011)', () => {
  it('recommendedChannels cobre TODAS as categorias com o canal default', () => {
    const rec = recommendedChannels()
    expect(Object.keys(rec).sort()).toEqual(NOTIFICATION_CATEGORIES.map(c => c.key).sort())
    for (const c of NOTIFICATION_CATEGORIES) expect(rec[c.key]).toBe(DEFAULT_CHANNEL)
  })

  it('obrigatórias incluem cadastro, senha e compartilhamento aceito (críticas)', () => {
    const keys = MANDATORY_NOTIFICATIONS.map(m => m.key)
    expect(keys).toContain('cadastro')
    expect(keys).toContain('senha')
    expect(keys).toContain('compartilhamento')
  })

  it('obrigatórias NÃO colidem com categorias configuráveis (não entram nas preferências)', () => {
    const catKeys = new Set(NOTIFICATION_CATEGORIES.map(c => c.key))
    for (const m of MANDATORY_NOTIFICATIONS) expect(catKeys.has(m.key)).toBe(false)
  })
})
