// Configuração de ambiente do app Mobile. Valores vêm de variáveis públicas do Expo
// (prefixo EXPO_PUBLIC_), definidas em .env / EAS. NÃO contém segredos de servidor.
//
//   EXPO_PUBLIC_SUPABASE_URL       — mesma URL do projeto Supabase da Web
//   EXPO_PUBLIC_SUPABASE_ANON_KEY  — chave anon (pública) do Supabase
//   EXPO_PUBLIC_API_URL            — base das rotas /api (produção da Web), ex.: https://sinteramais.com.br

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''
/** Base das rotas de API da Web (reutilizadas pelo Mobile via Bearer). Sem barra final. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '')
