// @sintera/api-client — Contratos do DOMÍNIO Perfil (independentes de plataforma). Congelados em MOBILE-019.
// Só os campos CENTRAIS de `profiles`; campos de outros domínios (ciclo/composição) NÃO vazam para o tipo.

/** Perfil como LIDO pela plataforma. Escopo enxuto (pós D1/D3): editáveis são poucos; o restante é exibição.
 *  Preferências de notificação NÃO entram (deferidas p/ a Central no Mobile — D3). */
export interface ProfileDTO {
  id: string
  name: string | null
  phone: string | null
  age_range: string | null   // exibição-apenas no Inc 4 (D1)
  /** Data de nascimento (LGPD: opcional, finalidade declarada na tela, apagável pela titular). */
  birth_date: string | null
  goals: string[] | null      // exibição-apenas no Inc 4 (D1)
  avatar_url: string | null   // exibição-apenas (edição = incremento próprio)
  updated_at: string | null   // informativo
}

/** Campos EDITÁVEIS pelo Perfil (spec canônica única Web+Mobile). Whitelist estrita — a proteção por coluna vive
 *  aqui (RLS é por linha). age_range/goals passaram de exibição a editáveis (paridade Perfil). */
export type ProfileEditable = {
  name?: string | null
  phone?: string | null
  age_range?: string | null
  birth_date?: string | null
  goals?: string[] | null
}

/** Estatísticas do Perfil (mesma fonte para as duas plataformas). memberSince = criação da conta (auth). */
export interface ProfileStats {
  totalExams: number
  totalBiomarkers: number
  memberSince: string | null
}

/** API pública do domínio Perfil — o que Web e Mobile consomem. Convenção do pacote:
 *  leitura → `T | null` (null = linha inexistente) e LANÇA em falha operacional; escrita → `{ error }`. */
export interface ProfileApi {
  /** Lê o perfil do usuário autenticado. `null` = sem linha (usuário novo). LANÇA em falha (rede/timeout/DB/auth). */
  getProfile(signal?: AbortSignal): Promise<ProfileDTO | null>
  /** Estatísticas do usuário (exames, biomarcadores reais, membro desde). LANÇA em falha. Fonte única Web+Mobile. */
  getProfileStats(signal?: AbortSignal): Promise<ProfileStats>
  /** Grava (upsert) os campos editáveis. Retorna `{ error }` — nunca lança. */
  updateProfile(patch: ProfileEditable, signal?: AbortSignal): Promise<{ error: Error | null }>
}

/** Colunas centrais lidas do banco (explícitas — não `*` — para NÃO trazer campos de outros domínios). */
export const PROFILE_COLUMNS = 'id, name, phone, age_range, birth_date, goals, avatar_url, updated_at' as const
