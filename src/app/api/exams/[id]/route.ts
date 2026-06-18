// Exclui um exame e tudo ligado a ele (biomarcadores, insights, log de IA e o
// arquivo no storage). Ownership verificada com o client autenticado; a limpeza
// usa service role para cobrir tabelas/arquivos sem brechas de RLS — sempre
// escopada ao exam_id + user_id da própria usuária. Ação destrutiva e irreversível.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: examId } = await params
  const supabase = await createClient()

  // 1. Auth
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const userId = authData.user.id

  // 2. Ownership (confirma que o exame é da usuária) + pega o arquivo
  const { data: exam } = await supabase
    .from('exams')
    .select('id, file_url')
    .eq('id', examId)
    .eq('user_id', userId)
    .maybeSingle() as { data: { id: string; file_url: string | null } | null }

  if (!exam) {
    return NextResponse.json({ error: 'Exame não encontrado.' }, { status: 404 })
  }

  // 3. Admin client para limpeza completa
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Configuração interna ausente.' }, { status: 500 })
  }
  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  // 4. Remover o arquivo do storage (best-effort; não bloqueia a exclusão)
  if (exam.file_url) {
    const m = exam.file_url.match(/\/exams\/([^?]+)/)
    if (m) {
      const path = decodeURIComponent(m[1])
      // Só remove se o caminho pertence à pasta da usuária (defesa extra).
      if (path.startsWith(`${userId}/`)) {
        await admin.storage.from('exams').remove([path]).catch(() => {})
      }
    }
  }

  // 5. Excluir dados dependentes + o exame (escopados ao exame e à usuária)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = admin as any
    await a.from('ai_insights').delete().eq('exam_id', examId).eq('user_id', userId)
    await a.from('biomarkers').delete().eq('exam_id', examId).eq('user_id', userId)
    await a.from('ai_processing_log').delete().eq('exam_id', examId)
    const { error: examErr } = await a.from('exams').delete().eq('id', examId).eq('user_id', userId)
    if (examErr) throw new Error(examErr.message)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'Falha ao excluir o exame.', detail: msg.slice(0, 300) }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
