// ============================================================
// SINTERA — Erros de domínio da API (client-safe, SEM framework)
// ============================================================
// Estas classes são um CONCEITO DE DOMÍNIO (entrada inválida / requisição
// malformada), lançadas pelos SERVIÇOS de domínio (`lib/<módulo>/service.ts`).
// Um serviço é ISOMÓRFICO — importado tanto pela ROTA (servidor) quanto, para
// helpers puros (ex.: buildXPayload), pela PÁGINA (cliente). Por isso os erros
// NÃO podem morar no mesmo módulo que o envelope de rota (`http.ts`, que puxa
// `next/headers` via getAuthedSupabase): senão o bundle do cliente arrasta código
// só-servidor e a build quebra.
//
// Regra permanente: este arquivo não importa NADA de `next/*` nem de Supabase.
// O mapeamento erro→HTTP (errorToResponse) e o envelope `authed` ficam em http.ts.
// ============================================================

/** Entrada de domínio inválida → HTTP 422. Classe ÚNICA da plataforma. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/** Requisição malformada (ex.: falta parâmetro obrigatório) → HTTP 400. */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}
