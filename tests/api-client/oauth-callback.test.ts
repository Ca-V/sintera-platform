// FUNC · leitura do retorno de login por provedor externo (Google hoje; Apple e Microsoft depois).
//
// POR QUE ISTO TEM TESTE: é a parte que erra. O provedor devolve os campos ora no FRAGMENTO, ora na QUERY;
// pode devolver recusa em vez de tokens; e a URL chega por deep link no Mobile e por rota na Web. Dentro de uma
// tela isso seria inverificável — e um erro aqui é a pessoa não conseguir entrar, sem mensagem que ajude.
//
// IDENTIDADE, não autorização de dados de saúde. As duas camadas são separadas de propósito
// (ver tests/contracts/identidade-vs-autorizacao.ARCH.test.ts).
import { describe, it, expect } from 'vitest'
import { parseOAuthCallback, hasUsableSession } from '@sintera/core'

const A = 'eyJhbGciOi.acesso'
const R = 'v1.refresh'

describe('retorno do provedor · fragmento (fluxo implícito, o configurado hoje)', () => {
  it('lê os dois tokens do deep link do aplicativo', () => {
    const cb = parseOAuthCallback(`sintera://auth#access_token=${A}&refresh_token=${R}&expires_in=3600`)
    expect(cb).toEqual({ accessToken: A, refreshToken: R, error: null })
    expect(hasUsableSession(cb)).toBe(true)
  })

  it('lê também da rota de callback da Web', () => {
    const cb = parseOAuthCallback(`https://sinteramais.com.br/auth/callback#access_token=${A}&refresh_token=${R}`)
    expect(hasUsableSession(cb)).toBe(true)
  })
})

describe('retorno do provedor · query', () => {
  it('não depende do fragmento — uma mudança de configuração não pode quebrar em silêncio', () => {
    const cb = parseOAuthCallback(`sintera://auth?access_token=${A}&refresh_token=${R}`)
    expect(hasUsableSession(cb)).toBe(true)
  })

  it('query e fragmento juntos: o fragmento tem precedência, e nada se perde', () => {
    const cb = parseOAuthCallback(`sintera://auth?foo=1#access_token=${A}&refresh_token=${R}`)
    expect(cb.accessToken).toBe(A)
  })
})

describe('retorno do provedor · recusa', () => {
  it('prefere a mensagem legível ao código', () => {
    const cb = parseOAuthCallback('sintera://auth#error=access_denied&error_description=O%20usuario%20cancelou')
    expect(cb.error).toBe('O usuario cancelou')
    expect(hasUsableSession(cb)).toBe(false)
  })

  it('sem mensagem, usa o código', () => {
    expect(parseOAuthCallback('sintera://auth#error=server_error').error).toBe('server_error')
  })

  it('O CASO CENTRAL: recusa com token junto NÃO vira sessão', () => {
    // Tratar isso como sucesso parcial criaria sessão a partir de um consentimento que não houve.
    const cb = parseOAuthCallback(`sintera://auth#error=access_denied&access_token=${A}&refresh_token=${R}`)
    expect(cb.accessToken).toBeNull()
    expect(hasUsableSession(cb)).toBe(false)
  })
})

describe('retorno do provedor · entrada inútil não derruba nada', () => {
  it('vazio, nulo e sem parâmetros', () => {
    for (const u of ['', '   ', null, undefined, 'sintera://auth']) {
      expect(hasUsableSession(parseOAuthCallback(u))).toBe(false)
    }
  })

  it('NUNCA lança, mesmo com lixo', () => {
    expect(() => parseOAuthCallback('#%%%&&&=')).not.toThrow()
    expect(() => parseOAuthCallback('não é uma url')).not.toThrow()
  })

  it('só o token de acesso NÃO basta', () => {
    // Sem o de atualização a sessão morre na primeira expiração e a pessoa cai fora sem entender por quê.
    const cb = parseOAuthCallback(`sintera://auth#access_token=${A}`)
    expect(cb.accessToken).toBe(A)
    expect(hasUsableSession(cb)).toBe(false)
  })
})
