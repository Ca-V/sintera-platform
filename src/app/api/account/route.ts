import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar sessão autenticada
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    const userId = user.id

    // 2. Verificar senha por re-autenticacao
    const { password } = await req.json()
    if (!password) {
      return NextResponse.json({ error: 'Senha obrigatoria' }, { status: 400 })
    }

    // Inicializar admin client dentro da funcao (nao em nivel de modulo)
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password,
    })
    if (signInError) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 403 })
    }

    // 3. Excluir arquivos do Storage: exams/{user_id}/
    const { data: storageFiles } = await supabaseAdmin.storage
      .from('exams')
      .list(userId)
    if (storageFiles && storageFiles.length > 0) {
      const paths = storageFiles.map((f) => `${userId}/${f.name}`)
      await supabaseAdmin.storage.from('exams').remove(paths)
    }

    // 4. Excluir biomarkers
    await supabaseAdmin.from('biomarkers').delete().eq('user_id', userId)

    // 5. Excluir exams
    await supabaseAdmin.from('exams').delete().eq('user_id', userId)

    // 6. Excluir profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 7. Log de auditoria (antes de excluir o usuario auth)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any).from('account_deletion_log').insert({
      user_id:      userId,
      reason:       'user_requested',
      initiated_by: 'user',
    })

    // 8. Excluir usuario auth
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteUserError) {
      console.error('[account/delete] auth.admin.deleteUser error:', deleteUserError)
      return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/delete] unexpected error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
