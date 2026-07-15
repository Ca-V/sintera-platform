// HOMOLOGAÇÃO — matriz de COBERTURA = INDICADOR OFICIAL de progresso da capacidade Exames
// (fundadora 15/07). O progresso é medido pela % de DIMENSÕES homologadas com DOCUMENTOS REAIS,
// não pela quantidade de testes. Enquanto houver dimensão pendente, Exames = "em desenvolvimento";
// só é CONCLUÍDO quando TODAS estiverem homologadas com docs reais e aprovadas pela Certificação.
//
// Puro/determinístico: deriva o status dos FIXTURES reais presentes (fonte da verdade).

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// As 8 DIMENSÕES oficiais de homologação de Exames (fundadora 15/07).
//  kind 'real_doc'      → só homologa com documento real (segmentação, imagem…).
//  kind 'deterministic' → a REGRA já é validada por teste determinístico (verde na suíte rápida),
//                         mas a homologação FINAL ainda exige confirmação com documento real.
export const HOMOLOG_DIMENSIONS = [
  { key: 'segmentacao',   label: 'Segmentação documental',                 kind: 'real_doc',      rule: null },
  { key: 'multi_exame',   label: 'Documentos com múltiplos exames',        kind: 'real_doc',      rule: null },
  { key: 'imagem',        label: 'Exames de imagem',                       kind: 'real_doc',      rule: null },
  { key: 'qualitativo',   label: 'Exames qualitativos',                    kind: 'real_doc',      rule: null },
  { key: 'cpe',           label: 'Integração completa do CPE ao fluxo',    kind: 'real_doc',      rule: null },
  { key: 'nomenclatura',  label: 'Nomenclatura dos cards',                 kind: 'deterministic', rule: 'ARCH-002 · FUNC-nomenclature-consistency' },
  { key: 'identificacao', label: 'Identificação (nome/laboratório/solicitante)', kind: 'deterministic', rule: 'card 3 linhas + E1 requesting_physician' },
  { key: 'estruturacao',  label: 'Política binária de estruturação',       kind: 'deterministic', rule: 'E3 (nunca "parcial")' },
] as const

export type HomologDimension = typeof HOMOLOG_DIMENSIONS[number]['key']

export interface DimensionCoverage {
  key: string
  label: string
  kind: 'real_doc' | 'deterministic'
  rule: string | null           // teste determinístico que já valida a regra (quando houver)
  cases: number                 // nº de casos REAIS fornecidos p/ esta dimensão
  status: 'homologado' | 'pendente'   // homologado = ≥1 caso real aprovado
}

/** Conta os casos reais por dimensão a partir dos fixtures e deriva o status. */
export function computeCoverage(fixturesDir: string): DimensionCoverage[] {
  const counts = new Map<string, number>()
  if (existsSync(fixturesDir)) {
    for (const f of readdirSync(fixturesDir).filter(f => f.endsWith('.json'))) {
      try {
        const fx = JSON.parse(readFileSync(join(fixturesDir, f), 'utf8')) as { category?: string; dimensions?: string[] }
        // Um caso pode cobrir 1+ dimensões (ex.: um laudo real valida nomenclatura E identificação).
        const dims = fx.dimensions ?? (fx.category ? [fx.category] : [])
        for (const d of dims) counts.set(d, (counts.get(d) ?? 0) + 1)
      } catch { /* ignora fixture malformado */ }
    }
  }
  return HOMOLOG_DIMENSIONS.map(d => {
    const cases = counts.get(d.key) ?? 0
    return { key: d.key, label: d.label, kind: d.kind, rule: d.rule, cases, status: cases > 0 ? 'homologado' : 'pendente' }
  })
}

/** Percentual de dimensões homologadas (0–100) — INDICADOR OFICIAL de progresso de Exames. */
export function coveragePercent(cov: DimensionCoverage[]): number {
  if (cov.length === 0) return 0
  return Math.round((cov.filter(c => c.status === 'homologado').length / cov.length) * 100)
}

/** Exames só é CONCLUÍDO quando 100% das dimensões homologadas com docs reais. */
export function isExamesConcluded(cov: DimensionCoverage[]): boolean {
  return cov.length > 0 && cov.every(c => c.status === 'homologado')
}

/** Tabela textual da matriz — impressa pelo harness e base da COVERAGE.md. */
export function renderCoverageTable(cov: DimensionCoverage[]): string {
  const rows = cov.map(c => {
    const st = c.status === 'homologado' ? '✅ homologado' : '⬜ pendente'
    const reg = c.rule ? `regra ✓ (${c.rule})` : '—'
    return `| ${c.label} | ${st} | ${c.cases} | ${reg} |`
  })
  return [
    `INDICADOR OFICIAL — Exames homologado: ${coveragePercent(cov)}% (${cov.filter(c => c.status === 'homologado').length}/${cov.length} dimensões)`,
    `Concluído: ${isExamesConcluded(cov) ? 'SIM' : 'NÃO (em desenvolvimento)'}`,
    '| Dimensão | Homologação (doc real) | Casos | Validação determinística |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n')
}
