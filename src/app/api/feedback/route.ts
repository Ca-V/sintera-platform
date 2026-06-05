import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { accuracy, most_useful } = await req.json()
    if (!accuracy || !most_useful) {
      return NextResponse.json({ error: 'Campos obrigatorios: accuracy, most_useful' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('feedback_responses').upsert({
      user_id:     user.id,
      accuracy,
      most_useful,
    }, { onConflict: 'user_id' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('usage_events').insert({
      user_id:    user.id,
      event_name: 'feedback_submitted',
      metadata:   { accuracy, most_useful },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[feedback] error:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ submitted: false })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('feedback_responses')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    return NextResponse.json({ submitted: (data?.length ?? 0) > 0 })
  } catch {
    return NextResponse.json({ submitted: false })
  }
}
