// GET    /api/omics/panels/:id — painel + resumo por categoria (Níveis 1 e 2).
//   Não carrega as features (escalabilidade) — use /panels/:id/results por categoria.
// DELETE /api/omics/panels/:id — remove o painel (e seus resultados, por cascata).
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth } from '@/lib/omics/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase, userId } = await omicsAuth()
  if (error) return error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: panel } = await db.from('omics_panels')
    .select('id, exam_id, domain, technology, platform, total_features, laboratory, collected_on, created_at')
    .eq('id', id).eq('user_id', userId).maybeSingle()
  if (!panel) return NextResponse.json({ error: 'Painel não encontrado' }, { status: 404 })

  const { data: cats, error: e } = await db.rpc('omics_panel_categories', { p_panel: id })
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })

  const categories = ((cats ?? []) as Array<Record<string, unknown>>).map(c => ({
    category_id: c.category_id ?? null,
    name: (c.name as string) ?? 'Sem categoria',
    display_order: (c.display_order as number) ?? null,
    count: Number(c.n ?? 0),
  }))
  const totalResults = categories.reduce((s, c) => s + c.count, 0)

  return NextResponse.json({ panel, categories, total_results: totalResults })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase, userId } = await omicsAuth()
  if (error) return error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: e } = await (supabase as any).from('omics_panels').delete().eq('id', id).eq('user_id', userId)
  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
