// WEA-001 / HIP-001 — V2 Épico 3.1: sincronização ON-OPEN. Ao abrir a plataforma, o cliente chama esta rota
// e as fontes conectadas sincronizam sozinhas (com throttle). "A SINTERA trabalha em segundo plano."
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient, syncOpenConnections, logConnectorEvent } from '@/lib/connectors/runtime.server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const admin = adminClient()
    const res = await syncOpenConnections(admin, user.id)
    // marco do Aha: 1º benefício percebido também pode chegar no RETORNO (dado novo no on-open) — só a 1ª vez
    if (res.newRecords > 0) await logConnectorEvent(admin, user.id, 'connector_first_benefit', { newRecords: res.newRecords, on: 'return' }, true)
    return NextResponse.json(res)
  } catch (e) {
    console.error('[connectors.sync-open] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha na sincronização automática' }, { status: 500 })
  }
}
