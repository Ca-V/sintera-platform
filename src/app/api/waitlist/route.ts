// Cadastro na lista de espera (landing PÚBLICA, sem login).
// A tabela `waitlist` tem RLS service_role-only (sem policy de INSERT anônimo),
// então o insert precisa do ADMIN client — como em /api/consent. Mantém a tabela
// protegida (não abre escrita pública) e corrige o 500 "Algo deu errado".
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json() as { name?: string; email?: string }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    if (!serviceKey) {
      console.error('[waitlist] service role key não configurada')
      return NextResponse.json({ error: 'Configuração interna ausente' }, { status: 500 })
    }
    const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

    const normEmail = email.toLowerCase().trim()

    // 0 ou 1 linha → maybeSingle (single() acusa erro quando não há linha).
    const { data: existing } = await admin
      .from('waitlist')
      .select('id')
      .eq('email', normEmail)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: true, already: true })
    }

    const { error } = await admin.from('waitlist').insert({
      name: name.trim(),
      email: normEmail,
    })

    if (error) throw error

    return NextResponse.json({ ok: true, already: false })
  } catch (err) {
    console.error('[waitlist] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
