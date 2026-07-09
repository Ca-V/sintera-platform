// API ÚNICA de organização factual de biomarcadores (TEMA C · serviço de domínio).
// Nasce com seu primeiro consumidor real (o Relatório preparado). SSOT: Relatório,
// Dashboard, Timeline e a visão do médico consomem o MESMO objeto (`OrganizedBiomarkers`)
// — nenhuma tela reagrupa. Sem juízo clínico: categorias + faixa ARITMÉTICA.
//   GET /api/biomarkers/organized             → agrega toda a pessoa (scope=user)
//   GET /api/biomarkers/organized?examId=<id> → organiza um exame (scope=exam)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assembleOrganizedBiomarkers } from '@/lib/ai/insights/assembler'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = authData.user.id
  const examId = request.nextUrl.searchParams.get('examId') ?? undefined

  if (examId) {
    const { data: exam } = await supabase
      .from('exams')
      .select('id')
      .eq('id', examId)
      .eq('user_id', userId)
      .maybeSingle() as { data: { id: string } | null }
    if (!exam) {
      return NextResponse.json({ error: 'Exame não encontrado.' }, { status: 404 })
    }
  }

  try {
    const organized = await assembleOrganizedBiomarkers(supabase, { userId, examId })
    return NextResponse.json(organized)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Falha ao organizar os biomarcadores.', detail: msg.slice(0, 300) }, { status: 500 })
  }
}
