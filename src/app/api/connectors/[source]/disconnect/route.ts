// WEA-001 / HIP-001 — V2 Épico 2.3: revoga o acesso de uma fonte (LGPD: revogação efetiva).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient, getRegistry, getConnectionStore, getOAuthProvider, getWebhookSubscriber, connectorWebhookUrl } from '@/lib/connectors/runtime.server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (!getRegistry().has(source)) return NextResponse.json({ error: 'Fonte desconhecida' }, { status: 404 })

  try {
    const admin = adminClient()
    const store = getConnectionStore(admin)

    // Webhook (best-effort): revoga a assinatura no provedor ANTES de apagar os tokens locais. Se o token já expirou
    // ou a revogação falhar, seguimos com a revogação local (LGPD: o acesso é efetivamente cortado do nosso lado).
    const subscriber = getWebhookSubscriber(source)
    const oauth = getOAuthProvider(source)
    if (subscriber && oauth) {
      try {
        const token = await store.resolveAccessToken(user.id, source, oauth)
        await subscriber.revoke(token, connectorWebhookUrl(source, req.nextUrl.origin))
      } catch (e) { console.warn(`[connector.disconnect] ${source}: revogação de webhook falhou (ignorado): ${e instanceof Error ? e.message : e}`) }
    }

    await store.revoke(user.id, source)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[connector.disconnect] erro:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Falha ao desconectar' }, { status: 500 })
  }
}
