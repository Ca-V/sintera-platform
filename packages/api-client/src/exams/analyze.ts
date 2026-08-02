// @sintera/api-client — dispara a EXTRAÇÃO/análise do exame (domínio Exames · escrita, pós-createExam).
// PONTE ARQUITETURAL TRANSITÓRIA (ADR-020, fundadora 2026-07-31): reusa a rota `/analyze` da Web — a MESMA e
// ÚNICA regra de negócio de extração (gateway de IA), evitando duplicação. Autentica por Bearer (a rota aceita
// Cookie e Bearer via camada compartilhada `getAuthedSupabase`). Alvo pós-Onda-1 = camada de processamento
// compartilhada (Edge Function), eliminando o acoplamento à URL da Web (backlog R-010).
// Convenção de escrita: retorna `{ error }` — NUNCA lança.
import type { SupabaseClient } from '@supabase/supabase-js'
import { asError } from '../net/errors'

export async function analyzeExam(
  client: SupabaseClient,
  webBaseUrl: string | undefined,
  id: string,
): Promise<{ error: Error | null }> {
  try {
    if (!webBaseUrl) return { error: new Error('URL da análise não configurada.') }
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const res = await fetch(`${webBaseUrl.replace(/\/+$/, '')}/api/exams/${id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) return { error: new Error(`Análise falhou (${res.status}).`) }
    return { error: null }
  } catch (e) {
    return { error: asError(e) }
  }
}
