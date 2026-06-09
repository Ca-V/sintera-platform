import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { event_name, metadata } = await req.json()
    if (!event_name) {
      return NextResponse.json({ error: 'Campo obrigatorio: event_name' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('usage_events').insert({
      user_id: user.id,
      event_name,
      metadata: metadata ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[events] error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
