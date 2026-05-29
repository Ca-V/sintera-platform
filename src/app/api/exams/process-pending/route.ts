import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/exams/process-pending
 *
 * Finds all exams stuck in 'pending' or 'processing' (> 5 min) for the
 * authenticated user and triggers /api/exams/[id]/process for each.
 *
 * Can be called by an external cron job (e.g. Vercel Cron, GitHub Actions)
 * or manually from the client to recover from failed processing.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  // Cast required: @supabase/ssr 0.10.x resolves select() data to 'never' in strict TS
  const { data: rawExams, error } = await supabase
    .from('exams')
    .select('id')
    .eq('user_id', user.id)
    .or(`status.eq.pending,and(status.eq.processing,created_at.lt.${fiveMinutesAgo})`)
  const stuckExams = (rawExams ?? []) as Array<{ id: string }>

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (stuckExams.length === 0) {
    return NextResponse.json({ processed: 0, message: 'Nenhum exame pendente encontrado' })
  }

  const origin = new URL(request.url).origin
  const results = await Promise.allSettled(
    stuckExams.map(exam =>
      fetch(`${origin}/api/exams/${exam.id}/process`, { method: 'POST' })
    )
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed    = results.length - succeeded

  return NextResponse.json({ processed: succeeded, failed, total: stuckExams.length })
}
