// Mobile — FIAÇÃO (DI) do cliente compartilhado. Injeta url/key (env EXPO_PUBLIC_*) + o SecureStoreAdapter
// na fábrica ÚNICA do @sintera/api-client. Nenhum outro arquivo do app cria clientes nem chama o SDK Supabase.
import { createApiClient, type ApiClient } from '@sintera/api-client'
import { secureStoreAdapter } from './secureStoreAdapter'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    'Auth: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY ausentes. Preencha apps/mobile/.env.'
  )
}

// PONTE TRANSITÓRIA (ADR-020): endereço da Web, para reusar as rotas dela em vez de duplicar a regra aqui.
// Dela dependem leitura assistida, Conexões, análise de exame, ômicas e exportação de conta.
const webBaseUrl = process.env.EXPO_PUBLIC_WEB_URL

// NÃO derruba o app: sem a ponte, o resto continua funcionando, e essa é a decisão certa. Mas a ausência não pode
// ser MUDA. Em 27/08 a variável não estava definida em build nenhuma, e o efeito na homologação foi "não puxa os
// dados da receita, e também não apareceu nenhuma mensagem" — porque cada função devolve `null` em silêncio.
// Silêncio é bom para quem usa e péssimo para quem procura o defeito; o aviso existe para quem procura.
if (!webBaseUrl) {
  console.warn(
    '[SINTERA] EXPO_PUBLIC_WEB_URL ausente: leitura assistida, Conexões, análise de exame, ômicas e exportação ' +
    'de conta ficam indisponíveis — sem erro visível. Defina em apps/mobile/eas.json (perfil da build) ou .env.',
  )
}

export const apiClient: ApiClient = createApiClient({
  url,
  key,
  storage: secureStoreAdapter,
  webBaseUrl,
})
