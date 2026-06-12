// Worker de lembretes da agenda (Fase 2).
// Acionado diariamente por pg_cron (via pg_net) com o header x-admin-secret.
// Envia um lembrete por e-mail para cada evento pendente que vence hoje ou
// amanhã, ainda não lembrado. Marca reminder_sent_at para não repetir.
//
// Sem inteligência clínica: apenas relembra eventos criados pela própria usuária.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { reminderEmailHtml, reminderEmailText } from '@/lib/email/reminder-template'

const FROM_ADDRESS = 'SINTERA <ola@sinteramais.com.br>'

const TYPE_LABEL: Record<string, string> = {
  exame: 'Exame', consulta: 'Consulta', retorno: 'Retorno', medicacao: 'Medicação', outro: 'Evento',
}

interface AgendaRow {
  id: string
  user_id: string
  event_type: string
  title: string
  event_date: string        // YYYY-MM-DD
  event_time: string | null
}

function ymd(d: Date): string {
  return d.toISOString().split('T')[0]
}

function dateLabel(eventDate: string, today: string, tomorrow: string): string {
  const [y, m, day] = eventDate.split('-').map(Number)
  const full = new Date(y, m - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
  if (eventDate === today) return `hoje, ${full}`
  if (eventDate === tomorrow) return `amanhã, ${full}`
  return full
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const apiKey = process.env.RESEND_API_KEY
  if (!serviceKey || !apiKey) {
    return NextResponse.json({
      error: 'Configuração ausente',
      missing: {
        SUPABASE_SERVICE_ROLE_KEY: !serviceKey,
        RESEND_API_KEY: !apiKey,
      },
    }, { status: 500 })
  }

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)
  const resend = new Resend(apiKey)

  const now = new Date()
  const today = ymd(now)
  const tomorrow = ymd(new Date(now.getTime() + 24 * 60 * 60 * 1000))

  // Eventos elegíveis: pendentes, com lembrete ligado, ainda não lembrados,
  // vencendo hoje ou amanhã.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('agenda_events') as any)
    .select('id, user_id, event_type, title, event_date, event_time')
    .eq('status', 'pending')
    .eq('reminder_enabled', true)
    .is('reminder_sent_at', null)
    .gte('event_date', today)
    .lte('event_date', tomorrow)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const events = (data ?? []) as AgendaRow[]
  if (events.length === 0) {
    return NextResponse.json({ due: 0, sent: 0, failed: 0 })
  }

  // Nomes das usuárias (profiles está nos tipos; sem cast).
  const userIds = [...new Set(events.map(e => e.user_id))]
  const { data: profiles } = await admin.from('profiles').select('id, name').in('id', userIds)
  const nameById = new Map<string, string>()
  for (const p of (profiles ?? []) as { id: string; name: string | null }[]) {
    nameById.set(p.id, p.name ?? '')
  }

  // E-mails via Auth Admin (cache por usuária).
  const emailById = new Map<string, string | null>()
  for (const uid of userIds) {
    const { data: u } = await admin.auth.admin.getUserById(uid)
    emailById.set(uid, u.user?.email ?? null)
  }

  const sentIds: string[] = []
  let failed = 0

  for (const ev of events) {
    const email = emailById.get(ev.user_id)
    if (!email) { failed++; continue }
    const firstName = (nameById.get(ev.user_id) ?? '').split(' ')[0]
    const typeLabel = TYPE_LABEL[ev.event_type] ?? 'Evento'
    const payload = {
      firstName,
      title: ev.title,
      dateLabel: dateLabel(ev.event_date, today, tomorrow),
      timeLabel: ev.event_time ? ev.event_time.slice(0, 5) : null,
      notes: null,
      typeLabel,
    }
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: [email],
        subject: `Lembrete: ${ev.title} — ${payload.dateLabel}`,
        html: reminderEmailHtml(payload),
        text: reminderEmailText(payload),
      })
      sentIds.push(ev.id)
    } catch {
      failed++
    }
  }

  if (sentIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('agenda_events') as any)
      .update({ reminder_sent_at: new Date().toISOString() })
      .in('id', sentIds)
  }

  return NextResponse.json({ due: events.length, sent: sentIds.length, failed })
}
