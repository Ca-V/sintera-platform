// ARCH · BASE ÚNICA — toda decisão que vale para as duas pontas mora num lugar só.
//
// PRINCÍPIO (fundadora, 27/08/2026 — PERMANENTE e OBRIGATÓRIO): todo incremento de função ou alteração é feito
// numa BASE ÚNICA que serve Web e Mobile. A exceção é estreita e explícita: função que só existe numa das
// plataformas por natureza dela.
//
// A DISTINÇÃO QUE IMPORTA, e que é fácil errar:
//   • o MECANISMO pode ser diferente — a Web redimensiona com canvas, o aplicativo com biblioteca nativa;
//     a Web usa `<input type="time">`, o aplicativo usa um seletor nativo. Isso é legítimo e inevitável.
//   • a DECISÃO não pode — qual o tamanho máximo, qual a qualidade, o que conta como fato transcrito, o que
//     é aviso e o que é erro, qual o texto que a pessoa lê. Duas implementações da mesma decisão divergem, e
//     divergem em SILÊNCIO: ninguém percebe até alguém comparar as duas telas.
//
// POR QUE UMA CATRACA, e não só o princípio escrito: em 27/08, ao auditar, achei que a Web reduzia a imagem
// para 1600px antes de enviar ao classificador e o aplicativo mandava o arquivo inteiro. Os números viviam
// dentro do arquivo da Web. Ninguém decidiu divergir — a segunda implementação simplesmente não soube da
// primeira. E a consequência não era estética: a foto de celular estourava o limite de requisição, e a leitura
// assistida não funcionava no aplicativo.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()

const WEB = ['src/app', 'src/components', 'src/lib']
const MOBILE = ['apps/mobile/src']

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === '.next' || n.startsWith('.')) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) varrer(p, out)
    else if (/\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n)) out.push(p)
  }
  return out
}
const rel = (p: string) => relative(ROOT, p).split('\\').join('/')
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/**
 * Constante de POLÍTICA declarada no arquivo: `const NOME_ASSIM = <literal>`, em CAIXA_ALTA.
 * A convenção é o sinal — quem escreve em caixa alta está declarando uma decisão, não uma variável local.
 *
 * DERIVAÇÃO não conta, e o critério é a PROCEDÊNCIA do valor — não a sintaxe dele. Se o lado direito cita algo
 * importado de um pacote compartilhado, a decisão já mora num lugar só e isto aqui é adaptação de MECANISMO:
 *
 *     const PRIORITIES = eventPriorityOptions().map(o => ({ id: o.value, label: o.label }))
 *
 * O `Select` da Web pede `{value,label}` e o `Chips` do aplicativo pede `{id,label}`. Formatos diferentes da
 * MESMA lista. O que a catraca proíbe é a segunda lista escrita à mão — o literal que ninguém decidiu duplicar.
 *
 * Julgar por procedência, e não por formato do valor, é o que faz a regra sobreviver: um ternário sobre copy
 * compartilhada passa, e um array literal de rótulos não passa nem se alguém o disfarçar de expressão.
 */
const PACOTES = /@sintera\/(core|validation|api-client|design-system|types|utils|config)/

/** Identificadores importados dos pacotes compartilhados neste arquivo. */
function importadosDoCompartilhado(corpo: string): Set<string> {
  const nomes = new Set<string>()
  for (const m of corpo.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    if (!PACOTES.test(m[2])) continue
    for (const parte of m[1].split(',')) {
      const nome = parte.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.trim()
      if (nome) nomes.add(nome)
    }
  }
  return nomes
}

function constantesDePolitica(corpo: string): Map<string, string> {
  const limpo = semComentarios(corpo)
  const doCompartilhado = importadosDoCompartilhado(limpo)
  const achadas = new Map<string, string>()
  for (const m of limpo.matchAll(/^\s*(?:export\s+)?const\s+([A-Z][A-Z0-9_]{3,})\s*=\s*([^\n]+)$/gm)) {
    const valor = m[2].trim().replace(/,$/, '')
    const deriva = [...doCompartilhado].some(n => new RegExp(`\\b${n}\\b`).test(valor))
    if (deriva) continue
    achadas.set(m[1], valor)
  }
  return achadas
}

describe('ARCH · base única entre Web e Mobile', () => {
  it('nenhuma constante de POLÍTICA é declarada nas DUAS pontas', () => {
    const daWeb = new Map<string, string[]>()      // nome → arquivos
    const doMobile = new Map<string, string[]>()

    const coletar = (dirs: string[], alvo: Map<string, string[]>) => {
      for (const f of dirs.flatMap(d => varrer(join(ROOT, d)))) {
        for (const nome of constantesDePolitica(readFileSync(f, 'utf8')).keys()) {
          alvo.set(nome, [...(alvo.get(nome) ?? []), rel(f)])
        }
      }
    }
    coletar(WEB, daWeb)
    coletar(MOBILE, doMobile)

    const duplicadas = [...daWeb.keys()]
      .filter(nome => doMobile.has(nome))
      .map(nome => `${nome}\n      Web:    ${daWeb.get(nome)!.join(', ')}\n      Mobile: ${doMobile.get(nome)!.join(', ')}`)

    expect(
      duplicadas,
      '\nA MESMA constante de política declarada nas duas pontas:\n\n  ' +
        duplicadas.join('\n\n  ') +
        '\n\nDecisão que vale para as duas mora em `packages/core` — as telas leem de lá.\n' +
        'Duas declarações da mesma decisão divergem, e divergem em silêncio.\n' +
        'Se for mesmo específico de plataforma (um limite do sistema operacional, por exemplo), renomeie para\n' +
        'deixar isso explícito no nome.\n',
    ).toEqual([])
  })

  it('a política de preparo de imagem vive no core, não nas telas', () => {
    // O caso concreto que originou esta guarda. Os números NÃO voltam para dentro das plataformas.
    const infratores = [...WEB, ...MOBILE]
      .flatMap(d => varrer(join(ROOT, d)))
      .filter(f => {
        const corpo = semComentarios(readFileSync(f, 'utf8'))
        // Declarar o número; usar a constante importada do core não conta.
        return /^\s*(?:export\s+)?const\s+[A-Z_]*(?:MAX_LADO|MAX_SIDE|IMAGE_MAX|QUALIDADE|IMAGE_QUALITY)[A-Z_]*\s*=/m.test(corpo)
      })
      .map(rel)

    expect(
      infratores,
      '\nPolítica de imagem declarada fora do core:\n  ' + infratores.join('\n  ') +
        '\n\nUse `targetImageSize`, `IMAGE_QUALITY` e `IMAGE_MAX_SIDE` de @sintera/core.\n' +
        'O mecanismo é de cada plataforma (canvas na Web, nativo no aplicativo); a decisão não.\n',
    ).toEqual([])
  })
})
