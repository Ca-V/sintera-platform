import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json() as { name?: string; email?: string }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verifica duplicata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json({ ok: true, already: true })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('waitlist').insert({
      name:  name.trim(),
      email: email.toLowerCase().trim(),
    })

    if (error) throw error

    return NextResponse.json({ ok: true, already: false })
  } catch (err) {
    console.error('[waitlist] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
