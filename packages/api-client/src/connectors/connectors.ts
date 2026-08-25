// @sintera/api-client — HIP-001 · Conexões (dispositivos e serviços de saúde).
//
// PONTE ARQUITETURAL TRANSITÓRIA (ADR-020): reusa as rotas `/api/connectors` da Web — a MESMA e única regra de
// integração (OAuth, tokens, sincronização), em vez de duplicá-la no Mobile. Autentica por Bearer.
// Mesmo arranjo de `analyzeExam`. Alvo pós-Onda-1: camada compartilhada (Edge Function), eliminando o
// acoplamento à URL da Web.
//
// POR QUE ISTO EXISTE: Conexões só existia na Web. E é por ela que entram as integrações com wearables — a
// Fase 2 inteira depende deste caminho estar nas duas pontas.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ConnectorState } from '@sintera/core'
import { asError } from '../net/errors'

function base(webBaseUrl: string | undefined): string | null {
  return webBaseUrl ? webBaseUrl.replace(/\/+$/, '') : null
}

async function bearer(client: SupabaseClient): Promise<string | null> {
  const { data: { session } } = await client.auth.getSession()
  return session?.access_token ?? null
}

/** Fontes disponíveis + o estado de cada uma para esta pessoa. LANÇA em falha (convenção de leitura). */
export async function listConnectors(
  client: SupabaseClient, webBaseUrl: string | undefined,
): Promise<ConnectorState[]> {
  const url = base(webBaseUrl)
  if (!url) throw new Error('URL das conexões não configurada.')
  const token = await bearer(client)
  if (!token) throw new Error('Não autenticado')

  // Sem `cache: 'no-store'`: o fetch do React Native não conhece essa opção (o tipo do pacote é o do RN).
  // O estado da conexão muda no servidor, não no cliente — e a rota já responde sem cache.
  const res = await fetch(`${url}/api/connectors`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Não foi possível carregar as conexões (${res.status}).`)
  const data = await res.json() as { connectors?: ConnectorState[] }
  return data.connectors ?? []
}

/**
 * ENDEREÇO para ligar a fonte. O fluxo é OAuth e acontece no NAVEGADOR — o app abre o link, a pessoa autoriza
 * no site do fabricante, e volta. Não há como (nem deve haver) o app manipular a credencial dela.
 */
export function connectorConnectUrl(webBaseUrl: string | undefined, source: string): string | null {
  const url = base(webBaseUrl)
  return url ? `${url}/api/connectors/${encodeURIComponent(source)}/connect` : null
}

/** Sincroniza agora. NÃO lança. */
export async function syncConnector(
  client: SupabaseClient, webBaseUrl: string | undefined, source: string,
): Promise<{ error: Error | null }> {
  try {
    const url = base(webBaseUrl)
    if (!url) return { error: new Error('URL das conexões não configurada.') }
    const token = await bearer(client)
    if (!token) return { error: new Error('Não autenticado') }
    const res = await fetch(`${url}/api/connectors/${encodeURIComponent(source)}/sync`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return { error: new Error(`Não foi possível sincronizar (${res.status}).`) }
    return { error: null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Desliga a fonte. A pessoa é dona do acesso e pode revogá-lo a qualquer momento (CARE-001). NÃO lança. */
export async function disconnectConnector(
  client: SupabaseClient, webBaseUrl: string | undefined, source: string,
): Promise<{ error: Error | null }> {
  try {
    const url = base(webBaseUrl)
    if (!url) return { error: new Error('URL das conexões não configurada.') }
    const token = await bearer(client)
    if (!token) return { error: new Error('Não autenticado') }
    const res = await fetch(`${url}/api/connectors/${encodeURIComponent(source)}/disconnect`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return { error: new Error(`Não foi possível desconectar (${res.status}).`) }
    return { error: null }
  } catch (e) {
    return { error: asError(e) }
  }
}
