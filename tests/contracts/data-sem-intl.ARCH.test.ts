// ARCH · DATE-001 — data e hora não se formatam com `Intl` numa tela.
//
// ============================================================================================
// POR QUE ISTO IMPORTA, E POR QUE O LOCALE EXPLÍCITO NÃO RESOLVE
// ============================================================================================
// Todas as chamadas da plataforma passam `'pt-BR'`, então parecem seguras. Não são, por duas razões:
//
// 1. NO HERMES — o motor do aplicativo em Android — o `Intl` é reduzido e nem sempre traz os dados de pt-BR.
//    Quando não traz, ele NÃO falha: degrada para outro formato. A mesma função devolve "03 de jul. de 2026"
//    na Web e pode devolver "Jul 3, 2026" num celular, sem erro nenhum para acusar. E o resultado depende da
//    build do aparelho, então nem entre dois celulares há garantia.
//
// 2. `new Date('2026-07-03')` é lido como UTC. No Brasil (UTC-3) vira 02/07 às 21h, e a tela mostra o DIA
//    ANTERIOR. É o bug que `parseDateOnly` existe para impedir, e que reaparece toda vez que alguém constrói
//    o `Date` por conta própria.
//
// ============================================================================================
// A REGRA
// ============================================================================================
// Tela usa formatador do core. Os do core são determinísticos e cuidam do fuso.
//
// MOEDA FICA DE FORA: `toLocaleString(..., { style: 'currency' })` formata número, não data, e o risco de
// fuso não existe. A variação de separador entre motores é cosmética e não muda o valor.
//
// A DÍVIDA É NOMEADA, NÃO IGNORADA. Os arquivos abaixo já violavam a regra quando ela foi escrita. Estão
// listados um a um para que: (a) tela nova não possa entrar na lista, (b) a lista só encolha, e (c) ninguém
// precise redescobrir o problema. Tirar um arquivo daqui sem corrigi-lo faz a catraca reprovar.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { formatDateLongBR, formatDateBR } from '@sintera/core'

const ROOT = process.cwd()
const TELAS = ['src/app', 'apps/mobile/src/presentation']

/**
 * Arquivos que já formatavam data com `Intl` em 30/09/2026. Dívida declarada, para encolher.
 *
 * Não é allowlist permanente: cada um destes mostra uma data que pode sair diferente no celular. A ordem de
 * correção sensata é por quem a pessoa vê mais — Agenda, Histórico e Relatório antes de admin e preview.
 */
const DIVIDA: readonly string[] = [
  'src/app/admin/page.tsx',
  'src/app/api/agenda/reminders/route.ts',
  'src/app/dashboard/ciclo/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/conexoes/page.tsx',
  'src/app/dashboard/exams/[id]/page.tsx',
  'src/app/dashboard/insights/page.tsx',
  'src/app/dashboard/medicamentos/page.tsx',
  'src/app/dashboard/recursos/page.tsx',
  'src/app/dashboard/relatorio/page.tsx',
  'src/app/dashboard/saude/[slug]/page.tsx',
  'src/app/dashboard/saude/page.tsx',
  'src/app/dashboard/sinais-vitais/page.tsx',
  'src/app/dashboard/timeline/page.tsx',
  'src/app/r/[token]/page.tsx',
  'apps/mobile/src/presentation/screens/agenda/TimelineScreen.tsx',
  'apps/mobile/src/presentation/screens/minhasaude/CicloScreen.tsx',
  'apps/mobile/src/presentation/screens/minhasaude/MedicationsScreen.tsx',
]

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) varrer(p, out)
    else if (/\.(ts|tsx)$/.test(n) && !/\.test\.tsx?$/.test(n)) out.push(p)
  }
  return out
}

const semComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

/** Formata DATA ou HORA com Intl? Moeda e número puro não contam. */
function formataDataComIntl(src: string): boolean {
  for (const m of src.matchAll(/toLocale(Date|Time)?String\(([^)]*)\)/g)) {
    const args = m[2]
    if (/style:\s*['"]currency['"]/.test(args)) continue           // moeda: fora do alcance
    if (m[1] === undefined && !/day|month|year|hour|minute|weekday/.test(args)) continue  // número puro
    return true
  }
  return false
}

const arquivos = TELAS.flatMap(b => varrer(join(ROOT, b)))
  .map(p => ({ caminho: p.slice(ROOT.length + 1).replace(/\\/g, '/'), src: semComentarios(readFileSync(p, 'utf8')) }))

describe('ARCH · DATE-001 — os formatadores do core são determinísticos', () => {
  it('`formatDateLongBR` não usa Intl', () => {
    const src = readFileSync(join(ROOT, 'packages/core/src/domain/agenda/presentation.ts'), 'utf8')
    const corpo = /export function formatDateLongBR[\s\S]*?\n\}/.exec(src)?.[0] ?? ''
    expect(corpo, 'formatDateLongBR voltou a depender do Intl').not.toMatch(/toLocale/)
  })

  it('e produz o formato esperado, sem errar o dia por fuso', () => {
    // '2026-07-03' tem de sair como 03, e não 02 — que é o que acontece quando se lê a data como UTC.
    expect(formatDateLongBR('2026-07-03')).toBe('03 de jul. de 2026')
    expect(formatDateLongBR('2026-01-01')).toBe('01 de jan. de 2026')
    expect(formatDateLongBR('2026-12-31')).toBe('31 de dez. de 2026')
    expect(formatDateBR('2026-07-03')).toBe('03/07/2026')
  })

  it('entrada inválida devolve algo, e não quebra a tela', () => {
    expect(formatDateLongBR('')).toBe('')
    expect(formatDateLongBR('nao-e-data')).toBe('nao-e-data')
  })
})

describe('ARCH · CATRACA — tela nova não formata data com Intl', () => {
  it('a varredura encontra telas — senão a catraca não mede nada', () => {
    expect(arquivos.length).toBeGreaterThan(40)
  })

  it('nenhum arquivo FORA da dívida declarada formata data com Intl', () => {
    // So os CAMINHOS: despejar o conteudo do arquivo no relatorio torna a falha ilegivel.
    const novos = arquivos.filter(a => formataDataComIntl(a.src) && !DIVIDA.includes(a.caminho)).map(a => a.caminho)
    expect(
      novos,
      'Use `formatDateBR` ou `formatDateLongBR` do core: determinísticos e seguros para date-only.\n' +
        'No Hermes o Intl é reduzido e DEGRADA em silêncio — a mesma data sai diferente no celular.\n\n' +
        novos.join('\n'),
    ).toEqual([])
  })

  it('a dívida só encolhe — arquivo já corrigido sai da lista', () => {
    // Sem isto, a lista viraria depósito: um arquivo corrigido continuaria declarado como devedor, e a
    // catraca pararia de medir justamente o que passou a estar certo.
    const jaLimpos = DIVIDA.filter(d => {
      const a = arquivos.find(x => x.caminho === d)
      return a && !formataDataComIntl(a.src)
    })
    expect(
      jaLimpos,
      'Estes já não usam Intl para data — tire-os de DIVIDA:\n' + jaLimpos.join('\n'),
    ).toEqual([])
  })

  it('todo arquivo da dívida ainda existe', () => {
    const sumiram = DIVIDA.filter(d => !arquivos.some(a => a.caminho === d))
    expect(sumiram, 'arquivos removidos — limpe a lista:\n' + sumiram.join('\n')).toEqual([])
  })
})
