// HIP-002 — webhook do Withings (ISOLADO). Traduz o modelo Notify do Withings para as capacidades genéricas do núcleo:
// - RECEPTOR: o Withings faz POST form-urlencoded (userid, appli, startdate, enddate), SEM nosso userId nem segredo;
//   resolvemos o usuário da plataforma pelo `userid` do Withings (external_user_id).
// - REGISTRO: assinatura/revogação via /notify (subscribe/revoke) com callbackurl + appli.
// Toda particularidade do Withings vive aqui; a rota e o núcleo permanecem vendor-neutral.

import type { WebhookHandler, WebhookSubscriber } from '../webhook'
import { createWithingsClient, type WithingsClient, type FetchLike, type Sleep } from './client'
import { WITHINGS_SOURCE, WITHINGS_APPLI_MEASURES } from './config'

/** RECEPTOR: parseia o form do Notify e resolve o usuário via id na fonte. */
export function createWithingsWebhookHandler(): WebhookHandler {
  return {
    source: WITHINGS_SOURCE,
    async resolveUser(req, ctx) {
      let raw: string
      try { raw = await req.text() } catch { return null }
      const form = new URLSearchParams(raw)
      const externalUserId = form.get('userid')
      if (!externalUserId) return null // ping de validação / payload sem usuário → ignora (rota responde 200)
      return ctx.resolveUserByExternalId(WITHINGS_SOURCE, externalUserId)
    },
  }
}

export interface WithingsSubscriberDeps {
  client?: WithingsClient
  fetchImpl?: FetchLike
  sleep?: Sleep
}

/** REGISTRO: assina/revoga a notificação de MEDIDAS (appli=1) no Withings. */
export function createWithingsWebhookSubscriber(deps: WithingsSubscriberDeps = {}): WebhookSubscriber {
  const client = deps.client ?? createWithingsClient({ fetchImpl: deps.fetchImpl, sleep: deps.sleep })
  const appli = String(WITHINGS_APPLI_MEASURES)
  return {
    source: WITHINGS_SOURCE,
    async subscribe(accessToken, callbackUrl) {
      await client.call('/notify', { action: 'subscribe', callbackurl: callbackUrl, appli, comment: 'SINTERA' }, accessToken)
    },
    async revoke(accessToken, callbackUrl) {
      await client.call('/notify', { action: 'revoke', callbackurl: callbackUrl, appli }, accessToken)
    },
  }
}
