// WEA-001 / HIP-001 — V2 Épico 2.3: inicia o OAuth (gera state, redireciona ao provedor).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRegistry, getOAuthProvider } from '@/lib/connectors/runtime.server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.nextUrl.origin))

  const oauth = getOAuthProvider(source)
  if (!oauth || !getRegistry().has(source)) {
    return NextResponse.json({ error: 'Fonte desconhecida' }, { status: 404 })
  }

  const state = crypto.randomUUID()
  const redirectUri = new URL(`/api/connectors/${source}/callback`, req.nextUrl.origin).toString()
  const res = NextResponse.redirect(oauth.getAuthorizeUrl(state, redirectUri))
  // state em cookie httpOnly (CSRF) — verificado no callback.
  res.cookies.set(`oauth_state_${source}`, state, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 600 })
  return res
}
