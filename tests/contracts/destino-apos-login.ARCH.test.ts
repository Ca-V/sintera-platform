// ARCH · REDIRECIONAMENTO ABERTO — "volte para onde eu vim" não pode sair da plataforma.
//
// ============================================================================================
// ESTE ARQUIVO EXISTE POR CAUSA DE UM DEFEITO REAL NO CÓDIGO EM PRODUÇÃO
// ============================================================================================
// `/auth/callback` fazia `NextResponse.redirect(`${origin}${next}`)` com `next` lido cru da query.
//
// Com `?next=@sitefalso.com`, a URL montada era `https://sinteramais.com.br@sitefalso.com` — e o navegador
// lê tudo antes do `@` como NOME DE USUÁRIO, indo para sitefalso.com. O salto acontecia no instante logo
// depois de a pessoa digitar a senha, que é exatamente quando ela mais acredita no que a tela mostra.
//
// A CATRACA É DUPLA:
//   1. `destinoAposLogin` recusa tudo o que não é caminho da própria plataforma.
//   2. NENHUM arquivo concatena `next` cru numa URL. Porque a função só protege quem a chama — e o defeito
//      original não foi uma função mal escrita, foi uma concatenação que não passava por função nenhuma.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { destinoAposLogin, paramDestino, rotaDoConvite, tokenDoLinkDeConvite, DESTINO_PADRAO } from '@sintera/core'

const ROOT = process.cwd()

describe('ARCH · CATRACA — destino de fora da plataforma é recusado', () => {
  // Cada entrada é um ataque publicado contra parâmetros de retorno. Nenhum pode passar.
  it.each([
    ['@sitefalso.com',                 'userinfo: o defeito literal de 27/09'],
    ['//sitefalso.com',                'protocol-relative: o navegador lê como outro domínio'],
    ['///sitefalso.com',               'três barras, mesma coisa'],
    ['/\\sitefalso.com',               'barra invertida normalizada para //'],
    ['\\\\sitefalso.com',              'UNC'],
    ['https://sitefalso.com',          'URL absoluta'],
    ['http://sitefalso.com',           'URL absoluta sem TLS'],
    ['javascript:alert(1)',            'esquema executável'],
    ['/javascript:alert(1)',           'esquema depois da barra'],
    ['sitefalso.com',                  'sem barra: vira caminho relativo à origem do atacante'],
    ['/\tsitefalso.com',               'tabulação'],
    ['/\nhttps://sitefalso.com',       'quebra de linha'],
    ['/\rhttps://sitefalso.com',       'retorno de carro'],
    ['',                               'vazio'],
    ['   ',                            'só espaço'],
  ])('recusa "%s" (%s)', (entrada) => {
    expect(destinoAposLogin(entrada)).toBe(DESTINO_PADRAO)
  })

  it('recusa nulo e indefinido sem lançar', () => {
    expect(destinoAposLogin(null)).toBe(DESTINO_PADRAO)
    expect(destinoAposLogin(undefined)).toBe(DESTINO_PADRAO)
  })

  it('SEMPRE devolve caminho utilizável — nunca null', () => {
    // Devolver `null` daria a quem chama a chance de esquecer o caso recusado e usar o valor cru.
    for (const v of ['@x.com', '//x.com', '', 'javascript:1', '/ok']) {
      const r = destinoAposLogin(v)
      expect(typeof r).toBe('string')
      expect(r.startsWith('/')).toBe(true)
      expect(r.startsWith('//')).toBe(false)
    }
  })

  it('o destino legítimo passa intacto — a catraca não pode quebrar o uso real', () => {
    expect(destinoAposLogin('/dashboard/profissional')).toBe('/dashboard/profissional')
    expect(destinoAposLogin('/dashboard/convite/abc')).toBe('/dashboard/convite/abc')
    expect(destinoAposLogin('/dashboard?aba=exames')).toBe('/dashboard?aba=exames')
  })

  it('o parâmetro sai vazio quando o destino é o padrão — URL sem sujeira', () => {
    expect(paramDestino('/dashboard')).toBe('')
    expect(paramDestino('@sitefalso.com')).toBe('')
    expect(paramDestino('/dashboard/profissional')).toBe('?next=%2Fdashboard%2Fprofissional')
  })

  it('a rota do convite é montada num lugar só, e já vem escapada', () => {
    expect(rotaDoConvite('abc')).toBe('/dashboard/convite/abc')
    expect(rotaDoConvite('a/b')).toBe('/dashboard/convite/a%2Fb')
    // Escapada, ela sobrevive à própria validação — o token não pode virar um destino de fora.
    expect(destinoAposLogin(rotaDoConvite('../../evil'))).toMatch(/^\/dashboard\/convite\//)
  })
})

describe('ARCH · CATRACA — ninguém concatena `next` cru numa URL', () => {
  // A função só protege quem a chama. O defeito original não foi uma função mal escrita: foi uma
  // concatenação que não passava por função nenhuma.
  function varrer(dir: string, out: string[] = []): string[] {
    if (!existsSync(dir)) return out
    for (const n of readdirSync(dir)) {
      const p = join(dir, n)
      if (statSync(p).isDirectory()) varrer(p, out)
      else if (/\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n)) out.push(p)
    }
    return out
  }

  /**
   * A catraca mede CÓDIGO, não prosa. Sem isto ela acusava o comentário desta própria correção, que cita a
   * linha vulnerável literalmente — e um teste que reprova por causa da documentação do defeito ensina a
   * apagar a documentação.
   */
  function semComentarios(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  }

  /**
   * A REGRA NÃO É "não concatene". Concatenar destino em cima da origem é o que o redirect precisa fazer —
   * o código corrigido continua com `${origin}${next}`. A regra é: **o que se concatena tem de ter passado
   * pela validação**. Um arquivo que monta a URL sem nunca chamar `destinoAposLogin` é o defeito de volta.
   */
  const VARIAVEIS = '(next|redirect|returnTo|destino)'

  it('nenhum arquivo concatena destino que não passou por `destinoAposLogin`', () => {
    const suspeitos: string[] = []
    for (const base of ['src', 'apps/mobile/src', 'packages']) {
      for (const arquivo of varrer(join(ROOT, base))) {
        const src = semComentarios(readFileSync(arquivo, 'utf8'))
        const interpola = new RegExp(`\\$\\{\\s*origin\\s*\\}\\s*\\$\\{\\s*${VARIAVEIS}\\b`).test(src)
        const soma = new RegExp(`\\borigin\\s*\\+\\s*${VARIAVEIS}\\b`).test(src)
        if (!interpola && !soma) continue
        if (src.includes('destinoAposLogin')) continue // validado: é o uso legítimo
        suspeitos.push(arquivo.slice(ROOT.length + 1).replace(/\\/g, '/'))
      }
    }
    expect(
      suspeitos,
      'Concatenar destino NÃO validado em cima da origem permite `?next=@sitefalso.com`, que o navegador\n' +
        'resolve como OUTRO domínio usando a nossa origem como nome de usuário.\n' +
        'Passe por `destinoAposLogin` antes.\n\n' + suspeitos.join('\n'),
    ).toEqual([])
  })

  it('o callback do OAuth valida o destino — e não lê a query crua', () => {
    const src = semComentarios(readFileSync(join(ROOT, 'src/app/auth/callback/route.ts'), 'utf8'))
    expect(src, 'o callback precisa validar o destino').toContain('destinoAposLogin')
    expect(
      src.includes("searchParams.get('next') ?? '/dashboard'"),
      'a leitura crua com fallback voltou — era exatamente essa a linha vulnerável',
    ).toBe(false)
  })

  it('o login manda a pessoa para o destino validado, e não para um valor cru da URL', () => {
    const src = semComentarios(readFileSync(join(ROOT, 'src/app/login/page.tsx'), 'utf8'))
    expect(src).toContain('destinoAposLogin')
    // O OAuth também: sem isto, quem entra com Google perde o convite no caminho — o mesmo defeito por
    // outra porta.
    expect(src, 'o destino precisa atravessar o OAuth').toMatch(/redirectTo/)
  })
})

describe('CARE-003 · o token colado no aplicativo', () => {
  // Sem deep link: exigir um elevaria o piso do app para quem tem aparelho antigo, o que a disponibilidade
  // universal proíbe. Colar o link funciona em qualquer celular — e as duas pontas leem igual.
  const TOKEN = 'a'.repeat(64)

  it.each([
    [TOKEN,                                            'token cru'],
    [`https://sinteramais.com.br/convite/${TOKEN}`,    'link completo'],
    [`https://sinteramais.com.br/dashboard/convite/${TOKEN}`, 'rota autenticada'],
    [`  /convite/${TOKEN}  `,                          'caminho com espaços'],
    [`https://sinteramais.com.br/convite/${TOKEN}?x=1`, 'com query'],
    [`https://sinteramais.com.br/convite/${TOKEN}#a`,  'com âncora'],
    [TOKEN.toUpperCase(),                              'maiúsculas'],
  ])('reconhece %s (%s)', (entrada) => {
    expect(tokenDoLinkDeConvite(entrada)).toBe(TOKEN)
  })

  it.each([
    ['', 'vazio'],
    ['   ', 'só espaço'],
    ['bom dia', 'texto qualquer'],
    ['https://sinteramais.com.br/convite/', 'sem token'],
    ['https://sinteramais.com.br/convite/abc123', 'token curto'],
    [`https://sinteramais.com.br/convite/${'z'.repeat(64)}`, 'fora do hexadecimal'],
  ])('não reconhece "%s" (%s)', (entrada) => {
    expect(tokenDoLinkDeConvite(entrada)).toBeNull()
  })

  it('não aceita nulo nem indefinido', () => {
    expect(tokenDoLinkDeConvite(null)).toBeNull()
    expect(tokenDoLinkDeConvite(undefined)).toBeNull()
  })
})
