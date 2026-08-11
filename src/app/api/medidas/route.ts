// Rota ÚNICA de Medidas corporais — Web (cookie) e Mobile (Bearer). Auth/erro pela
// fundação (@/lib/api/http · authed); lógica em @/lib/medidas/service (body_metrics ∩ MEASURES).
//   GET → { measures, exams } · POST { rows: MeasureInput[] } (1 manual, N no scan) · DELETE ?id=
import { NextResponse } from 'next/server'
import { authed, requiredId, BadRequestError } from '@/lib/api/http'
import {
  listMeasures,
  listExamRefs,
  createMeasures,
  removeMeasure,
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

export const GET = authed(async ({ supabase, userId }) => {
  const [measures, exams] = await Promise.all([
    listMeasures(supabase, userId),
    listExamRefs(supabase, userId),
  ])
  return NextResponse.json({ measures, exams })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  const body = (await request.json()) as { rows?: unknown }
  const rows = Array.isArray(body.rows) ? body.rows.map(parseInput) : []
  if (rows.length === 0) throw new BadRequestError('Nenhuma medida enviada.')
  await createMeasures(supabase, userId, rows)
  return NextResponse.json({ success: true, count: rows.length })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await removeMeasure(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
