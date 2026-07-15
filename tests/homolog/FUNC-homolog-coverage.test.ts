// FUNC · Matriz de COBERTURA da homologação de Exames (determinístico, roda na suíte rápida).
// Valida o cálculo objetivo de status por categoria — a visualização de progresso não depende de
// ler testes individuais nem de rodar a IA.

import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HOMOLOG_CATEGORIES, computeCoverage, coveragePercent, renderCoverageTable } from './coverage'

function withFixtures(cases: Array<{ category: string }>, fn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'homolog-'))
  try {
    cases.forEach((c, i) => writeFileSync(join(dir, `case-${i}.json`), JSON.stringify({ id: `c${i}`, ...c })))
    fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('homolog · matriz de cobertura', () => {
  it('sem fixtures → todas as categorias pendentes, 0%', () => {
    const cov = computeCoverage(join(tmpdir(), 'inexistente-homolog-dir'))
    expect(cov).toHaveLength(HOMOLOG_CATEGORIES.length)
    expect(cov.every(c => c.status === 'pendente')).toBe(true)
    expect(coveragePercent(cov)).toBe(0)
  })

  it('conta casos por categoria e marca homologado (≥1 caso)', () => {
    withFixtures([{ category: 'laboratorio_unico' }, { category: 'laboratorio_unico' }, { category: 'imagem' }], dir => {
      const cov = computeCoverage(dir)
      const byKey = Object.fromEntries(cov.map(c => [c.key, c]))
      expect(byKey.laboratorio_unico).toMatchObject({ cases: 2, status: 'homologado' })
      expect(byKey.imagem).toMatchObject({ cases: 1, status: 'homologado' })
      expect(byKey.pedido.status).toBe('pendente')
      // 2 de 6 categorias homologadas
      expect(coveragePercent(cov)).toBe(Math.round((2 / HOMOLOG_CATEGORIES.length) * 100))
    })
  })

  it('renderCoverageTable produz a matriz legível (com %)', () => {
    const table = renderCoverageTable(computeCoverage(join(tmpdir(), 'vazio-x')))
    expect(table).toContain('Cobertura de homologação')
    expect(table).toContain('| Categoria | Status | Casos |')
    expect(table).toContain('⬜ pendente')
  })
})
