// ============================================================
// SINTERA — Ciclo e Contracepção: serviço de domínio
// ============================================================
// Dono das tabelas PRÓPRIAS: contraceptive_methods e menstrual_periods.
// O LEMBRETE de troca NÃO é do Ciclo — é conceito da Agenda: o serviço apenas
// decide QUANDO lembrar (regra de negócio própria: ~30 dias antes da troca, nunca
// no passado) e delega o ciclo de vida do lembrete a services.command.syncReminder,
// guardando o id devolvido em contraceptive_methods.reminder_event_id.
//
// Base sobre a fundação (@/lib/api): CRUD/validação saem da página; consumido por
// UM caminho único (/api/ciclo → Web cookie + Mobile Bearer).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { fromTable, selectUserRows, updateUserRow, deleteUserRow } from '@/lib/api/db'
import { eventServicesFor } from '@/lib/agenda/service'
import { contraceptiveLabel } from '@/lib/cycle'

// ── Regras de data (QUANDO lembrar) — negócio do Ciclo ────────────────────────
function addMonths(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10)
}
function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10)
}
function todayISO(): string { return new Date().toISOString().slice(0, 10) }

export type MethodStatus = 'ativo' | 'encerrado'

export interface ContraceptiveMethod {
  id: string
  kind: string
  brand: string | null
  startedOn: string | null
  durationMonths: number | null
  replaceOn: string | null
  status: MethodStatus
  reminderEnabled: boolean
  reminderEventId: string | null
  notes: string | null
}

export interface Period {
  id: string
  startedOn: string
  notes: string | null
}

/** Entrada de criação/edição de método (a UI só informa dados factuais + querer lembrete). */
export interface MethodInput {
  id?: string | null
  kind: string
  brand?: string | null
  startedOn?: string | null
  durationMonths?: number | null
  reminder: boolean
  notes?: string | null
}

const METHODS = 'contraceptive_methods'
const METHOD_COLUMNS = 'id, kind, brand, started_on, duration_months, replace_on, status, reminder_enabled, reminder_event_id, notes'
const PERIODS = 'menstrual_periods'
const PERIOD_COLUMNS = 'id, started_on, notes'

interface MethodRow {
  id: string; kind: string | null; brand: string | null; started_on: string | null
  duration_months: number | null; replace_on: string | null; status: string | null
  reminder_enabled: boolean | null; reminder_event_id: string | null; notes: string | null
}
interface PeriodRow { id: string; started_on: string; notes: string | null }

function methodToDomain(r: MethodRow): ContraceptiveMethod {
  return {
    id: r.id, kind: r.kind ?? 'outro', brand: r.brand ?? null, startedOn: r.started_on ?? null,
    durationMonths: r.duration_months ?? null, replaceOn: r.replace_on ?? null,
    status: r.status === 'encerrado' ? 'encerrado' : 'ativo',
    reminderEnabled: r.reminder_enabled === true, reminderEventId: r.reminder_event_id ?? null, notes: r.notes ?? null,
  }
}

// ── Leitura ───────────────────────────────────────────────────────────────────

export async function listMethods(supabase: SupabaseClient, userId: string): Promise<ContraceptiveMethod[]> {
  const rows = await selectUserRows<MethodRow>(supabase, METHODS, userId, { columns: METHOD_COLUMNS, orderBy: 'created_at' })
  return rows.map(methodToDomain)
}

export async function listPeriods(supabase: SupabaseClient, userId: string): Promise<Period[]> {
  const rows = await selectUserRows<PeriodRow>(supabase, PERIODS, userId, { columns: PERIOD_COLUMNS, orderBy: 'started_on' })
  // A UI usa no máximo ~24; devolvemos todos e a tela limita.
  return rows.map(r => ({ id: r.id, startedOn: r.started_on, notes: r.notes ?? null }))
}

// ── Escrita: método + lembrete (lembrete delegado à Agenda) ───────────────────

/**
 * PURO — data desejada do lembrete de troca (regra do Ciclo) ou null quando não se
 * aplica: só com lembrete ligado, `replaceOn` presente e método != pílula. ~30 dias
 * antes da troca, nunca no passado. `today` injetável para teste determinístico.
 */
export function reminderDesired(
  input: MethodInput,
  replaceOn: string | null,
  today: string = todayISO(),
): { title: string; date: string } | null {
  const wants = input.reminder && !!replaceOn && input.kind !== 'pilula'
  if (!wants || !replaceOn) return null
  const raw = addDays(replaceOn, -30)
  const date = raw < today ? today : raw // nunca no passado
  return { title: `Trocar ${contraceptiveLabel(input.kind)}`, date }
}

export async function saveMethod(supabase: SupabaseClient, userId: string, input: MethodInput): Promise<void> {
  const months = input.durationMonths != null ? Math.round(input.durationMonths) : null
  const replaceOn = input.startedOn && months && input.kind !== 'pilula' ? addMonths(input.startedOn, months) : null
  const payload = {
    user_id: userId, kind: input.kind, brand: (input.brand ?? '').trim() || null,
    started_on: input.startedOn || null, duration_months: months, replace_on: replaceOn,
    notes: (input.notes ?? '').trim() || null, reminder_enabled: input.reminder && !!replaceOn,
  }

  // Persiste o método (id necessário para vincular o lembrete).
  let methodId: string
  let existingReminderId: string | null = null
  if (input.id) {
    const { data, error } = await fromTable(supabase, METHODS)
      .select('reminder_event_id').eq('id', input.id).eq('user_id', userId).single()
    if (error) throw new Error(error.message)
    existingReminderId = (data as { reminder_event_id: string | null } | null)?.reminder_event_id ?? null
    await updateUserRow(supabase, METHODS, userId, input.id, payload)
    methodId = input.id
  } else {
    const { data, error } = await fromTable(supabase, METHODS)
      .insert({ ...payload, status: 'ativo' }).select('id').single()
    if (error || !data) throw new Error(error?.message || 'Falha ao salvar o método.')
    methodId = (data as { id: string }).id
  }

  // Lembrete: conceito da Agenda. O Ciclo só decide o desejado e guarda o id.
  const reminderId = await eventServicesFor(supabase).command.syncReminder(userId, {
    existingId: existingReminderId, desired: reminderDesired(input, replaceOn),
  })
  if (reminderId !== existingReminderId) {
    await updateUserRow(supabase, METHODS, userId, methodId, { reminder_event_id: reminderId })
  }
}

export async function setMethodStatus(supabase: SupabaseClient, userId: string, id: string, status: MethodStatus): Promise<void> {
  // Ao encerrar, o lembrete perde sentido → limpa pelo domínio da Agenda.
  const { data } = await fromTable(supabase, METHODS)
    .select('reminder_event_id').eq('id', id).eq('user_id', userId).single()
  const reminderId = (data as { reminder_event_id: string | null } | null)?.reminder_event_id ?? null
  await updateUserRow(supabase, METHODS, userId, id, { status })
  if (status === 'encerrado' && reminderId) {
    await eventServicesFor(supabase).command.syncReminder(userId, { existingId: reminderId, desired: null })
    await updateUserRow(supabase, METHODS, userId, id, { reminder_event_id: null })
  }
}

export async function removeMethod(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  const { data } = await fromTable(supabase, METHODS)
    .select('reminder_event_id').eq('id', id).eq('user_id', userId).single()
  const reminderId = (data as { reminder_event_id: string | null } | null)?.reminder_event_id ?? null
  if (reminderId) await eventServicesFor(supabase).command.syncReminder(userId, { existingId: reminderId, desired: null })
  await deleteUserRow(supabase, METHODS, userId, id)
}

// ── Escrita: menstruação ──────────────────────────────────────────────────────

export async function addPeriod(supabase: SupabaseClient, userId: string, startedOn: string): Promise<void> {
  const date = (startedOn || '').trim() || todayISO()
  const { error } = await fromTable(supabase, PERIODS)
    .upsert({ user_id: userId, started_on: date }, { onConflict: 'user_id,started_on' })
  if (error) throw new Error(error.message)
}

export async function removePeriod(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  await deleteUserRow(supabase, PERIODS, userId, id)
}
