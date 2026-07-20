// WEA-001 / HIP-001 — V2 Aha (correção): marca a "última visita" AGORA. Chamado quando o usuário RECONHECE
// (dispensa) o aviso "sua história cresceu" — a partir daí, só dado com created_at posterior conta como novo.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/connectors/runtime.server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    await adminClient().from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[connectors.seen] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha' }, { status: 500 })
  }
}
