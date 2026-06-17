// Gera insights de DEMONSTRAÇÃO factual para os exames da usuária logada.
// NÃO-CLÍNICO: ver src/lib/ai/insights/demo-factual.ts. Marca synthetic=true;
// a página só exibe estes insights em modo demonstração (?demo=1).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFactualDemoInsights } from '@/lib/ai/insights/demo-factual'

export async function POST() {
  const supabase = await createClient()

  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = authData.user.id

  // Exames da própria usuária (RLS confirma); limita para segurança.
  const { data: exams, error } = await supabase
    .from('exams')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(25) as { data: { id: string }[] | null; error: unknown }

  if (error) {
    return NextResponse.json({ error: 'Falha ao listar exames.' }, { status: 500 })
  }

  let generated = 0
  for (const e of exams ?? []) {
    try {
      const r = await generateFactualDemoInsights(supabase, { examId: e.id, userId })
      generated += r.generated
    } catch (err) {
      console.error('[demo-factual] exame', e.id, err)
    }
  }

  return NextResponse.json({ generated, exams: (exams ?? []).length })
}
