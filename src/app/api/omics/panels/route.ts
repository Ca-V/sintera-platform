// GET /api/omics/panels — lista painéis ômicos da usuária (paginado, por domínio).
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth, pageParams, validDomain } from '@/lib/omics/server'

export async function GET(req: NextRequest) {
  const { error, supabase, userId } = await omicsAuth()
  if (error) return error
  const url = new URL(req.url)
  const domain = validDomain(url.searchParams.get('domain'))
  const { limit, offset } = pageParams(url)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any).from('omics_panels')
    .select('id, exam_id, domain, technology, platform, total_features, laboratory, collected_on, created_at')
    .eq('user_id', userId)
  if (domain) q = q.eq('domain', domain)
  const { data, error: e } = await q
    .order('collected_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ panels: data ?? [], limit, offset })
}
