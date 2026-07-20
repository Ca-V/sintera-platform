// HIP-001/HIP-002 — capacidade GENÉRICA de webhook (vendor-neutral). Um provedor cujo webhook chega no formato dele
// (payload próprio, chaveado pelo id interno do usuário) expõe estas capacidades; o núcleo/rota apenas delega. Nenhuma
// particularidade de fornecedor mora aqui — só o contrato. Adaptadores (ex.: withings/) implementam.

/** Contexto entregue ao handler — capacidades do núcleo que ele pode usar (sem tokens). */
export interface WebhookContext {
  /** Resolve o usuário da plataforma a partir do id do usuário na fonte (genérico). */
  resolveUserByExternalId(provider: string, externalUserId: string): Promise<string | null>
}

/** Lado RECEPTOR: valida/parseia a requisição do provedor e resolve o usuário da plataforma. */
export interface WebhookHandler {
  readonly source: string
  /** Retorna o userId da plataforma, ou null para IGNORAR (a rota responde 200 — ex.: ping de validação). */
  resolveUser(req: Request, ctx: WebhookContext): Promise<string | null>
}

/** Lado REGISTRO: assina/revoga a notificação no provedor (quando ele exige assinatura, ex.: Withings Notify). */
export interface WebhookSubscriber {
  readonly source: string
  subscribe(accessToken: string, callbackUrl: string): Promise<void>
  revoke(accessToken: string, callbackUrl: string): Promise<void>
}
