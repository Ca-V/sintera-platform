// Menstruações — Web (cookie) e Mobile (Bearer). Lógica em @/lib/ciclo/service.
//   POST { startedOn? } → registra (upsert por dia); vazio = hoje
//   DELETE ?id= → remove
import { NextResponse } from 'next/server'
import { authed, requiredId } from '@/lib/api/http'
import { addPeriod, removePeriod } from '@/lib/ciclo/service'

export const POST = authed(async ({ supabase, userId, request }) => {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>
  await addPeriod(supabase, userId, typeof b.startedOn === 'string' ? b.startedOn : '')
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await removePeriod(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
