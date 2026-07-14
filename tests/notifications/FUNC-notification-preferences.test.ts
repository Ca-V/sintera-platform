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
  it('mapeia tipos conhecidos para a categoria que o usuário reconhece', () => {
    expect(categoryForEventType('consulta')).toBe('consulta')
    expect(categoryForEventType('retorno')).toBe('consulta')
    expect(categoryForEventType('cirurgia')).toBe('procedimento')
    expect(categoryForEventType('omica')).toBe('exame')
    expect(categoryForEventType('medicacao')).toBe('medicamento')
    expect(categoryForEventType('atividade')).toBe('avaliacao')
  })

  it('tipo desconhecido/nulo cai em "outro" (nunca quebra — Modelo Aberto)', () => {
    expect(categoryForEventType('tipo-que-nao-existe-2050')).toBe('outro')
    expect(categoryForEventType(null)).toBe('outro')
    expect(categoryForEventType('')).toBe('outro')
  })

  it('é insensível a caixa/espaços', () => {
    expect(categoryForEventType('  EXAME ')).toBe('exame')
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
    const prefs = new Map<string, NotificationChannel>([['exame', 'none']])
    const r = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'exame', legacyWhatsAppOptIn: true })
    expect(r).toEqual({ email: false, whatsapp: false, channel: 'none' })
  })

  it('preferência por categoria é isolada — outra categoria mantém o default', () => {
    const prefs = new Map<string, NotificationChannel>([['exame', 'whatsapp']])
    const exame = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'exame', legacyWhatsAppOptIn: false })
    const vacina = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'vacina', legacyWhatsAppOptIn: false })
    expect(exame.channel).toBe('whatsapp')
    expect(vacina.channel).toBe(DEFAULT_CHANNEL)
  })

  it('a categoria de um tipo desconhecido usa a preferência de "outro" quando definida', () => {
    const prefs = new Map<string, NotificationChannel>([['outro', 'both']])
    const r = resolveChannelsForEvent({ prefsByCategory: prefs, eventType: 'coisa-nova', legacyWhatsAppOptIn: false })
    expect(r.channel).toBe('both')
  })
})
