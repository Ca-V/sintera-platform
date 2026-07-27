// @sintera/api-client — leitura do Perfil (domínio). Recebe o cliente Supabase (interno ao pacote).
// Contrato RATIFICADO (MOBILE-019 §2): devolve ProfileDTO se existe · null se a linha não existe ·
// LANÇA em falha operacional (rede/timeout/DB/auth). NUNCA usa null para representar erro.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { PROFILE_COLUMNS, type ProfileDTO } from './types'

function asError(e: unknown): Error {
  return e instanceof Error ? e : new Error(typeof e === 'string' ? e : 'Erro desconhecido')
}

/** Projeta a linha do banco no DTO central (só os campos do contrato; ignora quaisquer extras). */
function toProfileDTO(row: Record<string, unknown>): ProfileDTO {
  return {
    id: row.id as string,
    name: (row.name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    age_range: (row.age_range as string | null) ?? null,
    goals: (row.goals as string[] | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
  }
}

export async function getProfile(client: SupabaseClient, signal?: AbortSignal): Promise<ProfileDTO | null> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')

    const { data, error } = await client
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', session.user.id)
      .abortSignal(s)          // abortSignal vive no filter builder; maybeSingle() é o terminal (deve vir depois)
      .maybeSingle()

    if (error) throw asError(error)          // falha operacional → LANÇA
    return data ? toProfileDTO(data as Record<string, unknown>) : null // sem linha → null (vazio legítimo)
  } finally {
    cleanup()
  }
}
