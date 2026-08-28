// @sintera/api-client — Sessões de Atividade Física (activity_sessions, migração 149). Regras/apresentação vêm
// do @sintera/core. RLS: dono (auth.uid() = user_id). Leitura LANÇA; escrita devolve { error }.
//
// PROVENIÊNCIA É OBRIGATÓRIA (HIP-014 §4): `source` é NOT NULL no banco e obrigatório aqui. Uma sessão sem
// origem não é registrável — a plataforma nunca funde séries de fontes diferentes nem escolhe entre elas em
// silêncio, e para isso precisa saber de onde cada uma veio.
import type { SupabaseClient } from '@supabase/supabase-js'
import { durationFromWindow } from '@sintera/core'
import { withTimeout } from '../net/timeout'
import { asError } from '../net/errors'

export interface ActivitySessionDTO {
  id: string
  source: string
  external_id: string | null
  connector_version: string | null
  activity_type: string
  title: string | null
  started_at: string
  ended_at: string | null
  duration_s: number | null
  distance_m: number | null
  elevation_gain_m: number | null
  active_energy_kcal: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  steps: number | null
  notes: string | null
  created_at: string | null
}

export interface ActivitySessionInput {
  id?: string
  /** De onde veio. 'manual' quando a pessoa registra; o id da fonte quando vem de conector. */
  source: string
  /** Id da sessão NA FONTE. Base da idempotência do re-sync (ver `ingestActivitySessions`). */
  external_id?: string | null
  /** Versão do conector que produziu a sessão — auditoria e reprodutibilidade. */
  connector_version?: string | null
  activity_type: string
  title?: string | null
  started_at: string
  ended_at?: string | null
  /** Ausente = deriva da janela quando ela for coerente; senão fica nulo. Nunca vira zero. */
  duration_s?: number | null
  distance_m?: number | null
  elevation_gain_m?: number | null
  active_energy_kcal?: number | null
  avg_heart_rate?: number | null
  max_heart_rate?: number | null
  steps?: number | null
  notes?: string | null
}

const COLUMNS = 'id, source, external_id, connector_version, activity_type, title, started_at, ended_at, duration_s, distance_m, elevation_gain_m, active_energy_kcal, avg_heart_rate, max_heart_rate, steps, notes, created_at' as const

/** Sessões da pessoa, da mais recente para a mais antiga. */
export async function listActivitySessions(client: SupabaseClient, signal?: AbortSignal): Promise<ActivitySessionDTO[]> {
  const { signal: s, cleanup } = withTimeout(signal)
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) throw new Error('Não autenticado')
    const { data, error } = await client.from('activity_sessions').select(COLUMNS)
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false })
      .abortSignal(s)
    if (error) throw asError(error)
    return (data as ActivitySessionDTO[] | null) ?? []
  } finally {
    cleanup()
  }
}

export async function saveActivitySession(client: SupabaseClient, input: ActivitySessionInput): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    if (!input.started_at) return { error: new Error('Informe quando a atividade começou') }
    if (!input.source?.trim()) return { error: new Error('Toda sessão precisa declarar a origem') }

    const row: Record<string, unknown> = {
      user_id: session.user.id,
      source: input.source.trim(),
      // Aceitos porque o tipo os declara: descartá-los aqui seria perda silenciosa.
      external_id: input.external_id ?? null,
      connector_version: input.connector_version ?? null,
      activity_type: input.activity_type?.trim() || 'outro',
      title: input.title?.trim() || null,
      started_at: input.started_at,
      ended_at: input.ended_at || null,
      // Deriva da janela só quando ela é coerente. Ausência permanece ausência — ver HIP-014 §3.
      duration_s: input.duration_s ?? durationFromWindow(input.started_at, input.ended_at),
      distance_m: input.distance_m ?? null,
      elevation_gain_m: input.elevation_gain_m ?? null,
      active_energy_kcal: input.active_energy_kcal ?? null,
      avg_heart_rate: input.avg_heart_rate ?? null,
      max_heart_rate: input.max_heart_rate ?? null,
      steps: input.steps ?? null,
      notes: input.notes?.trim() || null,
    }
    const table = client.from('activity_sessions')
    const { error } = input.id
      ? await table.update(row as never).eq('id', input.id).eq('user_id', session.user.id)
      : await table.insert(row as never)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Resultado da ingestão de um lote vindo de conector. */
export interface IngestResult {
  recebidas: number
  gravadas: number
  jaExistiam: number
}

/**
 * Ingestão IDEMPOTENTE de sessões vindas de conector (HIP-014 §5). Rodar duas vezes com o mesmo lote produz o
 * mesmo estado final — requisito do re-sync, que sempre reprocessa uma janela sobreposta.
 *
 * POR QUE NÃO É UM `upsert`: a idempotência no banco vive em índices únicos PARCIAIS
 * (`uq_activity_sessions_external` só vale quando `external_id is not null`). O `ON CONFLICT` do PostgREST não
 * aceita o predicado do índice parcial, então um upsert falharia com "no unique or exclusion constraint
 * matching". Fazer a deduplicação por leitura prévia funciona com o schema como ele é, sem migração nova, e é o
 * mesmo padrão já usado em `replaceBodyMetricPoints`.
 *
 * PRESERVA o que já existe em vez de reescrever: uma sessão já gravada não é tocada. Reinserir mudaria
 * `created_at` e quebraria o "novo desde a última visita" (NOV-001).
 */
export async function ingestActivitySessions(
  client: SupabaseClient,
  drafts: readonly ActivitySessionInput[],
): Promise<{ result: IngestResult; error: Error | null }> {
  const vazio: IngestResult = { recebidas: drafts.length, gravadas: 0, jaExistiam: 0 }
  try {
    if (drafts.length === 0) return { result: vazio, error: null }
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { result: vazio, error: new Error('Não autenticado') }
    const userId = session.user.id

    // Chave de identidade DENTRO de uma fonte: o id externo quando existe; senão o instante de início.
    // Espelha exatamente os dois índices únicos da migração 149.
    const chave = (d: { source: string; external_id?: string | null; started_at: string }) =>
      d.external_id ? `e|${d.source}|${d.external_id}` : `t|${d.source}|${d.started_at}`

    const fontes = [...new Set(drafts.map(d => d.source))]
    const { data, error } = await client.from('activity_sessions')
      .select('source, external_id, started_at')
      .eq('user_id', userId)
      .in('source', fontes)
    if (error) return { result: vazio, error: asError(error) }

    const existentes = new Set(
      ((data ?? []) as { source: string; external_id: string | null; started_at: string }[]).map(chave),
    )

    // Deduplica também DENTRO do lote: a mesma janela pode trazer a sessão repetida.
    const novas: ActivitySessionInput[] = []
    const vistas = new Set<string>()
    for (const d of drafts) {
      const k = chave(d)
      if (existentes.has(k) || vistas.has(k)) continue
      vistas.add(k)
      novas.push(d)
    }

    const jaExistiam = drafts.length - novas.length
    if (novas.length === 0) return { result: { recebidas: drafts.length, gravadas: 0, jaExistiam }, error: null }

    const linhas = novas.map(d => ({
      user_id: userId,
      source: d.source.trim(),
      external_id: d.external_id ?? null,
      connector_version: d.connector_version ?? null,
      activity_type: d.activity_type?.trim() || 'outro',
      title: d.title?.trim() || null,
      started_at: d.started_at,
      ended_at: d.ended_at || null,
      duration_s: d.duration_s ?? durationFromWindow(d.started_at, d.ended_at),
      distance_m: d.distance_m ?? null,
      elevation_gain_m: d.elevation_gain_m ?? null,
      active_energy_kcal: d.active_energy_kcal ?? null,
      avg_heart_rate: d.avg_heart_rate ?? null,
      max_heart_rate: d.max_heart_rate ?? null,
      steps: d.steps ?? null,
      notes: d.notes?.trim() || null,
    }))

    const ins = await client.from('activity_sessions').insert(linhas as never)
    if (ins.error) return { result: { recebidas: drafts.length, gravadas: 0, jaExistiam }, error: asError(ins.error) }
    return { result: { recebidas: drafts.length, gravadas: linhas.length, jaExistiam }, error: null }
  } catch (e) {
    return { result: vazio, error: asError(e) }
  }
}

export async function deleteActivitySession(client: SupabaseClient, id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session) return { error: new Error('Não autenticado') }
    const { error } = await client.from('activity_sessions').delete()
      .eq('id', id).eq('user_id', session.user.id)
    return { error: error ? asError(error) : null }
  } catch (e) {
    return { error: asError(e) }
  }
}
