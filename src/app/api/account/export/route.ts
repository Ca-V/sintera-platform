import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const userId = user.id

    const [
      { data: profile },
      { data: exams },
      { data: biomarkers },
      { data: insights },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('exams').select('id,type,exam_date,status,notes,created_at').eq('user_id', userId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('biomarkers').select('name,value,value_text,unit,reference_min,reference_max,interpretation,result_type,reference_source,exam_id,created_at').eq('user_id', userId).eq('synthetic', false),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('ai_insights').select('insight,category,priority,is_read,created_at').eq('user_id', userId).eq('synthetic', false),
    ])

    const payload = {
      exportado_em: new Date().toISOString(),
      titular: {
        id: userId,
        email: user.email,
        criado_em: user.created_at,
      },
      perfil: profile ?? null,
      exames: exams ?? [],
      biomarcadores: biomarkers ?? [],
      insights: insights ?? [],
      nota_lgpd:
        'Este arquivo contém todos os dados pessoais associados à sua conta na SINTERA, ' +
        'exportados nos termos do art. 18, V da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).',
    }

    const json = JSON.stringify(payload, null, 2)
    const filename = `sintera-dados-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[account/export] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
