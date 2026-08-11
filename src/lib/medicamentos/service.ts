// ============================================================
// SINTERA — Medicamentos e Suplementos: serviço de domínio
// ============================================================
// Dono da tabela PRÓPRIA `medications` e das REGRAS farmacológicas/logísticas
// (nextRepurchaseDate por consumo/frequência, forma, unidade, adesão…). Os EVENTOS
// que um medicamento origina NÃO são do Medicamentos — são da Agenda:
//   • recompra  → services.command.syncReminder (lembrete)
//   • compra    → services.command.syncEvent    (evento canônico, entra em Gastos/Histórico)
// O serviço decide QUANDO/SE cada evento existe (regra própria) e guarda o id devolvido.
//
// Base sobre a fundação (@/lib/api): CRUD/validação saem da página; consumido por
// UM caminho único (/api/medicamentos → Web cookie + Mobile Bearer).
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { fromTable, selectUserRows, updateUserRow, deleteUserRow } from '@/lib/api/db'
import { ValidationError } from '@/lib/api/http'
import { eventServicesFor } from '@/lib/agenda/service'
import { nextRepurchaseDate } from '@/lib/medications/repurchase'

// Helpers de parsing — idênticos aos da página (preservação de comportamento).
function num(s: string | null | undefined): number | null {
  const v = parseFloat((s ?? '').replace(',', '.'))
  return isFinite(v) && v > 0 ? v : null
}
function toCents(s: string | null | undefined): number | null {
  let t = (s ?? '').trim().replace(/[R$\s]/g, ''); if (!t) return null
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  const v = parseFloat(t); return isFinite(v) && v >= 0 ? Math.round(v * 100) : null
}

export type Kind = 'medicamento' | 'suplemento' | 'produto' | 'dispositivo' | 'outro'
export type MedStatus = 'em_uso' | 'programado' | 'suspenso' | 'encerrado'

/** Medicamento no formato de domínio (camelCase), consumido por UI e API. */
export interface Medication {
  id: string
  name: string; kind: Kind; brand: string | null; dose: string | null; frequency: string | null
  startedOn: string | null; untilOn: string | null; status: MedStatus; notes: string | null
  acquiredQty: number | null; packQty: number | null; dailyCons: number | null
  purchasedOn: string | null; purchaseStatus: string | null; amountCents: number | null
  repurchaseReminder: boolean; repurchaseFreq: string | null
  repurchaseEventId: string | null; purchaseEventId: string | null
  form: string | null; route: string | null; packUnit: string | null; prescriber: string | null
}

/** Entrada de criação/edição — a UI envia os campos crus (strings numéricas são parseadas aqui). */
export interface MedInput {
  id?: string | null
  name: string; kind: Kind; brand?: string | null; dose?: string | null; frequency?: string | null
  startedOn?: string | null; untilOn?: string | null; notes?: string | null; status: MedStatus
  acquiredQty?: string | null; packQty?: string | null; dailyCons?: string | null
  purchasedOn?: string | null; purchaseStatus?: string | null; amount?: string | null
  repurchase: boolean; repurchaseFreq?: string | null
  form?: string | null; route?: string | null; packUnit?: string | null; prescriber?: string | null
}

const TABLE = 'medications'
const COLUMNS =
  'id, name, kind, brand, dose, frequency, started_on, until_date, status, notes, acquired_quantity, ' +
  'pack_quantity, daily_consumption, purchased_on, purchase_status, amount_cents, repurchase_reminder, ' +
  'repurchase_frequency, repurchase_event_id, purchase_event_id, pharmaceutical_form, administration_route, ' +
  'pack_unit, prescriber_name'

const KINDS = new Set<string>(['medicamento', 'suplemento', 'produto', 'dispositivo', 'outro'])
const STATUSES = new Set<string>(['em_uso', 'programado', 'suspenso', 'encerrado'])
const toKind = (v: unknown): Kind => (typeof v === 'string' && KINDS.has(v) ? (v as Kind) : 'medicamento')
const toStatus = (v: unknown): MedStatus => (typeof v === 'string' && STATUSES.has(v) ? (v as MedStatus) : 'em_uso')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function medToDomain(r: any): Medication {
  return {
    id: r.id, name: r.name ?? '', kind: toKind(r.kind), brand: r.brand ?? null, dose: r.dose ?? null,
    frequency: r.frequency ?? null, startedOn: r.started_on ?? null, untilOn: r.until_date ?? null,
    status: toStatus(r.status), notes: r.notes ?? null,
    acquiredQty: r.acquired_quantity ?? null, packQty: r.pack_quantity ?? null, dailyCons: r.daily_consumption ?? null,
    purchasedOn: r.purchased_on ?? null, purchaseStatus: r.purchase_status ?? null, amountCents: r.amount_cents ?? null,
    repurchaseReminder: r.repurchase_reminder === true, repurchaseFreq: r.repurchase_frequency ?? null,
    repurchaseEventId: r.repurchase_event_id ?? null, purchaseEventId: r.purchase_event_id ?? null,
    form: r.pharmaceutical_form ?? null, route: r.administration_route ?? null,
    packUnit: r.pack_unit ?? null, prescriber: r.prescriber_name ?? null,
  }
}

/** PURO — valida e monta o payload de `medications` (regras idênticas à página). */
export function buildMedPayload(userId: string, input: MedInput) {
  const name = (input.name ?? '').trim()
  if (!name) throw new ValidationError('Informe o nome do medicamento.')
  const kind = toKind(input.kind)
  if ((kind === 'medicamento' || kind === 'suplemento') && !(input.form ?? '').trim()) {
    throw new ValidationError('Selecione a forma farmacêutica.')
  }
  const blank = (v: string | null | undefined) => ((v ?? '').trim() || null)
  return {
    user_id: userId,
    name, kind, brand: blank(input.brand), dose: blank(input.dose), frequency: blank(input.frequency),
    started_on: input.startedOn || null, until_date: input.untilOn || null, notes: blank(input.notes),
    acquired_quantity: num(input.acquiredQty), pack_quantity: num(input.packQty), daily_consumption: num(input.dailyCons),
    purchased_on: input.purchasedOn || null, purchase_status: input.purchaseStatus || null, amount_cents: toCents(input.amount),
    repurchase_reminder: input.repurchase, repurchase_frequency: input.repurchase ? blank(input.repurchaseFreq) : null,
    pharmaceutical_form: input.form || null, administration_route: input.route || null,
    pack_unit: blank(input.packUnit), prescriber_name: blank(input.prescriber), status: toStatus(input.status),
  }
}

// ── Leitura ───────────────────────────────────────────────────────────────────

export async function listMeds(supabase: SupabaseClient, userId: string): Promise<Medication[]> {
  const rows = await selectUserRows(supabase, TABLE, userId, { columns: COLUMNS, orderBy: 'created_at' })
  return rows.map(medToDomain)
}

// ── Escrita: medicamento + eventos (recompra=lembrete, compra=evento) ─────────

interface EventLinks { repurchase_event_id: string | null; purchase_event_id: string | null }

export async function saveMed(supabase: SupabaseClient, userId: string, input: MedInput): Promise<void> {
  const payload = buildMedPayload(userId, input)

  let medId: string
  let links: EventLinks = { repurchase_event_id: null, purchase_event_id: null }
  if (input.id) {
    const { data } = await fromTable(supabase, TABLE)
      .select('repurchase_event_id, purchase_event_id').eq('id', input.id).eq('user_id', userId).single()
    links = (data as EventLinks | null) ?? links
    await updateUserRow(supabase, TABLE, userId, input.id, { ...payload, updated_at: new Date().toISOString() })
    medId = input.id
  } else {
    const { data, error } = await fromTable(supabase, TABLE).insert(payload).select('id').single()
    if (error || !data) throw new Error(error?.message || 'Falha ao salvar o medicamento.')
    medId = (data as { id: string }).id
  }

  const { command } = eventServicesFor(supabase)

  // Recompra → LEMBRETE (Agenda). Data = regra do domínio Medicamentos.
  const rec = nextRepurchaseDate(input.purchasedOn || null, num(input.packQty), num(input.dailyCons), num(input.acquiredQty), input.repurchaseFreq || null)
  const wantsReminder = input.repurchase && payload.status === 'em_uso' && !!rec
  const reminderId = await command.syncReminder(userId, {
    existingId: links.repurchase_event_id,
    desired: wantsReminder && rec ? { title: `Recomprar: ${payload.name}`, date: rec } : null,
  })
  if (reminderId !== links.repurchase_event_id) {
    await updateUserRow(supabase, TABLE, userId, medId, { repurchase_event_id: reminderId })
  }

  // Compra → EVENTO CANÔNICO (Agenda) que alimenta Gastos/Histórico.
  const wantsPurchase = input.purchaseStatus === 'comprado' && !!input.purchasedOn
  const evType = payload.kind === 'medicamento' ? 'medicamento' : payload.kind === 'suplemento' ? 'suplemento' : 'outro'
  const purchaseId = await command.syncEvent(userId, {
    existingId: links.purchase_event_id,
    draft: wantsPurchase && input.purchasedOn
      ? { type: evType, title: `Compra: ${payload.name}`, date: input.purchasedOn, status: 'realizado', source: 'system', directExpense: true, amountCents: toCents(input.amount) }
      : null,
  })
  if (purchaseId !== links.purchase_event_id) {
    await updateUserRow(supabase, TABLE, userId, medId, { purchase_event_id: purchaseId })
  }
}

export async function removeMed(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  const { data } = await fromTable(supabase, TABLE)
    .select('repurchase_event_id, purchase_event_id').eq('id', id).eq('user_id', userId).single()
  const links = (data as EventLinks | null) ?? { repurchase_event_id: null, purchase_event_id: null }
  const { command } = eventServicesFor(supabase)
  if (links.repurchase_event_id) await command.syncReminder(userId, { existingId: links.repurchase_event_id, desired: null })
  if (links.purchase_event_id) await command.syncEvent(userId, { existingId: links.purchase_event_id, draft: null })
  await deleteUserRow(supabase, TABLE, userId, id)
}
