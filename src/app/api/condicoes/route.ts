// Rota ÚNICA de Condições de Saúde — Web (cookie) e Mobile (Bearer). Auth e mapa
// de erro vêm da fundação (@/lib/api/http · authed); a lógica vive em
// @/lib/condicoes/service. Aqui só há parse + orquestração. Sem juízo clínico.
//   GET  · POST { scope, name, relative?, sinceLabel?, notes? } · PATCH { id, ...} · DELETE ?id=
import { NextResponse } from 'next/server'
import { authed, requiredId, BadRequestError } from '@/lib/api/http'
import {
  listConditions,
  createCondition,
  updateCondition,
  removeCondition,
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

export const GET = authed(async ({ supabase, userId }) => {
  return NextResponse.json({ conditions: await listConditions(supabase, userId) })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  await createCondition(supabase, userId, parseInput(await request.json()))
  return NextResponse.json({ success: true })
})

export const PATCH = authed(async ({ supabase, userId, request }) => {
  const body = (await request.json()) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) throw new BadRequestError('id é obrigatório.')
  await updateCondition(supabase, userId, id, parseInput(body))
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await removeCondition(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
