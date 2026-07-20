// @sintera/core — contrato de MÓDULO DE DOMÍNIO.
// Um domínio representa uma CAPACIDADE da plataforma (Timeline, Observações, Exames, Agenda, Medicamentos, Suplementos,
// Perfil, Integrações…), NUNCA uma tela (Home/Tela A/Tela B). A navegação CONSOME domínios; não os define (ADR-009).
// Independência: domínios comunicam-se por CONTRATOS/serviços compartilhados, sem dependência direta entre si.

/** Descreve um domínio (capacidade) da plataforma — vendor-neutral, UI-independent. */
export interface DomainModule {
  /** chave estável da capacidade (ex.: 'timeline', 'observations', 'exams'). */
  readonly key: string
  /** rótulo humano (taxonomia da Sidebar). */
  readonly label: string
}

/** Registro de domínios — a app compõe suas capacidades aqui; camadas superiores só iteram. */
export interface DomainRegistry {
  register(module: DomainModule): void
  get(key: string): DomainModule | undefined
  list(): DomainModule[]
}
