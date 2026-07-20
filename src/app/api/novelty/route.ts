// NOV-001 — leitura da novidade (fonte única). Reflete "o que o usuário ainda não viu", por fluxo.
// De passagem, aciona o refresh das fontes automáticas (sync de conectores, com throttle) para a contagem já
// incluir o que acabou de chegar. NÃO marca nada como visto — só a superfície de consumo faz isso (POST /seen).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient, syncOpenConnections, logConnectorEvent } from '@/lib/connectors/runtime.server'
import { getNovelty } from '@/lib/novelty/novelty'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const admin = adminClient()
    // Refresh das fontes automáticas (best-effort; o próprio serviço faz o throttle). Nunca atrapalha a leitura.
    try {
      const res = await syncOpenConnections(admin, user.id)
      if (res.newRecords > 0) {
        await logConnectorEvent(admin, user.id, 'connector_first_benefit', { newRecords: res.newRecords, on: 'novelty' }, true)
      }
    } catch (e) {
      console.error('[novelty] refresh de fontes falhou (ignorado):', e instanceof Error ? e.message : e)
    }
    const streams = await getNovelty(admin, user.id)
    return NextResponse.json({ streams })
  } catch (e) {
    console.error('[novelty] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha ao ler novidades' }, { status: 500 })
  }
}
