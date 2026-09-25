// ARCH · VAL-001 §4 — nenhum evento é emitido com nome fora do catálogo.
//
// POR QUE ISTO PRECISA DE CATRACA. O nome do evento é o que liga a medição de hoje à análise de daqui a seis
// meses. Se alguém emitir `first_value` na Web e `primeiro_valor` no aplicativo, ninguém percebe: as duas
// chamadas funcionam, as duas gravam, e o defeito só aparece quando o portão da §46 for calculado sobre uma
// série partida — quando já não há como voltar e regravar.
//
// Este teste varre o código à procura de nomes de evento escritos à mão e exige que cada um exista no
// catálogo do core. Acrescentar evento passa a ser um gesto deliberado: entra no catálogo primeiro.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { EVENTOS } from '@sintera/core'

const RAIZ = process.cwd()
const RAIZES = ['src', 'apps/mobile/src', 'packages/api-client/src'].map(p => join(RAIZ, p))

function varrer(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (e !== 'node_modules' && e !== '.next') varrer(p, out) }
    else if (/\.(ts|tsx)$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p)
  }
  return out
}

/** As três formas de nomear um evento no código hoje. */
const PADROES = [
  /event_name:\s*['"]([a-z0-9_]+)['"]/g,
  /logEvent\(\s*['"]([a-z0-9_]+)['"]/g,
  /logUsageEvent\([^,]+,\s*['"]([a-z0-9_]+)['"]/g,
]

function eventosEmitidos(): { nome: string; arquivo: string }[] {
  const achados: { nome: string; arquivo: string }[] = []
  for (const raiz of RAIZES) {
    for (const f of varrer(raiz)) {
      const src = readFileSync(f, 'utf8')
      for (const re of PADROES) {
        for (const m of src.matchAll(re)) {
          achados.push({ nome: m[1], arquivo: relative(RAIZ, f).replace(/\\/g, '/') })
        }
      }
    }
  }
  return achados
}

describe('VAL-001 §4 · CATRACA — todo evento emitido está no catálogo', () => {
  const emitidos = eventosEmitidos()

  it('o teste está mesmo encontrando eventos — senão passaria vazio e não protegeria nada', () => {
    expect(emitidos.length, 'nenhum evento encontrado no código; o padrão de busca deve ter quebrado')
      .toBeGreaterThan(0)
  })

  it('nenhum nome fora do catálogo do core', () => {
    const fora = emitidos
      .filter(e => !EVENTOS.includes(e.nome))
      .map(e => `${e.nome} (${e.arquivo})`)
    expect(
      [...new Set(fora)],
      'Acrescente o nome a packages/core/src/domain/telemetria/eventos.ts antes de emiti-lo. ' +
      'Nome fora do catálogo parte a série histórica sem que nada acuse.',
    ).toEqual([])
  })
})
