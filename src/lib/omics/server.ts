// ============================================================
// Helpers das APIs de Ômica (Fase 3 — serviços de consulta)
// ============================================================
// Separa armazenamento de visualização. Autenticação + utilitários comuns.
// As tabelas omics_* não estão nos tipos gerados → consultas usam cast `any`.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export const OMICS_DOMAINS = [
  'metabolomics', 'proteomics', 'microbiome', 'genetics', 'epigenetics', 'exposomics',
] as const

export type OmicsAuth =
  | { error: NextResponse; supabase: null; userId: null }
  | { error: null; supabase: SupabaseClient; userId: string }

export async function omicsAuth(): Promise<OmicsAuth> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }), supabase: null, userId: null }
  }
  return { error: null, supabase: supabase as unknown as SupabaseClient, userId: data.user.id }
}

/** Lê limit/offset da query com limites seguros (paginação / lazy-loading). */
export function pageParams(url: URL, defLimit = 50, maxLimit = 500): { limit: number; offset: number } {
  const l = parseInt(url.searchParams.get('limit') ?? '', 10)
  const o = parseInt(url.searchParams.get('offset') ?? '', 10)
  const limit = Number.isFinite(l) ? Math.min(Math.max(l, 1), maxLimit) : defLimit
  const offset = Number.isFinite(o) ? Math.max(o, 0) : 0
  return { limit, offset }
}

export function validDomain(d: string | null): string | null {
  return d && (OMICS_DOMAINS as readonly string[]).includes(d) ? d : null
}
