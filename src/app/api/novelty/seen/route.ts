// NOV-001 — reconhecimento NATURAL: a superfície de CONSUMO (o módulo onde o conteúdo vive) chama esta rota ao
// ser aberta. Marca o fluxo como visto AGORA. É a ÚNICA forma de avançar a "visto" — não há botão de "dispensar".
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/connectors/runtime.server'
import { isKnownStream, markSeen } from '@/lib/novelty/novelty'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  let stream: unknown
  try {
    const body = await req.json()
    stream = body?.stream
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }
  if (typeof stream !== 'string' || !isKnownStream(stream)) {
    return NextResponse.json({ error: 'Fluxo desconhecido' }, { status: 400 })
  }
  try {
    await markSeen(adminClient(), user.id, stream)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[novelty.seen] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha ao marcar visto' }, { status: 500 })
  }
}
