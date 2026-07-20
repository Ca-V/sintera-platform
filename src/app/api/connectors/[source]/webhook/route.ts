// HIP-001/HIP-002 — webhook (vendor-neutral). Duas formas, decididas por CAPACIDADE do provider:
//  (a) provider com webhook NATIVO (ex.: Withings): a rota delega a `handler.resolveUser` (parseia o payload do
//      provedor e resolve o usuário pelo id na fonte). Responde 200 mesmo para ping de validação/usuário desconhecido.
//  (b) fallback genérico (server-a-servidor): segredo compartilhado + `{ userId }` no corpo (comportamento V2).
// A rota NÃO conhece nenhum fornecedor — só o contrato WebhookHandler.
import { NextRequest, NextResponse } from 'next/server'
import { adminClient, getRegistry, getSyncService, getConnectionStore, getWebhookHandler } from '@/lib/connectors/runtime.server'

/** Alguns provedores (ex.: Withings) validam a callback URL com um HEAD — precisa responder 200. */
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params
  if (!getRegistry().has(source)) return NextResponse.json({ error: 'Fonte desconhecida' }, { status: 404 })
  const admin = adminClient()

  // (a) Provider com webhook nativo → delega o parse/resolução ao adaptador.
  const handler = getWebhookHandler(source)
  if (handler) {
    const store = getConnectionStore(admin)
    let userId: string | null
    try {
      userId = await handler.resolveUser(req, { resolveUserByExternalId: (p, e) => store.resolveUserByExternalId(p, e) })
    } catch (e) {
      console.error('[connector.webhook] resolveUser erro:', e instanceof Error ? e.message : e)
      return NextResponse.json({ ok: true }) // nunca falha a validação do provedor
    }
    if (!userId) return NextResponse.json({ ok: true }) // ping de validação / usuário desconhecido → ignora
    try {
      const outcome = await getSyncService(admin).sync(userId, source)
      return NextResponse.json(outcome)
    } catch (e) {
      console.error('[connector.webhook] sync erro:', e instanceof Error ? e.message : e)
      return NextResponse.json({ error: 'Falha na sincronização' }, { status: 500 })
    }
  }

  // (b) Fallback genérico: segredo compartilhado + userId no corpo.
  const secret = process.env.CONNECTOR_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-connector-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let body: { userId?: string }
  try { body = await req.json() } catch { body = {} }
  if (!body.userId) return NextResponse.json({ error: 'userId ausente' }, { status: 400 })
  try {
    const outcome = await getSyncService(admin).sync(body.userId, source)
    return NextResponse.json(outcome)
  } catch (e) {
    console.error('[connector.webhook] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha na sincronização' }, { status: 500 })
  }
}
