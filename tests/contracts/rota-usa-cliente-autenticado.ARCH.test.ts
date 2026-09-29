// ARCH · rota de API que atende as DUAS PONTAS não pode trocar o cliente autenticado por um de cookie.
//
// ============================================================================================
// O DEFEITO, DUAS VEZES
// ============================================================================================
// 27/08/2026 — as rotas usavam `createClient()` do servidor, que lê a sessão do COOKIE. O aplicativo não tem
// cookie: manda `Authorization: Bearer`. Toda chamada do Mobile devolvia 401. `apiAuth.ts` nasceu para isso,
// e passou a devolver `{ user, client }` — o cliente JÁ no contexto da pessoa.
//
// 28/09/2026 — homologação Android da fundadora: convidar um profissional respondia "Não consegui criar o
// convite". A rota `/api/care/invites` pegava só o `user` e criava um SEGUNDO cliente por cookie. Na Web
// funcionava; no aplicativo o cliente nascia anônimo, `auth.uid()` ficava nulo e a RLS recusava o insert.
//
// O mesmo defeito, um arquivo ao lado, um mês depois. O helper existia, estava documentado, devolvia a coisa
// certa — e foi o valor de retorno descartado que trouxe o defeito de volta. Documentação não impede
// reincidência; catraca impede.
//
// A REGRA: quem chama `authenticateRequest` usa o `client` que ele devolve. Não existe motivo legítimo para
// autenticar pelas duas portas e depois falar com o banco por uma só.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const API = join(ROOT, 'src/app/api')

function rotas(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) rotas(p, out)
    else if (n === 'route.ts' || n === 'route.tsx') out.push(p)
  }
  return out
}

const semComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

const arquivos = rotas(API).map(p => ({
  caminho: p.slice(ROOT.length + 1).replace(/\\/g, '/'),
  src: semComentarios(readFileSync(p, 'utf8')),
}))

/**
 * OS DOIS NOMES DA MESMA CAMADA — e a catraca precisa conhecer os dois.
 *
 * Em 29/09/2026 descobri que existiam DUAS camadas de auth compartilhada: `authenticateRequest` e
 * `getAuthedSupabase`. Esta catraca só conhecia a primeira. Ao medir quantas rotas aceitavam Bearer, dei um
 * número errado à fundadora e cheguei a concluir que a leitura de laudo estava quebrada no aplicativo — ela
 * não estava; usava a outra.
 *
 * `getAuthedSupabase` deixou de ter lógica própria e hoje delega, mas o nome continua nas rotas. Uma catraca
 * que não reconhece um dos nomes mede a metade errada.
 */
const HELPERS = ['authenticateRequest', 'getAuthedSupabase'] as const
const usaHelper = (src: string) => HELPERS.some(h => src.includes(h))

describe('ARCH · CATRACA — existe UMA camada de auth compartilhada', () => {
  it('só `apiAuth.ts` implementa a decisão; o outro nome delega', () => {
    const delegante = readFileSync(join(ROOT, 'src/lib/supabase/authedClient.ts'), 'utf8')
    expect(delegante).toContain('authenticateRequest')
    expect(
      /createClient\s*<\s*Database\s*>\s*\(\s*process\.env/.test(delegante),
      'authedClient.ts voltou a montar o cliente por conta própria — são dois donos da mesma decisão (ADR-023)',
    ).toBe(false)
  })

  it('o Bearer é tentado ANTES do cookie', () => {
    // O cabeçalho é credencial deliberada; o cookie é ambiente e pode estar velho. Numa requisição com os
    // dois, deixar o cookie ganhar autenticaria como a identidade que a pessoa não escolheu.
    const src = readFileSync(join(ROOT, 'src/lib/supabase/apiAuth.ts'), 'utf8')
    const posBearer = src.indexOf('const token = bearer(req)')
    const posCookie = src.indexOf('createCookieClient()')
    expect(posBearer).toBeGreaterThan(0)
    expect(posCookie).toBeGreaterThan(0)
    expect(posBearer, 'o cookie voltou a ser tentado primeiro').toBeLessThan(posCookie)
  })

  it('o token é validado no servidor, e não decodificado aqui', () => {
    const src = readFileSync(join(ROOT, 'src/lib/supabase/apiAuth.ts'), 'utf8')
    expect(src, 'getUser precisa receber o token — sem sessão, getUser() não valida nada').toContain('getUser(token)')
    expect(/atob\(|jwtDecode|JSON\.parse\(.*split\('\.'\)/.test(src), 'JWT decodificado à mão').toBe(false)
  })
})

describe('ARCH · CATRACA — a rota fala com o banco pelo cliente que autenticou', () => {
  it('há rotas de API para medir — senão esta catraca não mede nada', () => {
    expect(arquivos.length, 'nenhuma route.ts encontrada: o parser quebrou').toBeGreaterThan(5)
    expect(
      arquivos.filter(a => usaHelper(a.src)).length,
      'nenhuma rota usa a camada compartilhada: o alvo da catraca sumiu',
    ).toBeGreaterThan(3)
  })

  it('nenhuma rota autentica pelas duas portas e depois usa o cliente de COOKIE', () => {
    const suspeitas: string[] = []
    for (const a of arquivos) {
      if (!usaHelper(a.src)) continue
      // Descartar o `client` e criar outro por cookie é exatamente o defeito.
      const descarta = /const\s*\{\s*user\s*\}\s*=\s*await\s+authenticateRequest/.test(a.src)
      const cookie = /await\s+createClient\(\s*\)/.test(a.src)
      if (descarta && cookie) suspeitas.push(a.caminho)
    }
    expect(
      suspeitas,
      'A rota autentica por cookie OU Bearer e depois fala com o banco só por cookie.\n' +
        'No aplicativo não há cookie: o cliente nasce ANÔNIMO, `auth.uid()` fica nulo e a RLS recusa a\n' +
        'escrita — com uma mensagem que culpa a operação em vez da porta.\n' +
        'Use o `client` que `authenticateRequest` devolve.\n\n' + suspeitas.join('\n'),
    ).toEqual([])
  })

  it('CASO CONHECIDO · `/api/care/invites` usa o cliente autenticado', () => {
    // O defeito literal de 28/09, nomeado para que o relatório diga o que quebrou e por quê.
    const rota = arquivos.find(a => a.caminho.endsWith('api/care/invites/route.ts'))
    expect(rota, 'a rota do convite sumiu').toBeDefined()
    expect(rota!.src).toMatch(/client:\s*supabase\s*\}\s*=\s*await\s+authenticateRequest/)
    expect(
      rota!.src,
      'voltar a criar o cliente por cookie quebra o convite no aplicativo, e só nele',
    ).not.toMatch(/await\s+createClient\(\s*\)/)
  })

  it('quem usa o `client` do helper também confere que ele existe', () => {
    // `client` é `null` quando não há autenticação. Usá-lo sem checar transformaria um 401 legítimo num
    // erro de tempo de execução, que a pessoa lê como defeito da plataforma.
    for (const a of arquivos) {
      if (!/client:\s*\w+\s*\}\s*=\s*await\s+authenticateRequest/.test(a.src)) continue
      const nome = /client:\s*(\w+)\s*\}\s*=\s*await\s+authenticateRequest/.exec(a.src)![1]
      expect(
        new RegExp(`!${nome}\\b|${nome}\\s*===\\s*null|${nome}\\s*\\?\\?|${nome}\\s*\\?\\.`).test(a.src),
        `${a.caminho}: usa o cliente do helper sem conferir se ele é nulo`,
      ).toBe(true)
    }
  })
})
