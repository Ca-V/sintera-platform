// Rota ÚNICA de Hábitos de Vida — Web (cookie) e Mobile (Bearer). Auth/erro pela
// fundação (@/lib/api/http · authed); lógica em @/lib/habitos/service.
//   GET · POST { category, description, frequency?, notes? } · PATCH { id, ... } · DELETE ?id=
import { NextResponse } from 'next/server'
import { authed, requiredId, BadRequestError } from '@/lib/api/http'
import { listHabits, createHabit, updateHabit, removeHabit, type HabitCategory, type HabitInput } from '@/lib/habitos/service'

function parseInput(body: unknown): HabitInput {
  const b = (body ?? {}) as Record<string, unknown>
  return {
    category: (typeof b.category === 'string' ? b.category : 'outro') as HabitCategory,
    description: typeof b.description === 'string' ? b.description : '',
    frequency: typeof b.frequency === 'string' ? b.frequency : null,
    notes: typeof b.notes === 'string' ? b.notes : null,
  }
}

export const GET = authed(async ({ supabase, userId }) => {
  return NextResponse.json({ habits: await listHabits(supabase, userId) })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  await createHabit(supabase, userId, parseInput(await request.json()))
  return NextResponse.json({ success: true })
})

export const PATCH = authed(async ({ supabase, userId, request }) => {
  const body = (await request.json()) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) throw new BadRequestError('id é obrigatório.')
  await updateHabit(supabase, userId, id, parseInput(body))
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await removeHabit(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
