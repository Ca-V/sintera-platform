// @sintera/api-client — SÍNTESE de navegação (D-16 §5d): contagens por domínio para os INDICADORES de conteúdo
// do menu Minha Saúde (Mobile) / Sidebar (Web). São contadores OPCIONAIS e best-effort — ajudam a pessoa a
// perceber onde há conteúdo sem abrir cada tela. Puramente APRESENTAÇÃO: a camada de navegação só EXIBE o número;
// o dado vem daqui por injeção. Contagens via head+count (não trafega linhas). RLS por usuário garante o escopo.
import type { SupabaseClient } from '@supabase/supabase-js'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

/** Contagens exibíveis no menu Minha Saúde. Cada campo mapeia a uma linha de registro do domínio. */
export interface MinhaSaudeCounts {
  exams: number
  medications: number
  supplements: number
  resources: number
  conditions: number
  habits: number
}

/** Lê as contagens por domínio do usuário autenticado. LANÇA em falha operacional (convenção de leitura). */
export async function getMinhaSaudeCounts(client: SupabaseClient, signal?: AbortSignal): Promise<MinhaSaudeCounts> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const uid = session.user.id
    const head = (table: string) => client.from(table).select('id', { count: 'exact', head: true }).eq('user_id', uid)

    const [exams, meds, supps, resources, conditions, habits] = await Promise.all([
      head('exams').abortSignal(s),
      head('medications').eq('kind', 'medicamento').abortSignal(s),
      head('medications').eq('kind', 'suplemento').abortSignal(s),
      head('health_resources').abortSignal(s),
      head('health_conditions').abortSignal(s),
      head('life_habits').abortSignal(s),
    ])
    for (const r of [exams, meds, supps, resources, conditions, habits]) if (r.error) throw asError(r.error)

    return {
      exams: exams.count ?? 0,
      medications: meds.count ?? 0,
      supplements: supps.count ?? 0,
      resources: resources.count ?? 0,
      conditions: conditions.count ?? 0,
      habits: habits.count ?? 0,
    }
  } finally {
    cleanup()
  }
}
