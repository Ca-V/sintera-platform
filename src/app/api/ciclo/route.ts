// Rota ÚNICA de leitura de Ciclo/Contracepção — Web (cookie) e Mobile (Bearer).
//   GET /api/ciclo → { methods, periods }
import { NextResponse } from 'next/server'
import { authed } from '@/lib/api/http'
import { listMethods, listPeriods } from '@/lib/ciclo/service'

export const GET = authed(async ({ supabase, userId }) => {
  const [methods, periods] = await Promise.all([
    listMethods(supabase, userId),
    listPeriods(supabase, userId),
  ])
  return NextResponse.json({ methods, periods })
})
