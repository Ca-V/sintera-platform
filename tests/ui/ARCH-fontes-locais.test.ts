// ARCH — as fontes são locais, e o build não depende de nenhuma requisição externa.
//
// O QUE ISTO IMPEDE DE VOLTAR. O `next/font/google` baixa as fontes NO BUILD. Em 23 e 25/09/2026 esse download
// falhou no runner e derrubou o CI com `module-not-found` no `.module.css` da Hanken — duas vezes em dois
// dias, cada uma custando uma reexecução e travando um merge. Um build que depende de uma requisição externa
// falha por motivo que não é do código.
//
// A correção foi trazer os arquivos para o repositório. Esta catraca existe porque a correção é fácil de
// desfazer sem querer: basta alguém acrescentar uma fonte com `next/font/google` — o build passa na máquina
// dele, e a fragilidade volta sem nada acusar.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = process.cwd()
const FONTES = join(RAIZ, 'src', 'lib', 'ui', 'ds', 'fontes')

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (e !== 'node_modules' && e !== '.next') varrer(p, out) }
    else if (/\.(ts|tsx|js|jsx)$/.test(e)) out.push(p)
  }
  return out
}

describe('fontes · o build não busca nada na rede', () => {
  it('nenhum arquivo importa `next/font/google`', () => {
    const culpados = varrer(join(RAIZ, 'src'))
      .filter(f => /from ['"]next\/font\/google['"]/.test(readFileSync(f, 'utf8')))
      .map(f => relative(RAIZ, f).replace(/\\/g, '/'))
    expect(
      culpados,
      `Use next/font/local com os arquivos de src/lib/ui/ds/fontes — ver o cabeçalho de fonts.ts. Em: ${culpados.join(', ')}`,
    ).toEqual([])
  })

  it('os quatro arquivos de fonte estão versionados', () => {
    const esperados = [
      'Fraunces-latin.woff2',
      'HankenGrotesk-latin.woff2',
      'IBMPlexMono-400-latin.woff2',
      'IBMPlexMono-500-latin.woff2',
    ]
    const presentes = readdirSync(FONTES)
    for (const f of esperados) expect(presentes, `falta ${f}`).toContain(f)
  })

  it('cada fonte vem com a licença OFL — a redistribuição exige', () => {
    const presentes = readdirSync(FONTES)
    for (const l of ['OFL-Fraunces.txt', 'OFL-HankenGrotesk.txt', 'OFL-IBMPlexMono.txt']) {
      expect(presentes, `falta a licença ${l}`).toContain(l)
      expect(statSync(join(FONTES, l)).size, `${l} está vazia`).toBeGreaterThan(1000)
    }
  })
})

describe('fontes · as métricas de substituição não podem ser perdidas', () => {
  const css = readFileSync(join(RAIZ, 'src', 'app', 'globals.css'), 'utf8')

  // Os valores vêm do que `next/font/google` gerava, e são o que produção renderiza hoje. Se alguém os apagar
  // ou deixar o Next recalculá-los a partir do subconjunto latino, a Fraunces vai para size-adjust 126,68% —
  // uns 10% maior antes da troca, com salto visível numa tela de títulos.
  const esperado = [
    { familia: 'Fraunces Fallback', local: 'Times New Roman', ascent: '84.71%', descent: '22.09%', ajuste: '115.45%' },
    { familia: 'Hanken Grotesk Fallback', local: 'Arial', ascent: '99.07%', descent: '30.02%', ajuste: '100.94%' },
    { familia: 'IBM Plex Mono Fallback', local: 'Arial', ascent: '76.16%', descent: '20.43%', ajuste: '134.59%' },
  ]

  it.each(esperado)('$familia mantém as métricas exatas', ({ familia, local, ascent, descent, ajuste }) => {
    const bloco = css.match(new RegExp(`@font-face\\s*\\{[^}]*${familia}[^}]*\\}`))?.[0] ?? ''
    expect(bloco, `face de substituição ausente: ${familia}`).not.toBe('')
    expect(bloco).toContain(`local('${local}')`)
    expect(bloco).toContain(`ascent-override: ${ascent}`)
    expect(bloco).toContain(`descent-override: ${descent}`)
    expect(bloco).toContain(`size-adjust: ${ajuste}`)
  })

  it('as fontes declaram a substituta na cadeia — senão a métrica não seria usada', () => {
    const fonts = readFileSync(join(RAIZ, 'src', 'lib', 'ui', 'ds', 'fonts.ts'), 'utf8')
    for (const f of ['Fraunces Fallback', 'Hanken Grotesk Fallback', 'IBM Plex Mono Fallback']) {
      expect(fonts, `${f} fora da cadeia de fallback`).toContain(f)
    }
    // `adjustFontFallback` automático sobrescreveria os números medidos. Os comentários são retirados antes
    // de olhar: o cabeçalho do arquivo CITA a opção para explicar por que ela foi descartada, e uma catraca
    // que reprovasse a própria explicação empurraria a explicação para fora do código.
    const semComentarios = fonts.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(semComentarios, 'adjustFontFallback automático voltaria a recalcular a métrica')
      .not.toMatch(/adjustFontFallback:\s*'/)
    expect(semComentarios, 'adjustFontFallback precisa estar explicitamente desligado')
      .toMatch(/adjustFontFallback:\s*false/)
  })
})
