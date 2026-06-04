import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerClient()

    // 1. Verify authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const userId = user.id

    // 2. Verify password by re-authenticating
    const { password } = await req.json()
    if (!password) {
      return NextResponse.json({ error: 'Senha obrigatória' }, { status: 400 })
    }
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password,
    })
    if (signInError) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 403 })
    }

    // 3. Delete Storage files: exams/{user_id}/
    const { data: storageFiles } = await supabaseAdmin.storage
      .from('exams')
      .list(userId)
    if (storageFiles && storageFiles.length > 0) {
      const paths = storageFiles.map(f => `${userId}/${f.name}`)
      await supabaseAdmin.storage.from('exams').remove(paths)
    }

    // 4. Delete biomarkers
    await supabaseAdmin.from('biomarkers').delete().eq('user_id', userId)

    // 5. Delete exams records
    await supabaseAdmin.from('exams').delete().eq('user_id', userId)

    // 6. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 7. Log deletion (before deleting auth user)
    await supabaseAdmin.from('account_deletion_log').insert({
      user_id:      userId,
      reason:       'user_requested',
      initiated_by: 'user',
    })

    // 8. Delete auth user
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