// ARCH · IDENTIDADE ≠ AUTORIZAÇÃO DE DADOS DE SAÚDE.
//
// PRINCÍPIO (fundadora, 25/08/2026 — PERMANENTE): a plataforma tem DUAS camadas de autorização, e elas devem
// permanecer arquiteturalmente separadas:
//
//   1. IDENTIDADE — quem é a pessoa. Entrar na SINTERA: senha, Google e, no futuro, Apple e Microsoft.
//      Vive em `auth.users` (Supabase Auth). Acrescentar um provedor NÃO pode mudar a identidade interna.
//   2. AUTORIZAÇÃO DE DADOS — permissão para a SINTERA acessar dados de saúde numa fonte externa (Strava,
//      Oura, Health Connect, laboratório, hospital). Vive em `wearable_connections`, atrás do contrato
//      `OAuthProvider` da camada de conectores.
//
// POR QUE SEPARAR: entrar na plataforma e autorizar leitura do seu histórico de saúde são consentimentos de
// naturezas diferentes, com escopos, revogações e implicações legais diferentes. Misturá-los faria com que
// revogar um revogasse o outro — ou, pior, que entrar com uma conta concedesse acesso a dados sem que ninguém
// tivesse consentido com isso. É também o desenho do SMART on FHIR, que separa autenticação (OIDC) de
// autorização de recurso (escopos OAuth 2.0 por recurso).
//
// A separação HOJE é verdadeira por como o código nasceu. Esta guarda a torna permanente — que é o que
// sobrevive à transferência do projeto para outra equipe.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()

/**
 * Provedores de IDENTIDADE — como a pessoa entra na SINTERA. Acrescentar aqui é decisão de produto; o ponto
 * desta lista é que nenhum id de fonte de SAÚDE pode coincidir com um deles.
 */
const PROVEDORES_DE_IDENTIDADE = ['email', 'google', 'apple', 'microsoft', 'azure', 'facebook'] as const

/**
 * Módulos que implementam o LOGIN. A raiz de composição (`auth/client.ts`) fica FORA: ela monta o objeto com
 * todos os domínios (.auth, .body, .connectors) e referenciar os dois ali é montagem, não mistura.
 */
const MODULOS_DE_LOGIN = [
  'packages/api-client/src/auth/login.ts',
  'packages/api-client/src/auth/session.ts',
  // Login por provedor externo (Google; Apple e Microsoft depois). É AQUI que a separação corre mais risco:
  // os dois caminhos falam OAuth, e é tentador reaproveitar o `OAuthProvider` da camada de conectores —
  // que serve para outra coisa (autorizar leitura de dados de saúde numa fonte externa).
  'packages/api-client/src/auth/oauth.ts',
  'packages/core/src/domain/auth/oauthCallback.ts',
  'src/app/login/page.tsx',
  'apps/mobile/src/presentation/screens/LoginScreen.tsx',
  'apps/mobile/src/state/AuthProvider.tsx',
]

/** A camada de conectores — autorização de DADOS. */
const DIRS_DE_CONECTOR = ['packages/core/src/domain/connectors', 'src/lib/connectors']

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.')) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) varrer(p, out)
    else if (/\.tsx?$/.test(n)) out.push(p)
  }
  return out
}
const rel = (p: string) => relative(ROOT, p).split('\\').join('/')
const ler = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '')

describe('ARCH · identidade ≠ autorização de dados de saúde', () => {
  it('o LOGIN não conhece a camada de conectores', () => {
    const infratores = MODULOS_DE_LOGIN
      .filter(f => existsSync(join(ROOT, f)))
      .filter(f => /from\s+['"][^'"]*connectors|wearable_connections|OAuthProvider/.test(ler(join(ROOT, f))))
    expect(infratores, 'módulo de login alcançando a autorização de dados de saúde').toEqual([])
  })

  it('a camada de conectores não conhece a sessão nem o login', () => {
    const infratores = DIRS_DE_CONECTOR
      .flatMap(d => varrer(join(ROOT, d)))
      .filter(f => /signInWithPassword|signInWithOAuth|signInWithIdToken|auth\/login/.test(ler(f)))
      .map(rel)
    expect(infratores, 'conector mexendo em autenticação de usuário').toEqual([])
  })

  it('NENHUM id de fonte de saúde colide com um provedor de identidade', () => {
    // O caso concreto que isto trava: o conector do Google chama-se `google_fit`, NÃO `google`. Se um dia
    // alguém registrasse uma fonte de saúde como `google`, "entrar com Google" e "autorizar leitura dos meus
    // dados do Google" passariam a ser o mesmo identificador — e revogar um afetaria o outro.
    const fontes = new Set<string>()
    for (const f of DIRS_DE_CONECTOR.flatMap(d => varrer(join(ROOT, d)))) {
      for (const m of ler(f).matchAll(/\bsource:\s*'([a-z0-9_]+)'/g)) fontes.add(m[1])
    }
    const colisoes = [...fontes].filter(s => (PROVEDORES_DE_IDENTIDADE as readonly string[]).includes(s))
    expect(colisoes, 'id usado nas DUAS camadas — entrar e autorizar deixariam de ser distinguíveis').toEqual([])
  })

  it('a tabela de conexões de saúde NÃO guarda credencial de login da plataforma', () => {
    // `wearable_connections` guarda token de TERCEIRO (Strava, Withings). Senha/sessão da SINTERA vivem no
    // Supabase Auth e não podem migrar para cá — seria juntar o que este teste existe para separar.
    const migracoes = varrer(join(ROOT, 'supabase/migrations'))
    const sql = existsSync(join(ROOT, 'supabase/migrations'))
      ? readdirSync(join(ROOT, 'supabase/migrations'))
          .filter(n => n.endsWith('.sql'))
          .map(n => ler(join(ROOT, 'supabase/migrations', n)))
          .join('\n')
      : ''
    void migracoes
    const trecho = sql.slice(sql.indexOf('create table if not exists public.wearable_connections'))
    const bloco = trecho.slice(0, trecho.indexOf(');') + 2)
    for (const proibida of ['password', 'senha', 'session_token', 'auth_token']) {
      expect(bloco.includes(proibida), `wearable_connections não pode ter coluna "${proibida}"`).toBe(false)
    }
  })
})
