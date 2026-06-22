import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const payload: ProfileUpdate = { updated_at: new Date().toISOString() }

  if ('name' in body)               payload.name               = body.name as string | null
  if ('age_range' in body)          payload.age_range          = body.age_range as string | null
  if ('cycle_length' in body)       payload.cycle_length       = body.cycle_length as number | null
  if ('last_period' in body)        payload.last_period        = body.last_period as string | null
  if ('cycle_regularity' in body)   payload.cycle_regularity   = body.cycle_regularity as string | null
  if ('goals' in body)              payload.goals              = body.goals as string[] | null
  if ('height_cm' in body)          payload.height_cm          = body.height_cm as number | null
  if ('pref_daily_reminder' in body) payload.pref_daily_reminder = body.pref_daily_reminder as boolean
  if ('pref_phase_alerts' in body)  payload.pref_phase_alerts  = body.pref_phase_alerts as boolean
  if ('pref_email_insights' in body) payload.pref_email_insights = body.pref_email_insights as boolean

  const { data, error } = await supabase
    .from('profiles')
    // @supabase/ssr 0.10.x resolves the update() param to 'never' with strict TS — double-cast required
    .update(payload as unknown as never)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
