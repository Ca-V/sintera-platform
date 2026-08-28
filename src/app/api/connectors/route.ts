// WEA-001 / HIP-001 — V2 Épico 2.3: lista fontes disponíveis + estado do usuário (sem tokens).
import { NextResponse, type NextRequest } from 'next/server'
// Aceita cookie (Web) OU Bearer (aplicativo) — ver o cabeçalho de apiAuth.
import { authenticateRequest } from '@/lib/supabase/apiAuth'
import { adminClient, getConnectorStates } from '@/lib/connectors/runtime.server'

export async function GET(req: NextRequest) {
  const { user } = await authenticateRequest(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const states = await getConnectorStates(adminClient(), user.id)
    return NextResponse.json({ connectors: states })
  } catch (e) {
    console.error('[connectors] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha ao listar integrações' }, { status: 500 })
  }
}
