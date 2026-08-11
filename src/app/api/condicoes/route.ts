// Rota ÚNICA de Condições de Saúde — Web (cookie) e Mobile (Bearer) pelo mesmo
// caminho (getAuthedSupabase, ponte ADR-020). A lógica vive em @/lib/condicoes/service;
// aqui só há transporte HTTP + autenticação. Registro factual, sem juízo clínico.
//   GET    /api/condicoes        → lista as condições da usuária
//   POST   /api/condicoes        → cria { scope, name, relative?, sinceLabel?, notes? }
//   PATCH  /api/condicoes        → edita { id, ...campos }
//   DELETE /api/condicoes?id=<id> → remove
import { NextRequest, NextResponse } from 'next/server'
import { getAuthedSupabase } from '@/lib/supabase/authedClient'
import {
  listConditions,
  createCondition,
  updateCondition,
  removeCondition,
  ConditionValidationError,
  type ConditionInput,
} from '@/lib/condicoes/service'

function parseInput(body: unknown): ConditionInput {
  const b = (body ?? {}) as Record<string, unknown>
  return {
    scope: b.scope === 'familiar' ? 'familiar' : 'propria',
    name: typeof b.name === 'string' ? b.name : '',
    relative: typeof b.relative === 'string' ? b.relative : null,
    sinceLabel: typeof b.sinceLabel === 'string' ? b.sinceLabel : null,
    notes: typeof b.notes === 'string' ? b.notes : null,
  }
}

function fail(err: unknown): NextResponse {
  if (err instanceof ConditionValidationError) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }
  const message = err instanceof Error ? err.message : String(err)
  return NextResponse.json({ error: 'Falha ao processar a condição.', detail: message.slice(0, 300) }, { status: 500 })
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const conditions = await listConditions(supabase, user.id)
    return NextResponse.json({ conditions })
  } catch (err) {
    return fail(err)
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    await createCondition(supabase, user.id, parseInput(await request.json()))
    return NextResponse.json({ success: true })
  } catch (err) {
    return fail(err)
  }
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getAuthedSupabase(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = (await request.json()) as Record<string, unknown>
    const id = typeof body.id === 'string' ? body.id : ''
    if (!id) return NextResponse.json({ error: 'id é obrigatório.' }, { status: 400 })
    await updateCondition(supabase, user.id, id, parseInput(body))
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
    await removeCondition(supabase, user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return fail(err)
  }
}
