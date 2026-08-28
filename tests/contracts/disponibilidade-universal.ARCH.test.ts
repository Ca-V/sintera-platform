// ARCH · DISPONIBILIDADE UNIVERSAL — a plataforma abre em qualquer navegador e em qualquer aparelho.
//
// PRINCÍPIO (fundadora, 27/08/2026 — PERMANENTE e OBRIGATÓRIO):
//   • Mobile → qualquer aparelho (iOS, Android, outros), no MÁXIMO de versões possível.
//   • Web    → qualquer navegador: Chrome, Firefox, Safari ou outro.
//
// POR QUÊ: é plataforma de saúde. Quem tem aparelho antigo costuma ser quem tem menos, e é justamente quem mais
// depende de organizar o próprio cuidado. Excluir por versão de sistema ou de navegador é excluir por renda com
// outro nome.
//
// POR QUE UMA GUARDA, e não só o princípio escrito: `crypto.randomUUID` estava em 15 lugares quando o princípio
// foi declarado. Ninguém a colocou ali por descuido — ela parece universal. É o tipo de dependência que volta
// sozinha na próxima tela, porque o autocompletar sugere e o navegador de quem desenvolve tem.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { uuid, storageFileName } from '@sintera/core'

const ROOT = process.cwd()

/**
 * APIs que NÃO existem em todo navegador que a plataforma precisa atender, com o motivo.
 * Acrescentar aqui é barato; descobrir em produção, não.
 */
const APIS_NAO_UNIVERSAIS: { padrao: RegExp; nome: string; porque: string; alternativa: string }[] = [
  {
    padrao: /\bcrypto\.randomUUID\b/,
    nome: 'crypto.randomUUID',
    porque: 'Safari só a partir da 15.4, exige CONTEXTO SEGURO, e o Hermes (React Native) não a tem',
    alternativa: "uuid() de '@sintera/core'",
  },
  {
    padrao: /\bstructuredClone\b/,
    nome: 'structuredClone',
    porque: 'Safari só a partir da 15.4',
    alternativa: 'cópia explícita do que interessa',
  },
  {
    padrao: /\bObject\.groupBy\b|\bMap\.groupBy\b/,
    nome: 'Object.groupBy / Map.groupBy',
    porque: 'muito recente; ausente em navegadores ainda em uso',
    alternativa: 'reduce() explícito',
  },
  {
    padrao: /\.toSorted\(|\.toReversed\(|\.toSpliced\(/,
    nome: 'toSorted / toReversed / toSpliced',
    porque: 'Safari só a partir da 16.4',
    alternativa: '[...array].sort() / .reverse()',
  },
  {
    padrao: /\bIntl\.Segmenter\b/,
    nome: 'Intl.Segmenter',
    porque: 'ausente no Firefox por muito tempo',
    alternativa: 'divisão simples por espaço ou regex',
  },
]

/**
 * Onde a regra vale: código que RODA NO NAVEGADOR ou no aparelho.
 * Rotas de API e scripts de servidor ficam de fora — lá o ambiente é o Node, que temos sob controle.
 */
const SUPERFICIES_DO_CLIENTE = [
  'src/app/dashboard',
  'src/components',
  'src/lib',
  'apps/mobile/src',
  'packages/core/src',
  'packages/design-system/src',
  'packages/api-client/src',
]

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

/** Sem comentários: citar a API num comentário explicando por que NÃO usá-la não pode acusar. */
const semComentarios = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('ARCH · disponibilidade universal', () => {
  it('nenhuma superfície de cliente depende de API que só alguns navegadores têm', () => {
    const arquivos = SUPERFICIES_DO_CLIENTE.flatMap(d => varrer(join(ROOT, d)))
    const infratores: string[] = []

    for (const f of arquivos) {
      // O próprio módulo `ids` PODE usar `crypto.randomUUID` — ele é quem faz a escada de alternativas.
      if (rel(f).endsWith('packages/core/src/domain/ids.ts')) continue
      const corpo = semComentarios(readFileSync(f, 'utf8'))
      for (const api of APIS_NAO_UNIVERSAIS) {
        if (api.padrao.test(corpo)) {
          infratores.push(`${rel(f)}\n      usa ${api.nome} — ${api.porque}\n      use: ${api.alternativa}`)
        }
      }
    }

    expect(
      infratores,
      '\nDependência de API não universal em código que roda no navegador ou no aparelho:\n\n  ' +
        infratores.join('\n\n  ') +
        '\n\nA plataforma tem que abrir em QUALQUER navegador e QUALQUER aparelho (princípio de 27/08).\n' +
        'Uma API ausente não dá erro visível: o fluxo morre no meio e a pessoa conclui que nada funciona.\n',
    ).toEqual([])
  })
})

describe('uuid — funciona em qualquer ambiente', () => {
  it('devolve UUID v4 no formato certo', () => {
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('não repete', () => {
    const n = 500
    expect(new Set(Array.from({ length: n }, () => uuid())).size).toBe(n)
  })

  it('O CASO REAL: funciona sem `crypto.randomUUID` (Safari antigo, http, Hermes)', () => {
    const original = globalThis.crypto
    try {
      // Só `getRandomValues`, como num Safari 15.3 ou fora de contexto seguro.
      Object.defineProperty(globalThis, 'crypto', {
        value: { getRandomValues: original.getRandomValues.bind(original) },
        configurable: true,
      })
      expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true })
    }
  })

  it('funciona SEM crypto nenhum — último degrau, e ainda assim não quebra', () => {
    const original = globalThis.crypto
    try {
      Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true })
      const ids = Array.from({ length: 50 }, () => uuid())
      expect(ids.every(i => /^[0-9a-f-]{36}$/.test(i))).toBe(true)
      expect(new Set(ids).size).toBe(50)
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true })
    }
  })
})

describe('storageFileName — nome de arquivo vindo de fora não entra cru no caminho', () => {
  it('preserva a extensão', () => {
    expect(storageFileName('laudo.pdf')).toMatch(/\.pdf$/)
    expect(storageFileName('FOTO.JPEG')).toMatch(/\.jpeg$/)
  })

  it('descarta extensão suspeita em vez de repassá-la', () => {
    // Nome de arquivo é entrada de fora. Uma "extensão" com barra ou ponto entraria no caminho do storage.
    expect(storageFileName('arquivo.../etc/passwd')).not.toContain('/')
    expect(storageFileName('sem-extensao')).toMatch(/^[0-9a-f-]{36}$/)
    expect(storageFileName('x.' + 'a'.repeat(50))).toMatch(/^[0-9a-f-]{36}$/)
  })
})
