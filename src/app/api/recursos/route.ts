// Rota ÚNICA de Recursos de Saúde — Web (cookie) e Mobile (Bearer). Auth/erro pela
// fundação (@/lib/api/http · authed); lógica em @/lib/recursos/service.
//   GET · POST { resourceType, name, status, ... , attributes } · PATCH { id, ... } · DELETE ?id=
import { NextResponse } from 'next/server'
import { authed, requiredId, BadRequestError } from '@/lib/api/http'
import {
  listResources,
  createResource,
  updateResource,
  removeResource,
  type ResourceInput,
  type ResourceType,
  type ResourceStatus,
} from '@/lib/recursos/service'

function parseInput(body: unknown): ResourceInput {
  const b = (body ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v : null)
  return {
    resourceType: (typeof b.resourceType === 'string' ? b.resourceType : 'dispositivo_medico') as ResourceType,
    name: typeof b.name === 'string' ? b.name : '',
    brand: str(b.brand),
    prescriber: str(b.prescriber),
    startedOn: str(b.startedOn),
    untilDate: str(b.untilDate),
    status: (typeof b.status === 'string' ? b.status : 'em_uso') as ResourceStatus,
    notes: str(b.notes),
    fileUrl: str(b.fileUrl),
    attributes: b.attributes && typeof b.attributes === 'object' ? (b.attributes as Record<string, unknown>) : {},
  }
}

export const GET = authed(async ({ supabase, userId }) => {
  return NextResponse.json({ resources: await listResources(supabase, userId) })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  await createResource(supabase, userId, parseInput(await request.json()))
  return NextResponse.json({ success: true })
})

export const PATCH = authed(async ({ supabase, userId, request }) => {
  const body = (await request.json()) as Record<string, unknown>
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) throw new BadRequestError('id é obrigatório.')
  await updateResource(supabase, userId, id, parseInput(body))
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await removeResource(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
