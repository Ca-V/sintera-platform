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
import { buildEventNotification } from '@/lib/agenda/notification'
import { eventToNotificationInput, formatDateBR } from '@/lib/agenda/presentation'
import { rowToHealthEvent, agendaRowToHealthEvent, isClosed, type HealthEvent, type HealthEventRow, type AgendaEventRow } from '@/lib/agenda/event'

const FROM_ADDRESS = 'SINTERA <ola@sinteramais.com.br>'

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

  // Eventos elegíveis (lembrete ligado, ainda não enviado, vencendo hoje/amanhã):
  // lê o CANÔNICO health_events E o legado agenda_events (coexistência), expondo o
  // mesmo domínio. Dedup por id (canônico vence). Status fechado não recebe lembrete.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hRes = await (admin.from('health_events') as any)
    .select('*').eq('reminder_enabled', true).is('reminder_sent_at', null)
    .gte('event_date', today).lte('event_date', tomorrow).eq('synthetic', false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aRes = await (admin.from('agenda_events') as any)
    .select('id, user_id, event_type, title, event_date, event_time, duration_min, notes, status, reminder_enabled, reminder_sent_at')
    .eq('status', 'pending').eq('reminder_enabled', true).is('reminder_sent_at', null)
    .gte('event_date', today).lte('event_date', tomorrow)
  if (hRes.error || aRes.error) {
    return NextResponse.json({ error: hRes.error?.message ?? aRes.error?.message }, { status: 500 })
  }

  type DueItem = { event: HealthEvent; userId: string; table: 'health_events' | 'agenda_events' }
  const byId = new Map<string, DueItem>()
  for (const r of (aRes.data ?? []) as (AgendaEventRow & { user_id: string })[]) {
    byId.set(r.id, { event: agendaRowToHealthEvent(r), userId: r.user_id, table: 'agenda_events' })
  }
  for (const r of (hRes.data ?? []) as (HealthEventRow & { user_id: string })[]) {
    const e = rowToHealthEvent(r)
    if (!isClosed(e)) byId.set(e.id, { event: e, userId: r.user_id, table: 'health_events' }) // canônico vence
  }
  const items = [...byId.values()]
  if (items.length === 0) {
    return NextResponse.json({ due: 0, sent: 0, failed: 0 })
  }

  // Nomes + telefone + opt-in de WhatsApp das usuárias.
  const userIds = [...new Set(items.map(i => i.userId))]
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

  const sentByTable: Record<'health_events' | 'agenda_events', string[]> = { health_events: [], agenda_events: [] }
  let failed = 0
  let whatsappSent = 0
  const whatsappDiag: string[] = []

  for (const { event: ev, userId, table } of items) {
    const email = emailById.get(userId)
    const firstName = (nameById.get(userId) ?? '').split(' ')[0]
    const notification = buildEventNotification(eventToNotificationInput(ev))   // REQ-NOTIF-001
    const subjectWhen = dateLabel(ev.date, today, tomorrow)
    let delivered = false

    // Canal 1 — e-mail (projeção completa do domínio)
    if (email) {
      try {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: [email],
          subject: `Lembrete: ${ev.title} — ${subjectWhen}`,
          html: reminderEmailHtml({ firstName, notification }),
          text: reminderEmailText({ firstName, notification }),
        })
        delivered = true
      } catch { /* tenta o WhatsApp mesmo assim */ }
    }

    // Canal 2 — WhatsApp (só com opt-in + telefone)
    if (waOptInById.get(userId) && phoneById.get(userId)) {
      const wa = await sendWhatsAppReminder(phoneById.get(userId), { title: ev.title, dateLabel: formatDateBR(ev.date) })
      if (wa.status === 'sent') { delivered = true; whatsappSent++ }
      else if (wa.detail) whatsappDiag.push(`${ev.id.slice(0, 8)}:${wa.status}:${wa.detail}`)
    }

    if (delivered) sentByTable[table].push(ev.id)
    else failed++
  }

  for (const table of ['health_events', 'agenda_events'] as const) {
    if (sentByTable[table].length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin.from(table) as any).update({ reminder_sent_at: new Date().toISOString() }).in('id', sentByTable[table])
    }
  }

  const sent = sentByTable.health_events.length + sentByTable.agenda_events.length
  return NextResponse.json({ due: items.length, sent, whatsappSent, failed, whatsappDiag })
}
