// WEA-001 / HIP-001 — V2 Épico 2.3: lista fontes disponíveis + estado do usuário (sem tokens).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient, getConnectorStates } from '@/lib/connectors/runtime.server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const states = await getConnectorStates(adminClient(), user.id)
    return NextResponse.json({ connectors: states })
  } catch (e) {
    console.error('[connectors] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha ao listar integrações' }, { status: 500 })
  }
}
