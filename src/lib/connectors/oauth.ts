// WEA-001 / HIP-001 — V2 Épico 2.1: contrato OAuth (VENDOR-NEUTRAL).
// O núcleo/rotas falam só com `OAuthProvider`; a implementação (mock agora, Withings depois) é substituível.
// Segredos (client_id/secret) vivem na implementação (env), nunca aqui. Tokens de usuário nunca são logados.

/** Conjunto de tokens resultante de uma autorização/refresh. `expiresAt` em ISO (instante de expiração do acesso). */
export interface TokenSet {
  accessToken: string
  refreshToken: string
  expiresAt: string
  scope: string | null
  /**
   * Id do usuário NA FONTE (capacidade GENÉRICA, não específica de fornecedor): provedores cujo webhook chega
   * chaveado pelo id interno deles (ex.: Withings `userid`) usam isto para resolver o usuário da plataforma.
   * Opcional — provedores que não precisam disso deixam ausente/nulo.
   */
  externalUserId?: string | null
}

/** Provedor OAuth de UMA fonte. Fronteira onde o mock troca pelo real sem afetar rotas/UI/persistência. */
export interface OAuthProvider {
  /** Id estável da fonte (casa com o descriptor do Connector). */
  readonly source: string
  /** URL de autorização do provedor (o usuário é redirecionado para lá). `state` protege contra CSRF. */
  getAuthorizeUrl(state: string, redirectUri: string): string
  /** Troca o `code` do callback por tokens. */
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>
  /** Renova o acesso a partir do refresh token. */
  refresh(refreshToken: string): Promise<TokenSet>
}

/**
 * Decide se um token de acesso já expirou, com margem de segurança (skew) — PURO/determinístico.
 * `expiresAt` nulo => trata como expirado (força refresh). Instante inválido => expirado (seguro).
 */
export function isTokenExpired(expiresAt: string | null, nowISO: string, skewSeconds = 60): boolean {
  if (!expiresAt) return true
  const exp = new Date(expiresAt).getTime()
  const now = new Date(nowISO).getTime()
  if (Number.isNaN(exp) || Number.isNaN(now)) return true
  return exp - skewSeconds * 1000 <= now
}
