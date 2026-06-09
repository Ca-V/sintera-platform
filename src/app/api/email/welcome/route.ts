import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { welcomeEmailHtml, welcomeEmailText } from '@/lib/email/welcome-template'

const ADMIN_EMAIL = 'carinaleite.br@gmail.com'
const FROM_ADDRESS = 'SINTERA <ola@sintera.com.br>'

export async function POST(req: NextRequest) {
  // Somente a admin pode disparar
  const authHeader = req.headers.get('x-admin-secret')
  if (authHeader !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json() as { recipients: { email: string; firstName: string }[] }
  const { recipients } = body

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'recipients obrigatório' }, { status: 400 })
  }
  if (recipients.length > 50) {
    return NextResponse.json({ error: 'Máximo 50 destinatários por chamada' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  const resend = new Resend(apiKey)
  const results: { email: string; ok: boolean; error?: string }[] = []

  for (const { email, firstName } of recipients) {
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to:   [email],
        bcc:  [ADMIN_EMAIL],
        replyTo: ADMIN_EMAIL,
        subject: `${firstName ? firstName + ', sua' : 'Sua'} vaga no Beta da SINTERA está confirmada`,
        html: welcomeEmailHtml(firstName),
        text: welcomeEmailText(firstName),
      })
      results.push({ email, ok: true })
    } catch (err) {
      results.push({ email, ok: false, error: err instanceof Error ? err.message : 'erro desconhecido' })
    }
  }

  const sent   = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length
  return NextResponse.json({ sent, failed, results })
}
