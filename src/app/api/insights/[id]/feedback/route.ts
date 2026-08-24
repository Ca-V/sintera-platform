// Registra o feedback da usuária sobre um insight (útil / não útil).
// Grava em insight_feedback (migração 022), 1 por (insight, usuária) via upsert.
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
// SEC-006 · validação de schema de entrada (helper puro compartilhado). Comportamento preservado.
import { readJsonObject, requireEnum, badRequest } from '@/lib/api/validate'

const VALID_RATINGS = new Set(['util', 'nao_util'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: insightId } = await params
  // Client genérico: insight_feedback não está nos tipos manuais (ver supabase/types.generated.ts)
  const supabase = (await createClient()) as unknown as SupabaseClient

  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = authData.user.id

  const parsed = await readJsonObject(request, 'Corpo inválido.')
  if (!parsed.ok) return badRequest(parsed.error)
  const ratingV = requireEnum(parsed.value, 'rating', VALID_RATINGS, "rating deve ser 'util' ou 'nao_util'.")
  if (!ratingV.ok) return badRequest(ratingV.error)
  const rating = ratingV.value

  // O insight pertence à usuária? (RLS já restringe; confirmamos + pegamos template_key)
  const { data: insight } = await supabase
    .from('ai_insights')
    .select('id, template_key')
    .eq('id', insightId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!insight) {
    return NextResponse.json({ error: 'Insight não encontrado.' }, { status: 404 })
  }

  const templateKey = (insight as { template_key: string | null }).template_key ?? ''

  const { error } = await supabase
    .from('insight_feedback')
    .upsert(
      { insight_id: insightId, template_key: templateKey, user_id: userId, rating },
      { onConflict: 'insight_id,user_id' },
    )

  if (error) {
    return NextResponse.json({ error: 'Falha ao registrar feedback.', detail: error.message.slice(0, 200) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
