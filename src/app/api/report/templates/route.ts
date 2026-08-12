// Perfis de Comunicação (configurações salvas do Relatório) — Web (cookie) e Mobile
// (Bearer). Lógica em @/lib/communication/reportSharing.
//   GET → { templates }
//   POST { name, selection } → cria
//   DELETE ?id= → remove
import { NextResponse } from 'next/server'
import { authed, requiredId } from '@/lib/api/http'
import { listTemplates, createTemplate, deleteTemplate } from '@/lib/communication/reportSharing'

export const GET = authed(async ({ supabase, userId }) => {
  return NextResponse.json({ templates: await listTemplates(supabase, userId) })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>
  await createTemplate(supabase, userId, {
    name: typeof b.name === 'string' ? b.name : '',
    selection: b.selection ?? {},
  })
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await deleteTemplate(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
