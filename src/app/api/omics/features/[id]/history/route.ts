// GET /api/omics/features/:id/history — histórico longitudinal de uma feature
// para a usuária (resultados ao longo dos painéis/datas). APENAS visualização
// factual — sem "melhorou/piorou/normalizou/sugere".
import { NextRequest, NextResponse } from 'next/server'
import { omicsAuth } from '@/lib/omics/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, supabase, userId } = await omicsAuth()
  if (error) return error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error: e } = await (supabase as any).from('omics_results')
    .select('panel_id, feature_name, value, unit, raw_value, detection_status, method, measured_on, created_at, omics_panels(domain, laboratory, technology)')
    .eq('user_id', userId).eq('feature_id', id)
    .order('measured_on', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: true })

  if (e) return NextResponse.json({ error: e.message }, { status: 500 })

  const history = ((data ?? []) as Array<Record<string, unknown>>).map(r => ({
    measured_on: r.measured_on ?? null,
    value: r.value ?? null,
    unit: r.unit ?? null,
    raw_value: r.raw_value ?? null,
    detection_status: r.detection_status ?? null,
    method: r.method ?? null,
    panel_id: r.panel_id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    laboratory: (r.omics_panels as any)?.laboratory ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    domain: (r.omics_panels as any)?.domain ?? null,
  }))

  return NextResponse.json({ feature_id: id, history })
}
