// Gatilho de geração de insights rule-based de um exame.
// DESACOPLADO da extração (analyze/route.ts) — chamar não altera o pipeline
// de extração em produção. Enquanto o RuleSet/biblioteca clínicos estão vazios,
// retorna { generated: 0 } sem gravar nada (comportamento seguro e intencional).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRuleBasedInsights } from '@/lib/ai/insights/orchestrator'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: examId } = await params
  const supabase = await createClient()

  // 1. Auth
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = authData.user.id

  // 2. Ownership (RLS já restringe; confirmamos para erro 404 claro)
  const { data: exam } = await supabase
    .from('exams')
    .select('id')
    .eq('id', examId)
    .eq('user_id', userId)
    .maybeSingle() as { data: { id: string } | null }

  if (!exam) {
    return NextResponse.json({ error: 'Exame não encontrado.' }, { status: 404 })
  }

  // 3. Gera (roda vazio até aprovação clínica)
  try {
    const result = await generateRuleBasedInsights(supabase, { examId, userId })
    return NextResponse.json({
      success: true,
      generated: result.upserted,
      rulesActive: result.rulesActive,
      candidates: result.candidates,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Falha ao gerar insights.', detail: msg.slice(0, 300) }, { status: 500 })
  }
}
