// HOMOLOGAÇÃO — Exames (fundadora 15/07): matriz de casos + CRITÉRIOS OBJETIVOS de aprovação,
// para que a validação com DOCUMENTOS REAIS seja executável sem discussão durante o processo.
//
// Como usar (você só EXECUTA):
//   1. Coloque casos reais em tests/homolog/fixtures/exames/*.json (formato no README de lá).
//   2. Rode:  HOMOLOG=1 npm run test:homolog
//   3. Cada caso passa/reprova por critério OBJETIVO (sem julgamento manual).
// Sem HOMOLOG=1 ou sem fixtures, a suíte se AUTO-PULA (não bloqueia a fila de desenvolvimento).
//
// Esta camada homologa a REPRESENTAÇÃO DETERMINÍSTICA (classificação, nomenclatura, segmentação,
// quant×qual) sobre a extração real do documento. A parte não-determinística (PDF→IA→biomarcadores)
// é validada pela homologação de pipeline vivo (ambiente com app/IA) — ver README.

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { classifyExamDocument, deriveDisplayTitle } from '@/lib/capture/document-naming'

const FIXTURES_DIR = join(process.cwd(), 'tests', 'homolog', 'fixtures', 'exames')
const HOMOLOG = process.env.HOMOLOG === '1'

// ── Contrato do caso de homologação (fixture) ──────────────────────────────────
// Representa a EXTRAÇÃO de um documento real + o resultado ESPERADO (critério objetivo).
interface Fixture {
  id: string
  crc?: string                        // referência ao caso do CRC, quando houver
  category: 'laboratorio_unico' | 'laboratorio_painel' | 'imagem' | 'qualitativo' | 'multi_exame' | 'pedido'
  input: {
    examType: string | null
    text?: string | null
    biomarkers: Array<{ name: string; sourceExamName: string | null; resultType?: string | null; value?: string | null; valueText?: string | null }>
  }
  expected: {
    documentType?: string             // ex.: 'laboratory' | 'imaging' | 'medical_order'
    documentScope?: string            // 'single' | 'panel' | 'mixed'
    displayTitle?: string             // nome EXATO esperado no card
    displayTitleMatches?: string      // OU regex (quando o nome fiel varia)
    minDistinctExams?: number         // multi-exame: nº mínimo de exames distintos
  }
}

function loadFixtures(): Fixture[] {
  if (!existsSync(FIXTURES_DIR)) return []
  return readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(readFileSync(join(FIXTURES_DIR, f), 'utf8')) as Fixture)
}

const fixtures = loadFixtures()
const shouldRun = HOMOLOG && fixtures.length > 0

describe.skipIf(!shouldRun)('HOMOLOG · Exames — representação determinística sobre documentos reais', () => {
  it('há casos de homologação carregados', () => {
    expect(fixtures.length).toBeGreaterThan(0)
  })

  for (const fx of fixtures) {
    it(`[${fx.category}] ${fx.id}${fx.crc ? ` (CRC ${fx.crc})` : ''}`, () => {
      const structure = classifyExamDocument(fx.input)
      const title = deriveDisplayTitle(structure)

      if (fx.expected.documentType)  expect(structure.documentType, 'documentType').toBe(fx.expected.documentType)
      if (fx.expected.documentScope) expect(structure.documentScope, 'documentScope').toBe(fx.expected.documentScope)
      if (fx.expected.displayTitle)  expect(title, 'displayTitle').toBe(fx.expected.displayTitle)
      if (fx.expected.displayTitleMatches) expect(title, 'displayTitle~').toMatch(new RegExp(fx.expected.displayTitleMatches, 'i'))
      if (fx.expected.minDistinctExams != null) expect(structure.examCount, 'examCount').toBeGreaterThanOrEqual(fx.expected.minDistinctExams)
    })
  }
})

// Quando a suíte se auto-pula, deixa 1 caso visível (verde) explicando o estado — "aguardando
// homologação" não é falha; é ambiente pronto aguardando documentos reais + HOMOLOG=1.
describe.runIf(!shouldRun)('HOMOLOG · Exames — aguardando homologação (ambiente pronto)', () => {
  it('pula sem HOMOLOG=1 ou sem fixtures (não bloqueia a fila)', () => {
    expect(true).toBe(true)
  })
})
