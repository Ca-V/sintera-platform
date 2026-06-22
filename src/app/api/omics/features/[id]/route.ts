// GET /api/omics/features/:id — entidade canônica do catálogo + proveniência.
// Catálogo é global (legível por autenticados). Sem interpretação clínica.
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth } from '@/lib/omics/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase } = await omicsAuth()
  if (error) return error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data: feature } = await db.from('omics_catalog')
    .select('id, domain, category_id, canonical_name, description, unit_default, curation_status, version, source, omics_categories(name, display_order)')
    .eq('id', id).maybeSingle()
  if (!feature) return NextResponse.json({ error: 'Feature não encontrada' }, { status: 404 })

  const [{ data: aliases }, { data: refs }] = await Promise.all([
    db.from('omics_aliases').select('alias, source').eq('catalog_id', id).order('alias'),
    db.from('omics_external_references').select('source, external_id, url').eq('catalog_id', id).order('source'),
  ])

  return NextResponse.json({
    feature: {
      id: feature.id, domain: feature.domain, canonical_name: feature.canonical_name,
      category: feature.omics_categories?.name ?? null, category_id: feature.category_id,
      description: feature.description, unit_default: feature.unit_default,
      curation_status: feature.curation_status, version: feature.version, source: feature.source,
    },
    aliases: aliases ?? [],
    external_references: refs ?? [],
  })
}
