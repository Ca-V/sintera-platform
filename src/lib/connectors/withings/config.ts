// HIP-002 — Adaptador Withings (ISOLADO). Constantes e configuração do fornecedor. Particularidades do Withings
// vivem SÓ aqui e nos demais arquivos desta pasta; o núcleo da SINTERA (registry/oauth/connections/sync) permanece
// vendor-neutral (HIP-001). Segredos NUNCA neste arquivo — chegam por env em runtime.server.ts.

export const WITHINGS_SOURCE = 'withings'
export const WITHINGS_LABEL = 'Withings'
export const WITHINGS_VERSION = 'withings-v1'

// Endpoints oficiais (developer.withings.com).
export const WITHINGS_ACCOUNT_BASE = 'https://account.withings.com'
export const WITHINGS_API_BASE = 'https://wbsapi.withings.net'

// Escopo mínimo (least privilege): medidas corporais/sinais. Composição Corporal só precisa disto (D1).
export const WITHINGS_SCOPE = 'user.metrics'

// Categoria de notificação do Notify que assinamos: 1 = novas MEDIDAS (peso/composição). (D1 — só Composição.)
export const WITHINGS_APPLI_MEASURES = 1

/** Segredos/config do app Withings (client_id/secret vêm do ambiente; redirect opcional para fixar o whitelisted). */
export interface WithingsConfig {
  clientId: string
  clientSecret: string
  /** Redirect fixo (whitelistado no portal). Se ausente, as rotas derivam do host da requisição. */
  redirectUri?: string
}
