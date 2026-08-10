// @sintera/api-client — ESTATÍSTICAS do Perfil (domínio). Recebe o cliente Supabase (interno ao pacote).
// Fonte ÚNICA das contagens exibidas no Perfil (Web + Mobile): total de exames, biomarcadores REAIS
// (synthetic=false) e a data de criação da conta (auth). Convenção de leitura: LANÇA em falha operacional.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'
import type { ProfileStats } from './types'

export async function getProfileStats(client: SupabaseClient, signal?: AbortSignal): Promise<ProfileStats> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const uid = session.user.id

    // Contagens via head+count (não trafega linhas). RLS por usuário garante o escopo.
    const [examsRes, bioRes] = await Promise.all([
      client.from('exams').select('id', { count: 'exact', head: true }).eq('user_id', uid).abortSignal(s),
      client.from('current_biomarkers').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('synthetic', false).abortSignal(s),
    ])
    if (examsRes.error) throw asError(examsRes.error)
    if (bioRes.error) throw asError(bioRes.error)

    return {
      totalExams: examsRes.count ?? 0,
      totalBiomarkers: bioRes.count ?? 0,
      memberSince: (session.user.created_at as string | null) ?? null,
    }
  } finally {
    cleanup()
  }
}
