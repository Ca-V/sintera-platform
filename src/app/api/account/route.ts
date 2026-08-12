import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { DOCUMENTS_BUCKET } from '@/lib/api/storage'

/** Lista RECURSIVAMENTE todos os arquivos sob um prefixo (inclui subpastas como
 *  `userId/omics/…`). No Storage do Supabase, "pastas" (prefixos) vêm com `id: null`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function listAllFiles(admin: any, bucket: string, prefix: string): Promise<string[]> {
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 })
  if (!data) return []
  const files: string[] = []
  for (const entry of data) {
    const path = `${prefix}/${entry.name}`
    if (entry.id === null) files.push(...await listAllFiles(admin, bucket, path))
    else files.push(path)
  }
  return files
}

export async function DELETE() {
  try {
    const supabase = await createClient()

    // 1. Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const userId = user.id

    // 2. Admin client (service role; fallback p/ SUPABASE_SECRET_KEY da integração Vercel↔Supabase)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    if (!serviceKey) {
      console.error('[account/delete] service role key não configurada')
      return NextResponse.json({ error: 'Configuração interna ausente' }, { status: 500 })
    }

    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
    )

    // 3. Excluir arquivos do Storage — RECURSIVO (alcança userId/omics/… e demais
    //    subpastas; a exclusão LGPD não pode deixar arquivos órfãos). Remove em lotes
    //    de 1000 (limite da API de storage).
    const allFiles = await listAllFiles(admin, DOCUMENTS_BUCKET, userId)
    for (let i = 0; i < allFiles.length; i += 1000) {
      await admin.storage.from(DOCUMENTS_BUCKET).remove(allFiles.slice(i, i + 1000))
    }

    // 4. Excluir dados do banco em cascata
    await admin.from('biomarkers').delete().eq('user_id', userId)
    await admin.from('exams').delete().eq('user_id', userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('usage_events').delete().eq('user_id', userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('feedback_responses').delete().eq('user_id', userId)
    await admin.from('profiles').delete().eq('id', userId)

    // 5. Log de auditoria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('account_deletion_log').insert({
      user_id:      userId,
      reason:       'user_requested',
      initiated_by: 'user',
    })

    // 6. Excluir usuário auth
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('[account/delete] deleteUser error:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/delete] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
