// Jornada de Saúde por HTTP — Web (cookie) e Mobile (Bearer). É a exposição
// client-facing das capacidades que já existiam no domínio Agenda (dono único dos
// eventos): a Web lê/escreve via serviços; o Mobile precisa do mesmo por HTTP. Este
// handler NÃO reimplementa seleção nem máquina de estados — delega a `eventServicesFor`
// (mesmo contrato do cron de lembretes).
//   GET    ?view=upcoming|historical|financial|all → projeções do domínio
//   POST   { type, title, date, ... }              → cria evento (draft)
//   PATCH  { id, action: complete|cancel|reopen }  → transição de estado (guardada)
//   DELETE ?id=                                     → exclui evento
import { NextResponse } from 'next/server'
import { authed, requiredId } from '@/lib/api/http'
import { ValidationError } from '@/lib/api/errors'
import { eventServicesFor, InvalidTransitionError, type EventDraft } from '@/lib/agenda/service'
import type { HealthEvent } from '@/lib/agenda/event'

export const GET = authed(async ({ supabase, userId, request }) => {
  const view = new URL(request.url).searchParams.get('view')
  const { query } = eventServicesFor(supabase)
  const events =
    view === 'upcoming'   ? await query.listUpcoming(userId)   :
    view === 'historical' ? await query.listHistorical(userId) :
    view === 'financial'  ? await query.listFinancial(userId)  :
                            await query.listAll(userId)
  return NextResponse.json({ events })
})

function parseDraft(body: unknown): EventDraft {
  const b = (body ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const type = str(b.type)
  const title = str(b.title)
  const date = str(b.date)
  if (!type || !title || !date) throw new ValidationError('Campos obrigatórios: type, title, date.')
  const status = str(b.status)
  return {
    type, title, date,
    time: str(b.time),
    status: (status ?? 'planejado') as HealthEvent['status'],
    notes: str(b.notes),
    modality: str(b.modality) as HealthEvent['modality'],
    professionalName: str(b.professionalName),
    professionalKind: str(b.professionalKind),
    establishment: str(b.establishment),
    location: str(b.location),
    amountCents: typeof b.amountCents === 'number' ? b.amountCents : null,
    directExpense: b.directExpense === true,
  }
}

export const POST = authed(async ({ supabase, userId, request }) => {
  const { command } = eventServicesFor(supabase)
  await command.create(userId, parseDraft(await request.json()))
  return NextResponse.json({ success: true })
})

export const PATCH = authed(async ({ supabase, userId, request }) => {
  const b = (await request.json()) as Record<string, unknown>
  const id = typeof b.id === 'string' ? b.id : ''
  const action = typeof b.action === 'string' ? b.action : ''
  if (!id) throw new ValidationError('Campo obrigatório: id.')
  const { query, command } = eventServicesFor(supabase)
  const event = (await query.listAll(userId)).find((e) => e.id === id)
  if (!event) throw new ValidationError('Evento não encontrado.')
  try {
    if (action === 'complete') await command.complete(userId, event)
    else if (action === 'cancel') await command.cancel(userId, event)
    else if (action === 'reopen') await command.reopen(userId, event)
    else throw new ValidationError('Ação inválida (complete | cancel | reopen).')
  } catch (e) {
    if (e instanceof InvalidTransitionError) throw new ValidationError(e.message)
    throw e
  }
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  const id = requiredId(request)
  const { query, command } = eventServicesFor(supabase)
  const event = (await query.listAll(userId)).find((e) => e.id === id)
  if (!event) throw new ValidationError('Evento não encontrado.')
  await command.remove(userId, event)
  return NextResponse.json({ success: true })
})
