// Rota ÚNICA de Sinais vitais — Web (cookie) e Mobile (Bearer). Auth/erro pela
// fundação (@/lib/api/http · authed); lógica em @/lib/sinais-vitais/service
// (escopada a body_metrics ∩ VITALS). Sem edição (paridade com a UI).
//   GET · POST { metric, value, measuredOn, unit?, label?, notes? } · DELETE ?id=
import { NextResponse } from 'next/server'
import { authed, requiredId } from '@/lib/api/http'
import { listVitals, createVital, removeVital, type Vital, type VitalInput } from '@/lib/sinais-vitais/service'

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

export const GET = authed(async ({ supabase, userId }) => {
  return NextResponse.json({ vitals: await listVitals(supabase, userId) })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  await createVital(supabase, userId, parseInput(await request.json()))
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await removeVital(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
