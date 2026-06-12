import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ALERT_EMAIL    = 'carinaleite.br@gmail.com'
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: stuckExams, error } = await supabase
      .from('exams')
      .select('id, user_id, created_at, updated_at')
      .eq('status', 'processing')
      .lt('updated_at', fiveMinutesAgo)

    if (error) {
      console.error('[pipeline-alert] query error:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    if (!stuckExams || stuckExams.length === 0) {
      return new Response(JSON.stringify({ ok: true, stuckCount: 0 }), { status: 200 })
    }

    const examList = stuckExams.map(e => {
      const elapsed = Math.round((Date.now() - new Date(e.updated_at).getTime()) / 60000)
      return `• exam_id: ${e.id} | user_id: ${e.user_id} | há ${elapsed} min`
    }).join('\n')

    const emailBody = [
      `[SINTERA] Alerta — ${stuckExams.length} exame(s) travado(s) no pipeline`,
      '',
      `Detectado em: ${new Date().toISOString()}`,
      '',
      examList,
      '',
      'Acesse o Supabase para investigar: https://supabase.com/dashboard/project/pxiglvrgxooawetboglb',
    ].join('\n')

    if (!RESEND_API_KEY) {
      console.warn('[pipeline-alert] RESEND_API_KEY not set — skipping email send')
      return new Response(JSON.stringify({ ok: true, stuckCount: stuckExams.length, emailSent: false }), { status: 200 })
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SINTERA Alertas <onboarding@resend.dev>',
        to:   ALERT_EMAIL,
        subject: `[SINTERA] Alerta — ${stuckExams.length} exame(s) travado(s)`,
        text: emailBody,
      }),
    })

    const emailOk = resendRes.ok
    if (!emailOk) {
      const resendBody = await resendRes.text()
      console.error('[pipeline-alert] Resend error:', resendBody)
    }

    return new Response(
      JSON.stringify({ ok: true, stuckCount: stuckExams.length, emailSent: emailOk }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[pipeline-alert] unexpected error:', err)
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 })
  }
})
