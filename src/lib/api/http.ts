// ============================================================
// SINTERA — Fundação de API: rota autenticada de recurso (padrão oficial)
// ============================================================
// Elimina o esqueleto duplicado que TODA rota de recurso repetia: resolver a auth
// compartilhada (Cookie=Web · Bearer=Mobile, ADR-020), garantir 401, envolver o
// handler em try/catch e mapear erros (validação→422, requisição malformada→400,
// resto→500).
//
// É a base ÚNICA reutilizada por todos os módulos (Condições, Medidas, Sinais…) e
// pelas futuras integrações (wearables, laboratórios, FHIR, Apple Health, Health
// Connect, Garmin, WHOOP…). Nenhuma rota reimplementa auth/erro.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getAuthedSupabase } from '@/lib/supabase/authedClient'
import { ValidationError, BadRequestError } from './errors'

// Erros de domínio moram em `./errors` (client-safe). Reexportados aqui por
// conveniência das ROTAS — os SERVIÇOS devem importar de `@/lib/api/errors`.
export { ValidationError, BadRequestError } from './errors'

export interface AuthedContext {
  supabase: SupabaseClient
  userId: string
  request: NextRequest
}

export type AuthedHandler = (ctx: AuthedContext) => Promise<NextResponse> | NextResponse

/** Mapeia um erro para a resposta HTTP padrão da plataforma. Puro/testável. */
export function errorToResponse(err: unknown): NextResponse {
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 422 })
  }
  if (err instanceof BadRequestError) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
  const message = err instanceof Error ? err.message : String(err)
  return NextResponse.json({ error: 'Falha ao processar a requisição.', detail: message.slice(0, 300) }, { status: 500 })
}

/**
 * Envelope ÚNICO de rota autenticada. Uso:
 *   export const GET = authed(async ({ supabase, userId }) => NextResponse.json(...))
 * Resolve auth → 401 se ausente → executa o handler → mapeia erros.
 */
export function authed(handler: AuthedHandler): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const { supabase, user } = await getAuthedSupabase(request)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    try {
      return await handler({ supabase, userId: user.id, request })
    } catch (err) {
      return errorToResponse(err)
    }
  }
}

/** `id` obrigatório da query string (?id=). Lança BadRequestError (400) se ausente. */
export function requiredId(request: NextRequest): string {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) throw new BadRequestError('id é obrigatório.')
  return id
}
