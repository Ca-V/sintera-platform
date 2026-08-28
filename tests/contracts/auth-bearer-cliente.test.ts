// A autenticação por BEARER depende de um comportamento interno do supabase-js. Este teste o trava.
//
// O CAMINHO. O aplicativo não tem cookie: manda `Authorization: Bearer <token>`. A rota cria um cliente com a
// chave ANÔNIMA mais esse cabeçalho e chama `auth.getUser()` para validar o token no servidor do Supabase.
//
// O DETALHE SUTIL. `getUser()` SEM argumento normalmente exige uma sessão salva — e aqui não há nenhuma
// (`persistSession: false`). O que faz a chamada seguir assim mesmo é uma bandeira que o supabase-js liga
// quando o cliente é construído com um cabeçalho `Authorization` próprio:
//
//     hasCustomAuthorizationHeader: Object.keys(this.headers).some(k => k.toLowerCase() === 'authorization')
//
// Com ela ligada, a biblioteca envia os nossos cabeçalhos para `/user` e o Supabase valida o token. Sem ela,
// devolveria `AuthSessionMissingError` — e TODA chamada do aplicativo voltaria a dar 401.
//
// POR QUE TRAVAR ISTO. É comportamento interno de dependência, não contrato público. Uma atualização do
// supabase-js que renomeie ou remova a bandeira quebra o aplicativo inteiro EM SILÊNCIO: as rotas passariam a
// recusar todo token, e o sintoma seria de novo "não acontece nada e não aparece mensagem". Foi exatamente essa
// combinação que custou dois ciclos de homologação em 27 e 28/08.
//
// Se este teste falhar depois de um `npm update`, a correção NÃO é mexer no teste — é passar o token
// explicitamente: `auth.getUser(token)`, que é a forma documentada e não depende de bandeira nenhuma.
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const URL_FALSA = 'https://exemplo.supabase.co'
const CHAVE_FALSA = 'chave-anonima-de-teste'

/** Constrói o cliente EXATAMENTE como `authenticateRequest` faz no caminho do Bearer. */
function clienteComoNaRota(token: string) {
  return createClient(URL_FALSA, CHAVE_FALSA, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

describe('autenticação por Bearer — o cliente construído como a rota constrói', () => {
  it('reconhece o cabeçalho Authorization próprio, e por isso valida sem sessão salva', () => {
    const auth = clienteComoNaRota('token-qualquer').auth as unknown as { hasCustomAuthorizationHeader?: boolean }

    expect(
      auth.hasCustomAuthorizationHeader,
      '\nO supabase-js deixou de reconhecer o cabeçalho Authorization passado em `global.headers`.\n\n' +
        'Sem essa bandeira, `getUser()` sem argumento devolve AuthSessionMissingError, TODA chamada do\n' +
        'aplicativo às rotas da Web volta a dar 401, e o sintoma reaparece como "não acontece nada e não\n' +
        'aparece mensagem nenhuma".\n\n' +
        'A correção NÃO é ajustar este teste: é passar o token explicitamente em\n' +
        '`src/lib/supabase/apiAuth.ts` — `auth.getUser(token)` —, que é a forma documentada.\n',
    ).toBe(true)
  })

  it('sem cabeçalho próprio a bandeira fica desligada — é ela que distingue os dois caminhos', () => {
    const semCabecalho = createClient(URL_FALSA, CHAVE_FALSA, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const auth = semCabecalho.auth as unknown as { hasCustomAuthorizationHeader?: boolean }
    expect(auth.hasCustomAuthorizationHeader).toBe(false)
  })

  it('o reconhecimento não depende da CAIXA do nome do cabeçalho', () => {
    // A comparação da biblioteca é `k.toLowerCase() === 'authorization'`. Se um dia deixar de ser, quem escrever
    // 'authorization' minúsculo teria um cliente que parece autenticado e não valida nada.
    const minusculo = createClient(URL_FALSA, CHAVE_FALSA, {
      global: { headers: { authorization: 'Bearer t' } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const auth = minusculo.auth as unknown as { hasCustomAuthorizationHeader?: boolean }
    expect(auth.hasCustomAuthorizationHeader).toBe(true)
  })
})
