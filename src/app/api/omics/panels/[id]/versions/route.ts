// GET /api/omics/panels/:id/versions — histórico de versões do painel (imutável).
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth } from '@/lib/omics/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase, userId } = await omicsAuth()
  if (error) return error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: e } = await (supabase as any).from('omics_versions')
    .select('version_number, source_file, note, created_at')
    .eq('panel_id', id).eq('user_id', userId)
    .order('version_number', { ascending: false })

  if (e) return NextResponse.json({ error: e.message }, { status: 500 })
  return NextResponse.json({ versions: data ?? [] })
}
