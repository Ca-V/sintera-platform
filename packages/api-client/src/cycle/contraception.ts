// @sintera/api-client — Contracepção (contraceptive_methods). CRUD + lembrete de troca/recompra reproduzindo
// EXATAMENTE o mecanismo da Web (evento em `agenda_events` do tipo 'contracepcao' + FK reminder_event_id) —
// mesma tabela/contrato dos dois lados, sem divergência. Regras/datas do @sintera/core (fonte única). RLS: dono.
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  contraceptiveNature, defaultCadenceFor, cadenceDays, contraceptiveLabel,
  addMonthsISO, addDaysISO, nextOccurrenceByDaysISO,
} from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface ContraceptiveDTO {
  id: string
  kind: string
  brand: string | null
  started_on: string | null
  duration_months: number | null
  replace_on: string | null
  status: string
  reminder_enabled: boolean
  reminder_event_id: string | null
  notes: string | null
  usage_cadence: string | null
}

export interface ContraceptiveInput {
  id?: string
  kind: string
  brand?: string | null
  startedOn?: string | null
  durationMonths?: string | null  // dispositivo: vida útil (meses, texto)
  cadence?: string | null         // hormonal: cadência
  reminder: boolean
  notes?: string | null
  reminderEventId?: string | null // do registro em edição (para gerir o evento existente)
}

const COLUMNS = 'id, kind, brand, started_on, duration_months, replace_on, status, reminder_enabled, reminder_event_id, notes, usage_cadence' as const

export async function listContraceptives(client: SupabaseClient, signal?: AbortSignal): Promise<ContraceptiveDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('contraceptive_methods').select(COLUMNS)
      .eq('user_id', session.user.id).order('created_at', { ascending: false }).abortSignal(s)
    if (error) throw asError(error)
    return (data as ContraceptiveDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/** Cria/atualiza um método + gere o lembrete (agenda_events). Reproduz a regra da Web. NÃO lança. */
export async function saveContraceptive(client: SupabaseClient, input: ContraceptiveInput): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const uid = session.user.id
    const kind = input.kind
    const isHormonal = contraceptiveNature(kind) === 'hormonal'
    const today = new Date().toISOString().slice(0, 10)

    const months = !isHormonal && (input.durationMonths ?? '').trim() ? Math.round(Number(input.durationMonths)) : null
    const cadValue = isHormonal ? (input.cadence || defaultCadenceFor(kind) || 'mensal') : null
    const cadDays = isHormonal ? (cadenceDays(cadValue) ?? 30) : null
    const started = input.startedOn || null
    const replaceOn = isHormonal
      ? (cadDays ? nextOccurrenceByDaysISO(started || today, cadDays, today) : null)
      : (started && months ? addMonthsISO(started, months) : null)

    const payload: Record<string, unknown> = {
      user_id: uid, kind, brand: input.brand?.trim() || null, started_on: started,
      duration_months: months, replace_on: replaceOn, notes: input.notes?.trim() || null,
      usage_cadence: cadValue, reminder_enabled: input.reminder && !!replaceOn,
    }

    const table = client.from('contraceptive_methods')
    const { data, error } = input.id
      ? await table.update(payload as never).eq('id', input.id).eq('user_id', uid).select('id').single()
      : await table.insert({ ...payload, status: 'ativo' } as never).select('id').single()
    if (error || !data) return { error: asError(error ?? new Error('Falha ao salvar.')) }
    const methodId = (data as { id: string }).id

    // Lembrete (nunca no passado): dispositivo ~30 dias antes da troca; hormonal ~3 dias antes da recompra.
    const leadDays = isHormonal ? 3 : 30
    const wantReminder = input.reminder && !!replaceOn
    const reminderDate = replaceOn ? (() => { const d = addDaysISO(replaceOn, -leadDays); return d < today ? today : d })() : null
    const existingEvent = input.reminderEventId ?? null
    const ev = client.from('agenda_events')
    if (wantReminder && reminderDate) {
      const title = isHormonal ? `Recomprar/aplicar ${contraceptiveLabel(kind)}` : `Trocar ${contraceptiveLabel(kind)}`
      if (existingEvent) {
        await ev.update({ title, event_date: reminderDate, status: 'pending', reminder_enabled: true, reminder_sent_at: null } as never).eq('id', existingEvent)
      } else {
        const { data: created } = await ev.insert({ user_id: uid, event_type: 'contracepcao', title, event_date: reminderDate, status: 'pending', reminder_enabled: true } as never).select('id').single()
        const evId = (created as { id: string } | null)?.id
        if (evId) await table.update({ reminder_event_id: evId } as never).eq('id', methodId)
      }
    } else if (existingEvent) {
      await ev.delete().eq('id', existingEvent)
      await table.update({ reminder_event_id: null } as never).eq('id', methodId)
    }
    return { error: null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Alterna ativo↔encerrado; ao encerrar, remove o lembrete. NÃO lança. */
export async function toggleContraceptiveStatus(client: SupabaseClient, m: ContraceptiveDTO): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const next = m.status === 'ativo' ? 'encerrado' : 'ativo'
    const table = client.from('contraceptive_methods')
    const { error } = await table.update({ status: next } as never).eq('id', m.id).eq('user_id', session.user.id)
    if (error) return { error: asError(error) }
    if (next === 'encerrado' && m.reminder_event_id) {
      await client.from('agenda_events').delete().eq('id', m.reminder_event_id)
      await table.update({ reminder_event_id: null } as never).eq('id', m.id)
    }
    return { error: null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Remove o método (e o lembrete vinculado). NÃO lança. */
export async function deleteContraceptive(client: SupabaseClient, m: ContraceptiveDTO): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    if (m.reminder_event_id) await client.from('agenda_events').delete().eq('id', m.reminder_event_id)
    const { error } = await client.from('contraceptive_methods').delete().eq('id', m.id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}
