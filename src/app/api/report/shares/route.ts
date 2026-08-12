// Links compartilhados do Relatório — Web (cookie) e Mobile (Bearer). Lógica em
// @/lib/communication/reportSharing. Token e validade nascem no servidor.
//   GET → { shares }
//   POST { sections, period } → cria link
//   DELETE ?id= → revoga (soft-delete)
import { NextResponse } from 'next/server'
import { authed, requiredId } from '@/lib/api/http'
import { listShares, createShare, revokeShare } from '@/lib/communication/reportSharing'

export const GET = authed(async ({ supabase, userId }) => {
  return NextResponse.json({ shares: await listShares(supabase, userId) })
})

export const POST = authed(async ({ supabase, userId, request }) => {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>
  await createShare(supabase, userId, {
    sections: Array.isArray(b.sections) ? (b.sections as string[]) : [],
    period: b.period ?? null,
  })
  return NextResponse.json({ success: true })
})

export const DELETE = authed(async ({ supabase, userId, request }) => {
  await revokeShare(supabase, userId, requiredId(request))
  return NextResponse.json({ success: true })
})
