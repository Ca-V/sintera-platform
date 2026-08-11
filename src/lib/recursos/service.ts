// ============================================================
// SINTERA — Recursos de Saúde: serviço de domínio
// ============================================================
// Recursos que a pessoa USA (correção visual, dispositivos, próteses, auxílios,
// compressão). Modelo próprio `health_resources`; o detalhe do sub-tipo vive em
// `attributes` (jsonb). Registro factual — a SINTERA organiza, não interpreta.
//
// Base sobre a fundação (@/lib/api): CRUD/validação saem da página para cá,
// consumidos por UM caminho único (/api/recursos → Web cookie + Mobile Bearer).
// O upload/scan da foto é storage (não CRUD) e permanece no cliente.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { selectUserRows, insertRows, updateUserRow, deleteUserRow } from '@/lib/api/db'
import { ValidationError } from '@/lib/api/errors'

export type ResourceType =
  | 'correcao_visual' | 'dispositivo_medico' | 'protese_ortese' | 'auxilio' | 'compressao_suporte'
export type ResourceStatus = 'em_uso' | 'suspenso' | 'encerrado'

const TYPE_SET = new Set<string>([
  'correcao_visual', 'dispositivo_medico', 'protese_ortese', 'auxilio', 'compressao_suporte',
])
const STATUS_SET = new Set<string>(['em_uso', 'suspenso', 'encerrado'])
function toType(v: unknown): ResourceType {
  return typeof v === 'string' && TYPE_SET.has(v) ? (v as ResourceType) : 'dispositivo_medico'
}
function toStatus(v: unknown): ResourceStatus {
  return typeof v === 'string' && STATUS_SET.has(v) ? (v as ResourceStatus) : 'em_uso'
}

/** Recurso no formato de domínio (camelCase), consumido por UI e API. */
export interface Resource {
  id: string
  resourceType: ResourceType
  name: string
  brand: string | null
  prescriber: string | null
  startedOn: string | null
  untilDate: string | null
  status: ResourceStatus
  notes: string | null
  fileUrl: string | null
  attributes: Record<string, unknown>
}

/** Entrada de criação/edição vinda da UI/API. `attributes` já montado pela UI. */
export interface ResourceInput {
  resourceType: ResourceType
  name: string
  brand?: string | null
  prescriber?: string | null
  startedOn?: string | null
  untilDate?: string | null
  status: ResourceStatus
  notes?: string | null
  fileUrl?: string | null
  attributes?: Record<string, unknown>
}

const TABLE = 'health_resources'
const COLUMNS =
  'id, resource_type, name, brand, prescriber, started_on, until_date, status, notes, file_url, attributes'

interface ResourceRow {
  id: string
  resource_type: string | null
  name: string | null
  brand: string | null
  prescriber: string | null
  started_on: string | null
  until_date: string | null
  status: string | null
  notes: string | null
  file_url: string | null
  attributes: Record<string, unknown> | null
}

interface ResourcePayload {
  user_id: string
  resource_type: ResourceType
  name: string
  brand: string | null
  prescriber: string | null
  started_on: string | null
  until_date: string | null
  status: ResourceStatus
  notes: string | null
  file_url: string | null
  attributes: Record<string, unknown>
}

function toDomain(r: ResourceRow): Resource {
  return {
    id: r.id,
    resourceType: toType(r.resource_type),
    name: r.name ?? '',
    brand: r.brand ?? null,
    prescriber: r.prescriber ?? null,
    startedOn: r.started_on ?? null,
    untilDate: r.until_date ?? null,
    status: toStatus(r.status),
    notes: r.notes ?? null,
    fileUrl: r.file_url ?? null,
    attributes: r.attributes ?? {},
  }
}

/**
 * PURO — valida e normaliza (regras idênticas ao comportamento anterior da página):
 * `name` obrigatório (trim); strings/datas vazias viram null; `attributes` passa como veio.
 */
export function buildResourcePayload(userId: string, input: ResourceInput): ResourcePayload {
  const name = (input.name ?? '').trim()
  if (!name) throw new ValidationError('Informe o nome do recurso.')
  const blank = (v: string | null | undefined) => ((v ?? '').trim() || null)
  return {
    user_id: userId,
    resource_type: toType(input.resourceType),
    name,
    brand: blank(input.brand),
    prescriber: blank(input.prescriber),
    started_on: blank(input.startedOn),
    until_date: blank(input.untilDate),
    status: toStatus(input.status),
    notes: blank(input.notes),
    file_url: blank(input.fileUrl),
    attributes: input.attributes ?? {},
  }
}

// ── Repositório (I/O) — pela fundação (helpers escopados por usuária) ─────────

export async function listResources(supabase: SupabaseClient, userId: string): Promise<Resource[]> {
  const rows = await selectUserRows<ResourceRow>(supabase, TABLE, userId, { columns: COLUMNS, orderBy: 'created_at' })
  return rows.map(toDomain)
}

export async function createResource(supabase: SupabaseClient, userId: string, input: ResourceInput): Promise<void> {
  await insertRows(supabase, TABLE, [buildResourcePayload(userId, input)])
}

export async function updateResource(supabase: SupabaseClient, userId: string, id: string, input: ResourceInput): Promise<void> {
  await updateUserRow(supabase, TABLE, userId, id, buildResourcePayload(userId, input))
}

export async function removeResource(supabase: SupabaseClient, userId: string, id: string): Promise<void> {
  await deleteUserRow(supabase, TABLE, userId, id)
}
