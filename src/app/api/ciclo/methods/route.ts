// Métodos contraceptivos — Web (cookie) e Mobile (Bearer). Lógica em @/lib/ciclo/service
// (que delega o lembrete a services.command.syncReminder).
//   POST { kind, brand?, startedOn?, durationMonths?, reminder, notes?, id? } → cria/edita
//   PATCH { id, status } → ativo/encerrado (encerrar limpa o lembrete)
//   DELETE ?id= → remove (limpa o lembrete)
import { NextResponse } from 'next/server'
import { authed, requiredId, BadRequestError } from '@/lib/api/http'
import { saveMethod, setMethodStatus, removeMethod, type MethodInput, type MethodStatus } from '@/lib/ciclo/service'

function parseMethod(body: unknown): MethodInput {
  const b = (body ?? {}) as Record<string, unknown>
  const dm = b.durationMonths
  return {
    id: typeof b.id === 'string' ? b.id : null,
    kind: typeof b.kind === 'string' ? b.kind : 'outro',
    brand: typeof b.brand === 'string' ? b.brand : null,
    startedOn: typeof b.startedOn === 'string' ? b.startedOn : null,
    durationMonths: typeof dm === 'number' ? dm : (typeof dm === 'string' && dm.trim() ? Number(dm) : null),
    reminder: b.reminder === true,
    notes: typeof b.notes === 'string' ? b.notes : null,
  }
}

export const POST = authed(async ({ supabase, userId, request }) => {
  await saveMethod(supabase, userId, parseMethod(await request.json()))
  return NextResponse.json({ success: true })
})

export const PATCH = authed(async ({ supabase, userId, request }) => {
  const b = (await request.json()) as Record<string, unknown>
  const id = typeof b.id === 'string' ? b.id : ''
  if (!id) throw new BadRequestError('id é obrigatório.')
  const status: MethodStatus = b.status === 'encerrado' ? 'encerrado' : 'ativo'
  await setMethodStatus(supabase, userId, id, status)
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await removeMethod(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
