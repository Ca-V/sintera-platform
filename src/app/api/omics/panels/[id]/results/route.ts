// GET /api/omics/panels/:id/results?category_id=&limit=&offset=
// Resultados de um painel, opcionalmente por categoria (lazy-loading / paginado).
// Nível 3 da visualização. Apenas dados objetivos — sem interpretação.
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth, pageParams } from '@/lib/omics/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase, userId } = await omicsAuth()
  if (error) return error
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('category_id')
  const { limit, offset } = pageParams(url, 100, 1000)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any).from('omics_results')
    .select('id, feature_id, feature_name, category_id, value, unit, raw_value, detection_status, method, measured_on')
    .eq('panel_id', id).eq('user_id', userId)
  if (categoryId === 'none') q = q.is('category_id', null)
  else if (categoryId) q = q.eq('category_id', categoryId)
  const { data, error: e } = await q
    .order('feature_name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ results: data ?? [], limit, offset })
}
