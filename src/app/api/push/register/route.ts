// Registro de Expo push token do app Mobile (Bearer). O app chama após o login; o token
// é guardado por usuária (upsert por user_id+token) para o worker de lembretes enviar push.
//   POST { token, platform? } → grava/atualiza
//   DELETE ?token= → remove (logout/opt-out)
import { NextResponse } from 'next/server'
import { authed, BadRequestError } from '@/lib/api/http'

export const POST = authed(async ({ supabase, userId, request }) => {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const token = typeof b.token === 'string' ? b.token.trim() : ''
  if (!token) throw new BadRequestError('token é obrigatório.')
  const platform = typeof b.platform === 'string' ? b.platform : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tabela nova, fora dos tipos gerados
  const { error } = await (supabase as any)
    .from('push_tokens')
    .upsert({ user_id: userId, token, platform, updated_at: new Date().toISOString() }, { onConflict: 'user_id,token' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) throw new BadRequestError('token é obrigatório.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('push_tokens').delete().eq('user_id', userId).eq('token', token)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
