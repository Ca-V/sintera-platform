// @sintera/api-client — domínio Medicamentos/Suplementos (medications). CRUD clínico + estoque + compra. O
// LEMBRETE de recompra é Evento vinculado (EventLink 'medication', via agenda.syncReminder). RLS: dono.
// Leitura LANÇA; escrita retorna { data?/error }. FACTUAL (REG-001).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MedKind, MedStatus } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface MedicationDTO {
  id: string
  name: string
  kind: MedKind
  brand: string | null
  dose: string | null
  frequency: string | null
  pharmaceutical_form: string | null
  administration_route: string | null
  prescriber_name: string | null
  started_on: string | null
  until_date: string | null
  status: MedStatus
  notes: string | null
  acquired_quantity: number | null
  pack_quantity: number | null
  daily_consumption: number | null
  pack_unit: string | null
  purchased_on: string | null
  purchase_status: string | null
  amount_cents: number | null
  repurchase_reminder: boolean
  repurchase_frequency: string | null
  prescription_url: string | null   // D-13: anexo da receita (documento separado do produto)
}

export interface MedicationInput extends Partial<Omit<MedicationDTO, 'id' | 'name' | 'kind' | 'status'>> {
  id?: string
  name: string
  kind: MedKind
  status: MedStatus
}

const COLUMNS =
  'id, name, kind, brand, dose, frequency, pharmaceutical_form, administration_route, prescriber_name, started_on, until_date, status, notes, acquired_quantity, pack_quantity, daily_consumption, pack_unit, purchased_on, purchase_status, amount_cents, repurchase_reminder, repurchase_frequency, prescription_url' as const

/** Lista os medicamentos/suplementos do usuário. `[]` se não houver. LANÇA em falha. */
export async function listMedications(client: SupabaseClient, signal?: AbortSignal): Promise<MedicationDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('medications').select(COLUMNS)
      .eq('user_id', session.user.id).order('created_at', { ascending: false }).abortSignal(s)
    if (error) throw asError(error)
    return (data as MedicationDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

/** Cria (sem id) ou atualiza (com id). Retorna o id (para vincular o lembrete de recompra). NÃO lança. */
export async function saveMedication(client: SupabaseClient, input: MedicationInput): Promise<{ data: { id: string } | null; error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { data: null, error: new Error('Não autenticado') }
    if (!input.name?.trim()) return { data: null, error: new Error('Informe o nome') }
    const row: Record<string, unknown> = {
      user_id: session.user.id, name: input.name.trim(), kind: input.kind, status: input.status,
      brand: input.brand ?? null, dose: input.dose ?? null, frequency: input.frequency ?? null,
      pharmaceutical_form: input.pharmaceutical_form ?? null, administration_route: input.administration_route ?? null,
      prescriber_name: input.prescriber_name ?? null, started_on: input.started_on || null, until_date: input.until_date || null,
      notes: input.notes ?? null, acquired_quantity: input.acquired_quantity ?? null, pack_quantity: input.pack_quantity ?? null,
      daily_consumption: input.daily_consumption ?? null, pack_unit: input.pack_unit ?? null,
      purchased_on: input.purchased_on || null, purchase_status: input.purchase_status ?? null, amount_cents: input.amount_cents ?? null,
      repurchase_reminder: input.repurchase_reminder ?? false, repurchase_frequency: input.repurchase_reminder ? (input.repurchase_frequency ?? null) : null,
      prescription_url: input.prescription_url ?? null,
    }
    const table = client.from('medications')
    const q = input.id
      ? table.update(row as never).eq('id', input.id).eq('user_id', session.user.id).select('id').single()
      : table.insert(row as never).select('id').single()
    const { data, error } = await q
    if (error) return { data: null, error: asError(error) }
    return { data: { id: (data as { id: string } | null)?.id ?? input.id ?? '' }, error: null }
  } catch (e) {
    return { data: null, error: asError(e) }
  }
}

/** Exclui um medicamento (por id, dono via RLS). `{ error }`, NÃO lança. */
export async function deleteMedication(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('medications').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}
