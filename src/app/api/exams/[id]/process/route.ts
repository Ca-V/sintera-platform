import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'
import {
  detectExamType,
  buildBiomarkers,
  calcScores,
  buildInsights,
} from '@/lib/exam-processor'

/**
 * POST /api/exams/[id]/process
 *
 * Server-side fallback for exam processing.
 * The primary pipeline now runs client-side (see exams/page.tsx) to avoid
 * the auth issue caused by proxy.ts excluding /api routes from its matcher,
 * which prevents the Supabase session from being refreshed for server-side
 * requests and causes getUser() to return null.
 *
 * This endpoint is kept for:
 *   - GET /api/exams/process-pending (reprocessing stuck exams)
 *   - Future server-side OCR integrations
 *   - Admin tooling
 *
 * NOTE: Requires a valid Supabase session cookie in the request.
 * When called server-to-server (e.g., from process-pending), auth will fail.
 * For that use case, use a service-role key instead.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: examId } = await params

  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.getUser()

  if (authErr || !authData.user) {
    return NextResponse.json(
      { error: 'Não autorizado. Sessão não encontrada nos cookies do request.' },
      { status: 401 },
    )
  }

  const user = authData.user

  type ExamRow = Database['public']['Tables']['exams']['Row']
  const { data: examRaw, error: examErr } = await supabase
    .from('exams').select('*').eq('id', examId).eq('user_id', user.id).single()
  const exam = examRaw as ExamRow | null

  if (examErr || !exam) {
    return NextResponse.json({ error: 'Exame não encontrado' }, { status: 404 })
  }
  if (exam.status === 'processed') {
    return NextResponse.json({ message: 'Já processado' })
  }

  await supabase.from('exams')
    .update({ status: 'processing' } as unknown as never)
    .eq('id', examId)

  try {
    const examType   = detectExamType(exam.type ?? '')
    const biomarkers = buildBiomarkers(examType, examId)

    const bmRows = biomarkers.map(b => ({
      exam_id: examId, user_id: user.id,
      name: b.name, value: b.value, unit: b.unit,
      reference_min: b.reference_min, reference_max: b.reference_max,
      interpretation: b.interpretation, ai_insight: b.ai_insight,
    }))
    const { error: bmErr } = await supabase.from('biomarkers').insert(bmRows as unknown as never)
    if (bmErr) throw new Error(`Biomarcadores: ${bmErr.message}`)

    const scores = calcScores(biomarkers)
    const { error: scoreErr } = await supabase
      .from('biological_scores').insert({ user_id: user.id, ...scores } as unknown as never)
    if (scoreErr) throw new Error(`Score: ${scoreErr.message}`)

    const insights = buildInsights(biomarkers, user.id)
    const { error: insightErr } = await supabase
      .from('ai_insights').insert(insights as unknown as never)
    if (insightErr) throw new Error(`Insights: ${insightErr.message}`)

    await supabase.from('exams')
      .update({ status: 'processed' } as unknown as never)
      .eq('id', examId)

    return NextResponse.json({ success: true, biomarkers: biomarkers.length, scores })
  } catch (err: unknown) {
    console.error('[Sintera] exam processing error:', err)
    await supabase.from('exams')
      .update({ status: 'error' } as unknown as never)
      .eq('id', examId)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro no processamento' },
      { status: 500 },
    )
  }
}
