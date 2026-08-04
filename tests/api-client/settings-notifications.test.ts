// @sintera/core — taxonomia de notificações (NOTIF-001) + @sintera/api-client — preferências (canal por categoria).
import { describe, it, expect } from 'vitest'
import { NOTIFICATION_CATEGORIES, DEFAULT_CHANNEL, categoryForEvent, recommendedChannels } from '../../packages/core/src/domain/notificationPrefs'
import { listNotificationPrefs, saveNotificationPrefs } from '../../packages/api-client/src/settings/notifications'
import { mockSupabase, mockQueryBuilder, fakeSession } from './supabaseMock'

describe('core · notification prefs (NOTIF-001)', () => {
  it('categoria por evento: vínculo prevalece sobre tipo', () => {
    expect(categoryForEvent({ type: 'outro', links: [{ type: 'resource' }] })).toBe('recurso')
    expect(categoryForEvent({ type: 'outro', links: [{ type: 'habit' }] })).toBe('habito')
    expect(categoryForEvent({ type: 'contracepcao' })).toBe('ciclo')
    expect(categoryForEvent({ type: 'consulta' })).toBe('agenda')
  })
  it('recomendadas = default para todas as categorias', () => {
    const rec = recommendedChannels()
    expect(Object.keys(rec).length).toBe(NOTIFICATION_CATEGORIES.length)
    expect(rec.agenda).toBe(DEFAULT_CHANNEL)
  })
})

describe('api-client · settings.notifications', () => {
  it('listNotificationPrefs filtra por dono', async () => {
    const builder = mockQueryBuilder({ data: [{ category: 'agenda', channel: 'whatsapp' }], error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const rows = await listNotificationPrefs(client)
    expect(rows).toEqual([{ category: 'agenda', channel: 'whatsapp' }])
    expect((builder as unknown as { __calls: Record<string, unknown[]> }).__calls.eq).toEqual(['user_id', 'u1'])
  })
  it('saveNotificationPrefs faz upsert das linhas com user_id', async () => {
    const builder = mockQueryBuilder({ data: null, error: null })
    const client = mockSupabase({ session: fakeSession('u1'), from: () => builder })
    const { error } = await saveNotificationPrefs(client, [{ category: 'agenda', channel: 'both' }])
    expect(error).toBeNull()
    const rows = (builder as unknown as { __calls: Record<string, unknown[]> }).__calls.upsert?.[0] as Array<Record<string, unknown>>
    expect(rows[0]).toMatchObject({ user_id: 'u1', category: 'agenda', channel: 'both' })
  })
})
