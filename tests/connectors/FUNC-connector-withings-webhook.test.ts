// FUNC · HIP-002 — webhook do Withings: RECEPTOR (parse do form Notify + resolução do usuário pelo id na fonte) e
// REGISTRO (subscribe/revoke via /notify). Puro: WebhookContext e WithingsClient são fakes; nenhuma rede.
import { describe, it, expect } from 'vitest'
import type { WithingsClient } from '@/lib/connectors/withings/client'
import { createWithingsWebhookHandler, createWithingsWebhookSubscriber } from '@/lib/connectors/withings/webhook'

function req(body: string): Request {
  return new Request('http://app.local/api/connectors/withings/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
}

describe('Withings webhook · RECEPTOR (resolveUser)', () => {
  it('form com userid → resolve o usuário via external_user_id', async () => {
    const handler = createWithingsWebhookHandler()
    const seen: Array<[string, string]> = []
    const ctx = { async resolveUserByExternalId(p: string, e: string) { seen.push([p, e]); return e === '12345' ? 'user-abc' : null } }
    const userId = await handler.resolveUser(req('userid=12345&appli=1&startdate=1&enddate=2'), ctx)
    expect(userId).toBe('user-abc')
    expect(seen).toEqual([['withings', '12345']]) // resolve pelo provider + userid do Withings
  })

  it('sem userid (ping de validação) → null (a rota responde 200)', async () => {
    const handler = createWithingsWebhookHandler()
    const ctx = { async resolveUserByExternalId() { return 'nunca' } }
    expect(await handler.resolveUser(req('appli=1'), ctx)).toBeNull()
  })

  it('userid desconhecido → null', async () => {
    const handler = createWithingsWebhookHandler()
    const ctx = { async resolveUserByExternalId() { return null } }
    expect(await handler.resolveUser(req('userid=999'), ctx)).toBeNull()
  })
})

describe('Withings webhook · REGISTRO (subscribe/revoke)', () => {
  function fakeClient(): { client: WithingsClient; calls: Array<{ path: string; form: Record<string, string>; bearer?: string }> } {
    const calls: Array<{ path: string; form: Record<string, string>; bearer?: string }> = []
    const client: WithingsClient = { async call(path, form, bearer) { calls.push({ path, form, bearer }); return {} } }
    return { client, calls }
  }

  it('subscribe → /notify action=subscribe com callbackurl + appli=1 + token', async () => {
    const { client, calls } = fakeClient()
    await createWithingsWebhookSubscriber({ client }).subscribe('acc-tok', 'https://app.prod/api/connectors/withings/webhook')
    expect(calls[0].path).toBe('/notify')
    expect(calls[0].bearer).toBe('acc-tok')
    expect(calls[0].form).toMatchObject({ action: 'subscribe', callbackurl: 'https://app.prod/api/connectors/withings/webhook', appli: '1' })
  })

  it('revoke → /notify action=revoke com callbackurl + appli', async () => {
    const { client, calls } = fakeClient()
    await createWithingsWebhookSubscriber({ client }).revoke('acc-tok', 'https://app.prod/api/connectors/withings/webhook')
    expect(calls[0].form).toMatchObject({ action: 'revoke', callbackurl: 'https://app.prod/api/connectors/withings/webhook', appli: '1' })
  })
})
