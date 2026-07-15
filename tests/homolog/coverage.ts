// HOMOLOGAÇÃO — matriz de COBERTURA (fundadora 15/07): visualizar objetivamente quais categorias
// de exame já foram homologadas e quais permanecem pendentes, sem depender de ler testes individuais.
// Puro/determinístico: deriva o status dos FIXTURES presentes (fonte da verdade = casos reais).

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/** Categorias de homologação de Exames (a matriz cobre todas). */
export const HOMOLOG_CATEGORIES = [
  { key: 'laboratorio_unico',  label: 'Laboratório — exame único' },
  { key: 'laboratorio_painel', label: 'Laboratório — painel (vários)' },
  { key: 'multi_exame',        label: 'Documento multi-exame (segmentação)' },
  { key: 'imagem',             label: 'Exame de imagem' },
  { key: 'qualitativo',        label: 'Documento qualitativo' },
  { key: 'pedido',             label: 'Pedido / solicitação / guia' },
] as const

export type HomologCategory = typeof HOMOLOG_CATEGORIES[number]['key']

export interface CategoryCoverage {
  key: string
  label: string
  cases: number                 // nº de casos reais fornecidos
  status: 'homologado' | 'pendente'
}

/** Conta os casos por categoria a partir dos fixtures e deriva o status (≥1 caso = homologado). */
export function computeCoverage(fixturesDir: string): CategoryCoverage[] {
  const counts = new Map<string, number>()
  if (existsSync(fixturesDir)) {
    for (const f of readdirSync(fixturesDir).filter(f => f.endsWith('.json'))) {
      try {
        const fx = JSON.parse(readFileSync(join(fixturesDir, f), 'utf8')) as { category?: string }
        if (fx.category) counts.set(fx.category, (counts.get(fx.category) ?? 0) + 1)
      } catch { /* ignora fixture malformado */ }
    }
  }
  return HOMOLOG_CATEGORIES.map(c => {
    const cases = counts.get(c.key) ?? 0
    return { key: c.key, label: c.label, cases, status: cases > 0 ? 'homologado' : 'pendente' }
  })
}

/** Percentual de categorias homologadas (0–100). */
export function coveragePercent(cov: CategoryCoverage[]): number {
  if (cov.length === 0) return 0
  const done = cov.filter(c => c.status === 'homologado').length
  return Math.round((done / cov.length) * 100)
}

/** Tabela textual da matriz — impressa pelo harness e reutilizável para gerar a COVERAGE.md. */
export function renderCoverageTable(cov: CategoryCoverage[]): string {
  const rows = cov.map(c => `| ${c.label} | ${c.status === 'homologado' ? '✅ homologado' : '⬜ pendente'} | ${c.cases} |`)
  return [
    `Cobertura de homologação (Exames): ${coveragePercent(cov)}%`,
    '| Categoria | Status | Casos |',
    '|---|---|---|',
    ...rows,
  ].join('\n')
}
