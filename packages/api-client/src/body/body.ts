// @sintera/api-client — Composição Corporal (body_metrics): série temporal autorrelatada + meta de peso (GLP-1,
// em profiles.weight_goal_kg). Regras/sumarização vêm do @sintera/core. RLS: dono. Leitura LANÇA; escrita { error }.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { BodyMetric } from '@sintera/core'
import { measurementInstant } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface BodyMetricDTO {
  id: string
  metric: BodyMetric
  label: string | null
  value_text: string
  unit: string | null
  measured_on: string
  /** Instante da medição (UTC). Distingue duas leituras do MESMO dia — o diário de pressão (HIP-014 §2). */
  measured_at: string | null
  notes: string | null
  exam_id: string | null
  source: string | null
  created_at: string | null
}

export interface BodyMetricInput {
  id?: string
  metric: BodyMetric
  label?: string | null
  value_text: string
  unit?: string | null
  measured_on: string
  /** Hora da medição. Ausente = não informada; grava a âncora do dia (ver `measurementInstant`). */
  measured_at?: string | null
  notes?: string | null
  exam_id?: string | null
  source?: string | null
}

const COLUMNS = 'id, metric, label, value_text, unit, measured_on, measured_at, notes, exam_id, source, created_at' as const

export async function listBodyMetrics(client: SupabaseClient, signal?: AbortSignal): Promise<BodyMetricDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    // Ordena pelo INSTANTE — sem isso duas leituras do mesmo dia (manhã e noite) saem em ordem indefinida.
    // `measured_on` fica como desempate para linhas anteriores à migração 148, que não têm hora.
    const { data, error } = await client.from('body_metrics').select(COLUMNS)
      .eq('user_id', session.user.id)
      .order('measured_at', { ascending: false, nullsFirst: false })
      .order('measured_on', { ascending: false })
      .abortSignal(s)
    if (error) throw asError(error)
    return (data as BodyMetricDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

export async function saveBodyMetric(client: SupabaseClient, input: BodyMetricInput): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    if (!input.value_text?.trim() || !input.measured_on) return { error: new Error('Informe valor e data') }
    const row: Record<string, unknown> = {
      user_id: session.user.id, metric: input.metric, label: input.label?.trim() || null,
      value_text: input.value_text.trim(), unit: input.unit?.trim() || null, measured_on: input.measured_on,
      // Hora informada quando existe; senão a âncora do dia (00:00Z), que é como a migração 148 marcou
      // "hora não registrada". Nunca inventa um horário plausível — meia-noite é declaradamente um marcador.
      measured_at: measurementInstant(input.measured_at, input.measured_on),
      notes: input.notes?.trim() || null, exam_id: input.exam_id || null, source: input.source || 'manual',
    }
    const table = client.from('body_metrics')
    const { error } = input.id
      ? await table.update(row as never).eq('id', input.id).eq('user_id', session.user.id)
      : await table.insert(row as never)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

export async function deleteBodyMetric(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('body_metrics').delete().eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Altura (cm) do perfil — base do IMC calculado (peso÷altura²). `null` se ausente. LANÇA em falha.
 *  Vive aqui (domínio Composição), não no contrato Perfil, que não expõe campos de composição (MOBILE-019). */
export async function getHeightCm(client: SupabaseClient, signal?: AbortSignal): Promise<number | null> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('profiles').select('height_cm').eq('id', session.user.id).abortSignal(s).maybeSingle()
    if (error) throw asError(error)
    const h = (data as { height_cm: number | null } | null)?.height_cm
    return h != null ? Number(h) : null
  } finally {
    cleanup()
  }
}

/** Meta de peso (GLP-1) — profiles.weight_goal_kg. `null` se não definida. LANÇA em falha. */
export async function getWeightGoal(client: SupabaseClient, signal?: AbortSignal): Promise<number | null> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('profiles').select('weight_goal_kg').eq('id', session.user.id).abortSignal(s).maybeSingle()
    if (error) throw asError(error)
    const g = (data as { weight_goal_kg: number | null } | null)?.weight_goal_kg
    return g != null ? Number(g) : null
  } finally {
    cleanup()
  }
}

/** Define/limpa a meta de peso. `{ error }`, NÃO lança. */
export async function setWeightGoal(client: SupabaseClient, kg: number | null): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('profiles').update({ weight_goal_kg: kg } as never).eq('id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}
