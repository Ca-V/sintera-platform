// GET  /api/omics/panels — lista painéis ômicos da usuária (paginado, por domínio).
// POST /api/omics/panels — cria um painel; devolve { id }.
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth, pageParams, validDomain } from '@/lib/omics/server'

export async function GET(req: NextRequest) {
  const { error, supabase, userId } = await omicsAuth(req)
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

export async function POST(req: NextRequest) {
  const { error, supabase, userId } = await omicsAuth(req)
  if (error) return error
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const domain = validDomain(typeof b.domain === 'string' ? b.domain : null) ?? 'metabolomics'
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: e } = await (supabase as any).from('omics_panels').insert({
    user_id: userId, domain, laboratory: str(b.laboratory), technology: str(b.technology),
    collected_on: typeof b.collectedOn === 'string' && b.collectedOn ? b.collectedOn : null,
  }).select('id').single()
  if (e || !data) return NextResponse.json({ error: e?.message ?? 'Falha ao criar o painel.' }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
