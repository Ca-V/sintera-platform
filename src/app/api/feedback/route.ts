import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { comprehension, trust, action_taken, open_feedback } = await req.json()

    if (!comprehension || !trust) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: comprehension, trust' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('feedback_responses').upsert({
      user_id:       user.id,
      comprehension,
      trust,
      action_taken:  action_taken ?? null,
      open_feedback: open_feedback ?? null,
    }, { onConflict: 'user_id' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('usage_events').insert({
      user_id:    user.id,
      event_name: 'feedback_submitted',
      metadata:   { comprehension, trust, action_taken },
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
      .not('comprehension', 'is', null)
      .limit(1)

    return NextResponse.json({ submitted: (data?.length ?? 0) > 0 })
  } catch {
    return NextResponse.json({ submitted: false })
  }
}
