// WEA-001 / HIP-001 — V2 Épico 2.3: sync manual/on-open (idempotente).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient, getRegistry, getSyncService } from '@/lib/connectors/runtime.server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!getRegistry().has(source)) return NextResponse.json({ error: 'Fonte desconhecida' }, { status: 404 })

  try {
    const outcome = await getSyncService(adminClient()).sync(user.id, source)
    return NextResponse.json(outcome)
  } catch (e) {
    console.error('[connector.sync] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha na sincronização' }, { status: 500 })
  }
}
