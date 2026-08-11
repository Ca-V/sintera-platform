// Rota ÚNICA de Sinais vitais — Web (cookie) e Mobile (Bearer) pelo mesmo caminho
// (getAuthedSupabase). Lógica em @/lib/sinais-vitais/service (escopada a body_metrics
// ∩ VITALS). Sem edição (paridade com a UI): só listar/criar/remover.
//   GET    /api/sinais-vitais        → lista os sinais vitais da usuária
//   POST   /api/sinais-vitais        → cria { metric, value, measuredOn, unit?, label?, notes? }
//   DELETE /api/sinais-vitais?id=<id> → remove
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedSupabase } from '@/lib/supabase/authedClient'
import {
  listVitals,
  createVital,
  removeVital,
  VitalValidationError,
  type Vital,
  type VitalInput,
} from '@/lib/sinais-vitais/service'

function parseInput(body: unknown): VitalInput {
  const b = (body ?? {}) as Record<string, unknown>
  return {
    metric: (typeof b.metric === 'string' ? b.metric : 'outro_sinal') as Vital,
    value: typeof b.value === 'string' ? b.value : '',
    unit: typeof b.unit === 'string' ? b.unit : null,
    label: typeof b.label === 'string' ? b.label : null,
    measuredOn: typeof b.measuredOn === 'string' ? b.measuredOn : '',
    notes: typeof b.notes === 'string' ? b.notes : null,
  }
}

function fail(err: unknown): NextResponse {
  if (err instanceof VitalValidationError) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }
  const message = err instanceof Error ? err.message : String(err)
  return NextResponse.json({ error: 'Falha ao processar o sinal vital.', detail: message.slice(0, 300) }, { status: 500 })
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const vitals = await listVitals(supabase, user.id)
    return NextResponse.json({ vitals })
  } catch (err) {
    return fail(err)
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    await createVital(supabase, user.id, parseInput(await request.json()))
    return NextResponse.json({ success: true })
  } catch (err) {
    return fail(err)
  }
}

export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 })
  try {
    await removeVital(supabase, user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return fail(err)
  }
}
