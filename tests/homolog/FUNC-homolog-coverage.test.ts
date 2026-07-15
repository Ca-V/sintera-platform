// FUNC · Matriz de COBERTURA = indicador oficial de progresso de Exames (determinístico, suíte rápida).
// Valida o cálculo objetivo por DIMENSÃO — o progresso não depende de ler testes nem de rodar a IA.

import { describe, it, expect } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HOMOLOG_DIMENSIONS, computeCoverage, coveragePercent, isExamesConcluded, renderCoverageTable } from './coverage'

function withFixtures(cases: Array<{ category?: string; dimensions?: string[] }>, fn: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'homolog-'))
  try {
    cases.forEach((c, i) => writeFileSync(join(dir, `case-${i}.json`), JSON.stringify({ id: `c${i}`, ...c })))
    fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('homolog · matriz de cobertura (8 dimensões oficiais)', () => {
  it('cobre exatamente as 8 dimensões da fundadora (15/07)', () => {
    expect(HOMOLOG_DIMENSIONS.map(d => d.key)).toEqual([
      'segmentacao', 'multi_exame', 'imagem', 'qualitativo', 'cpe', 'nomenclatura', 'identificacao', 'estruturacao',
    ])
  })

  it('sem fixtures → todas pendentes, 0%, NÃO concluído', () => {
    const cov = computeCoverage(join(tmpdir(), 'inexistente-homolog-dir'))
    expect(cov.every(c => c.status === 'pendente')).toBe(true)
    expect(coveragePercent(cov)).toBe(0)
    expect(isExamesConcluded(cov)).toBe(false)
  })

  it('conta casos por dimensão; um caso pode cobrir várias dimensões', () => {
    withFixtures([
      { dimensions: ['nomenclatura', 'identificacao'] },   // 1 laudo real valida 2 dimensões
      { category: 'imagem' },
    ], dir => {
      const cov = computeCoverage(dir)
      const byKey = Object.fromEntries(cov.map(c => [c.key, c]))
      expect(byKey.nomenclatura).toMatchObject({ cases: 1, status: 'homologado' })
      expect(byKey.identificacao.status).toBe('homologado')
      expect(byKey.imagem.status).toBe('homologado')
      expect(byKey.cpe.status).toBe('pendente')
      expect(coveragePercent(cov)).toBe(Math.round((3 / HOMOLOG_DIMENSIONS.length) * 100))
    })
  })

  it('só concluído com 100% das dimensões homologadas', () => {
    withFixtures(HOMOLOG_DIMENSIONS.map(d => ({ dimensions: [d.key] })), dir => {
      const cov = computeCoverage(dir)
      expect(coveragePercent(cov)).toBe(100)
      expect(isExamesConcluded(cov)).toBe(true)
    })
  })

  it('renderCoverageTable expõe o indicador oficial + coluna de validação determinística', () => {
    const table = renderCoverageTable(computeCoverage(join(tmpdir(), 'vazio-x')))
    expect(table).toContain('INDICADOR OFICIAL')
    expect(table).toContain('em desenvolvimento')
    expect(table).toContain('Validação determinística')
    expect(table).toContain('regra ✓') // dimensões determinísticas mostram a regra já validada
  })
})
