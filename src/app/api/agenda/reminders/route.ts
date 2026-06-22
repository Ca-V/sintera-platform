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
import { sendWhatsAppReminder } from '@/lib/whatsapp/send'

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

  // Ferramenta de administração da Meta (atrás do x-admin-secret), para
  // gerenciar templates pelo backend sem a interface da Meta:
  //   { debug:true }                              → lista número + templates
  //   { debug:true, action:'create_template', ... } → cria template
  //   { debug:true, action:'delete_template', name }→ exclui template (todos idiomas)
  // Usa o token de sistema (permissão whatsapp_business_management). Não envia
  // lembretes. Conteúdo factual; sem juízo clínico.
  let debugBody: {
    debug?: boolean; wabaId?: string; action?: string
    name?: string; lang?: string; category?: string; bodyText?: string
  } = {}
  try { debugBody = await req.json() } catch { /* corpo vazio = fluxo normal */ }
  if (debugBody?.debug === true) {
    const token = process.env.WHATSAPP_CLOUD_TOKEN
    const pnid = process.env.WHATSAPP_PHONE_NUMBER_ID
    const wabaId = debugBody.wabaId || process.env.WHATSAPP_WABA_ID || ''
    const call = async (method: string, path: string, jsonBody?: unknown) => {
      try {
        const r = await fetch(`https://graph.facebook.com/v21.0/${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            ...(jsonBody ? { 'Content-Type': 'application/json' } : {}),
          },
          body: jsonBody ? JSON.stringify(jsonBody) : undefined,
        })
        return { status: r.status, body: (await r.text()).slice(0, 1800) }
      } catch (e) { return { error: String(e).slice(0, 200) } }
    }

    if (debugBody.action === 'create_template') {
      const result = await call('POST', `${wabaId}/message_templates`, {
        name: debugBody.name ?? 'lembrete_sintera',
        language: debugBody.lang ?? 'pt_BR',
        category: debugBody.category ?? 'UTILITY',
        components: [{
          type: 'BODY',
          text: debugBody.bodyText ?? 'Lembrete SINTERA: {{1}} em {{2}}. Esta é uma organização da sua jornada de saúde e não substitui avaliação médica.',
          example: { body_text: [['Consulta com cardiologista', 'amanhã, qua 20 jun']] },
        }],
      })
      return NextResponse.json({ debug: true, action: 'create_template', result })
    }

    if (debugBody.action === 'delete_template') {
      const result = await call('DELETE', `${wabaId}/message_templates?name=${encodeURIComponent(debugBody.name ?? '')}`)
      return NextResponse.json({ debug: true, action: 'delete_template', result })
    }

    return NextResponse.json({
      debug: true,
      hasToken: !!token,
      phoneNumberId: pnid ?? null,
      phone: pnid ? (await call('GET', `${pnid}?fields=id,display_phone_number,verified_name,name_status`)) : null,
      templates: wabaId ? (await call('GET', `${wabaId}/message_templates?fields=name,status,language,category&limit=80`)) : 'sem wabaId',
    })
  }

  // Fallback para SUPABASE_SECRET_KEY (chave nova gerada pela integração
  // Vercel↔Supabase) caso a SERVICE_ROLE_KEY legada esteja ausente/vazia.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
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

  // Nomes + telefone + opt-in de WhatsApp das usuárias.
  const userIds = [...new Set(events.map(e => e.user_id))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin.from('profiles') as any)
    .select('id, name, phone, pref_whatsapp_reminder').in('id', userIds)
  const nameById = new Map<string, string>()
  const phoneById = new Map<string, string | null>()
  const waOptInById = new Map<string, boolean>()
  for (const p of (profiles ?? []) as { id: string; name: string | null; phone: string | null; pref_whatsapp_reminder: boolean | null }[]) {
    nameById.set(p.id, p.name ?? '')
    phoneById.set(p.id, p.phone ?? null)
    waOptInById.set(p.id, p.pref_whatsapp_reminder === true)
  }

  // E-mails via Auth Admin (cache por usuária).
  const emailById = new Map<string, string | null>()
  for (const uid of userIds) {
    const { data: u } = await admin.auth.admin.getUserById(uid)
    emailById.set(uid, u.user?.email ?? null)
  }

  const sentIds: string[] = []
  let failed = 0
  let whatsappSent = 0
  const whatsappDiag: string[] = []   // diagnóstico de falhas de envio (sem credenciais)

  for (const ev of events) {
    const email = emailById.get(ev.user_id)
    const firstName = (nameById.get(ev.user_id) ?? '').split(' ')[0]
    const typeLabel = TYPE_LABEL[ev.event_type] ?? 'Evento'
    const label = dateLabel(ev.event_date, today, tomorrow)
    let delivered = false

    // Canal 1 — e-mail
    if (email) {
      try {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: [email],
          subject: `Lembrete: ${ev.title} — ${label}`,
          html: reminderEmailHtml({ firstName, title: ev.title, dateLabel: label, timeLabel: ev.event_time ? ev.event_time.slice(0, 5) : null, notes: null, typeLabel }),
          text: reminderEmailText({ firstName, title: ev.title, dateLabel: label, timeLabel: ev.event_time ? ev.event_time.slice(0, 5) : null, notes: null, typeLabel }),
        })
        delivered = true
      } catch { /* tenta o WhatsApp mesmo assim */ }
    }

    // Canal 2 — WhatsApp (só com opt-in + telefone; ignora se sem credenciais)
    if (waOptInById.get(ev.user_id) && phoneById.get(ev.user_id)) {
      const wa = await sendWhatsAppReminder(phoneById.get(ev.user_id), { title: ev.title, dateLabel: label })
      if (wa.status === 'sent') { delivered = true; whatsappSent++ }
      else if (wa.detail) whatsappDiag.push(`${ev.id.slice(0, 8)}:${wa.status}:${wa.detail}`)
    }

    if (delivered) sentIds.push(ev.id)
    else failed++
  }

  if (sentIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('agenda_events') as any)
      .update({ reminder_sent_at: new Date().toISOString() })
      .in('id', sentIds)
  }

  return NextResponse.json({ due: events.length, sent: sentIds.length, whatsappSent, failed, whatsappDiag })
}
