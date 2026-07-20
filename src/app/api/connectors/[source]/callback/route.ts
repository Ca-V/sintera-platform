// WEA-001 / HIP-001 — V2 Épico 2.3: callback OAuth — troca code por tokens, salva a conexão e dispara a 1ª sync.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient, getOAuthProvider, getConnectionStore, getSyncService } from '@/lib/connectors/runtime.server'

const CONEXOES = '/dashboard/conexoes'

export async function GET(req: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.nextUrl.origin))

  const back = new URL(CONEXOES, req.nextUrl.origin)
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = req.cookies.get(`oauth_state_${source}`)?.value
  const oauth = getOAuthProvider(source)

  const fail = (motivo: string) => {
    back.searchParams.set('conexao', 'erro')
    back.searchParams.set('fonte', source)
    const res = NextResponse.redirect(back)
    res.cookies.delete(`oauth_state_${source}`)
    console.warn(`[connector.callback] ${source}: ${motivo}`)
    return res
  }

  if (!oauth) return fail('provider ausente')
  if (!code || !state || !cookieState || state !== cookieState) return fail('state inválido (CSRF) ou code ausente')

  try {
    const admin = adminClient()
    const redirectUri = new URL(`/api/connectors/${source}/callback`, req.nextUrl.origin).toString()
    const tokens = await oauth.exchangeCode(code, redirectUri)
    await getConnectionStore(admin).saveTokens(user.id, source, tokens)
    await getSyncService(admin).sync(user.id, source) // 1ª sync imediata (o dado já aparece)
    back.searchParams.set('conexao', 'ok')
    back.searchParams.set('fonte', source)
    const res = NextResponse.redirect(back)
    res.cookies.delete(`oauth_state_${source}`)
    return res
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e))
  }
}
