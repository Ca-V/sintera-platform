// Rota ÚNICA de Medidas corporais — Web (cookie) e Mobile (Bearer) pelo mesmo
// caminho (getAuthedSupabase). Lógica em @/lib/medidas/service (body_metrics ∩ MEASURES).
//   GET    /api/medidas         → { measures, exams } (medidas + laudos p/ vínculo)
//   POST   /api/medidas         → cria em lote { rows: MeasureInput[] } (1 no manual, N no scan)
//   DELETE /api/medidas?id=<id> → remove
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedSupabase } from '@/lib/supabase/authedClient'
import {
  listMeasures,
  listExamRefs,
  createMeasures,
  removeMeasure,
  MeasureValidationError,
  type Metric,
  type MeasureInput,
} from '@/lib/medidas/service'

function parseInput(raw: unknown): MeasureInput {
  const b = (raw ?? {}) as Record<string, unknown>
  return {
    metric: (typeof b.metric === 'string' ? b.metric : 'outro') as Metric,
    value: typeof b.value === 'string' ? b.value : '',
    unit: typeof b.unit === 'string' ? b.unit : null,
    label: typeof b.label === 'string' ? b.label : null,
    measuredOn: typeof b.measuredOn === 'string' ? b.measuredOn : '',
    notes: typeof b.notes === 'string' ? b.notes : null,
    examId: typeof b.examId === 'string' ? b.examId : null,
  }
}

function fail(err: unknown): NextResponse {
  if (err instanceof MeasureValidationError) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }
  const message = err instanceof Error ? err.message : String(err)
  return NextResponse.json({ error: 'Falha ao processar a medida.', detail: message.slice(0, 300) }, { status: 500 })
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const [measures, exams] = await Promise.all([
      listMeasures(supabase, user.id),
      listExamRefs(supabase, user.id),
    ])
    return NextResponse.json({ measures, exams })
  } catch (err) {
    return fail(err)
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = (await request.json()) as { rows?: unknown }
    const rows = Array.isArray(body.rows) ? body.rows.map(parseInput) : []
    if (rows.length === 0) return NextResponse.json({ error: 'Nenhuma medida enviada.' }, { status: 400 })
    await createMeasures(supabase, user.id, rows)
    return NextResponse.json({ success: true, count: rows.length })
  } catch (err) {
    return fail(err)
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 })
  try {
    await removeMeasure(supabase, user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return fail(err)
  }
}
