// GET /api/omics/search?q=&domain=
// Busca no catálogo. `resolved` = entidade canônica resolvida por identidade
// exata (id externo / nome canônico / alias) via omics_resolve_feature.
// `matches` = busca textual (nome canônico + aliases). Catálogo global.
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth, validDomain } from '@/lib/omics/server'

const SELECT = 'id, domain, category_id, canonical_name, unit_default, curation_status, omics_categories(name)'

export async function GET(req: NextRequest) {
  const { error, supabase } = await omicsAuth()
  if (error) return error
  const url = new URL(req.url)
  const term = (url.searchParams.get('q') ?? '').trim()
  const domain = validDomain(url.searchParams.get('domain'))
  if (!term) return NextResponse.json({ resolved: null, matches: [] })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Resolução de identidade exata (nome/alias precisam de domínio; id externo não).
  let resolvedId: string | null = null
  const { data: rid } = await db.rpc('omics_resolve_feature', { p_domain: domain ?? 'metabolomics', p_term: term })
  if (typeof rid === 'string') resolvedId = rid

  // Busca textual: nome canônico + aliases.
  let cq = db.from('omics_catalog').select(SELECT).ilike('canonical_name', `%${term}%`)
  if (domain) cq = cq.eq('domain', domain)
  const aliasQ = db.from('omics_aliases').select('catalog_id').ilike('alias', `%${term}%`).limit(50)
  const [{ data: byName }, { data: aliasRows }] = await Promise.all([cq.limit(25), aliasQ])

  const aliasIds = [...new Set(((aliasRows ?? []) as Array<{ catalog_id: string }>).map(a => a.catalog_id))]
  let byAlias: unknown[] = []
  if (aliasIds.length) {
    const { data } = await db.from('omics_catalog').select(SELECT).in('id', aliasIds).limit(25)
    byAlias = data ?? []
  }

  // Mescla únicos.
  const seen = new Set<string>()
  const matches = [...(byName ?? []), ...byAlias].filter((m) => {
    const id = (m as { id: string }).id
    if (seen.has(id)) return false
    seen.add(id); return true
  }).slice(0, 25)

  let resolved = null
  if (resolvedId) {
    const { data } = await db.from('omics_catalog').select(SELECT).eq('id', resolvedId).maybeSingle()
    resolved = data ?? null
  }

  return NextResponse.json({ resolved, matches })
}
