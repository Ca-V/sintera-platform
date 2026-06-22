// GET /api/omics/categories?domain= — categorias por domínio (catálogo global).
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth, validDomain } from '@/lib/omics/server'

export async function GET(req: NextRequest) {
  const { error, supabase } = await omicsAuth()
  if (error) return error
  const domain = validDomain(new URL(req.url).searchParams.get('domain'))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (supabase as any).from('omics_categories').select('id, domain, name, display_order')
  if (domain) q = q.eq('domain', domain)
  const { data, error: e } = await q.order('domain').order('display_order')

  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ categories: data ?? [] })
}
