// WEA-001 / HIP-001 — V2 Épico 2.3: webhook (Notify) — o provedor avisa que há novos dados → dispara a sync.
// O provedor REAL mapeia seu userid interno para o usuário (persistido na conexão). Aqui, protegido por segredo
// compartilhado; o corpo traz o `userId` da plataforma. Sem sessão de usuário (chamada servidor-a-servidor).
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getRegistry, getSyncService } from '@/lib/connectors/runtime.server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params
  const secret = process.env.CONNECTOR_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-connector-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!getRegistry().has(source)) return NextResponse.json({ error: 'Fonte desconhecida' }, { status: 404 })

  let body: { userId?: string }
  try { body = await req.json() } catch { body = {} }
  if (!body.userId) return NextResponse.json({ error: 'userId ausente' }, { status: 400 })

  try {
    const outcome = await getSyncService(adminClient()).sync(body.userId, source)
    return NextResponse.json(outcome)
  } catch (e) {
    console.error('[connector.webhook] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha na sincronização' }, { status: 500 })
  }
}
