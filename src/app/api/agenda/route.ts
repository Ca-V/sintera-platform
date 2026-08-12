// Leitura HTTP da Jornada de Saúde — Web (cookie) e Mobile (Bearer). É a exposição
// client-facing das PROJEÇÕES que já existiam no domínio Agenda (dono único dos eventos):
// a Web lê via server components/serviços; o Mobile precisa das mesmas listas por HTTP.
// Este handler NÃO reimplementa seleção nem toca tabelas — delega a `eventServicesFor`
// (mesmo contrato do cron de lembretes). `view` escolhe a projeção do domínio:
//   GET /api/agenda?view=upcoming   → Agenda (eventos futuros)
//   GET /api/agenda?view=historical → Histórico (eventos passados)
//   GET /api/agenda?view=financial  → Gastos (eventos realizados com valor)
//   GET /api/agenda (all, default)   → toda a jornada (Timeline)
import { NextResponse } from 'next/server'
import { authed } from '@/lib/api/http'
import { eventServicesFor } from '@/lib/agenda/service'

export const GET = authed(async ({ supabase, userId, request }) => {
  const view = new URL(request.url).searchParams.get('view')
  const { query } = eventServicesFor(supabase)
  const events =
    view === 'upcoming'   ? await query.listUpcoming(userId)   :
    view === 'historical' ? await query.listHistorical(userId) :
    view === 'financial'  ? await query.listFinancial(userId)  :
                            await query.listAll(userId)
  return NextResponse.json({ events })
})
