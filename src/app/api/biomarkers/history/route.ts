// Evolução de UM biomarcador ao longo dos exames — Web (cookie) e Mobile (Bearer).
// Expõe por HTTP a MESMA série que a página /dashboard/saude/[slug] monta client-side:
// lê a view canônica current_biomarkers e reusa o agrupamento do domínio
// (seriesForName/normalizeName) — não reimplementa tendência nem duplicação de unidade.
//   GET /api/biomarkers/history?name=<nome> → { series: BiomarkerSummary | null }
import { NextResponse } from 'next/server'
import { authed } from '@/lib/api/http'
import { ValidationError } from '@/lib/api/errors'
import { seriesForName, normalizeName, type BiomarkerRow } from '@/lib/biomarkers/grouping'

export const GET = authed(async ({ supabase, userId, request }) => {
  const name = new URL(request.url).searchParams.get('name')
  if (!name) throw new ValidationError('Parâmetro obrigatório: name.')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- view não tipada nos tipos gerados
  const { data } = await (supabase as any)
    .from('current_biomarkers')
    .select('id,name,value,unit,result_type,reference_min,reference_max,interpretation,catalog_id,exam_id,exams(exam_date,created_at)')
    .eq('user_id', userId)
    .eq('synthetic', false)

  const rows = (data ?? []) as BiomarkerRow[]
  const series = seriesForName(rows, normalizeName(name))
  return NextResponse.json({ series })
})
