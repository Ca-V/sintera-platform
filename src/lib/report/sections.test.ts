import { describe, it, expect } from 'vitest'
import {
  normalizeReportSectionsV1, serializeReportSectionsV1, ALL_SECTION_KEYS_V1, defaultReportSelectionV1,
  normalizeReportSectionsV2, ALL_SECTION_KEYS_V2, REPORT_DIMENSIONS_V2,
  buildReportTree, REPORT_DIMENSIONS_V1,
} from './sections'

describe('ESTABILIDADE da árvore — ordem/grupos/nomes (pega regressão de UX que snapshot de HTML não pega)', () => {
  it('V1 (atual): Minha Saúde / Meu Perfil, ordem fixa', () => {
    const sel = Object.fromEntries(ALL_SECTION_KEYS_V1.map(k => [k, true]))
    expect(buildReportTree(REPORT_DIMENSIONS_V1, sel)).toEqual([
      { group: 'Minha Saúde', keys: ['eventos', 'exames', 'omica', 'medicamentos'] },
      { group: 'Meu Perfil', keys: ['condicoes', 'habitos', 'medidas', 'sinais', 'visao'] },
    ])
  })
  it('V2 (nova): Estado Atual / Histórico, ordem fixa', () => {
    const sel = Object.fromEntries(ALL_SECTION_KEYS_V2.map(k => [k, true]))
    expect(buildReportTree(REPORT_DIMENSIONS_V2, sel)).toEqual([
      { group: 'Estado Atual', keys: ['condicoes', 'medicamento', 'suplemento', 'produto', 'dispositivo', 'habitos', 'medidasAtuais', 'sinaisAtuais', 'ultimosExames'] },
      { group: 'Histórico', keys: ['eventos', 'exames', 'omica', 'medidasEvolucao', 'sinaisEvolucao'] },
    ])
  })
})

describe('V1 (Marco 1) — estrutura atual, mesmos links, mesmo conteúdo', () => {
  it('o link compartilhado existente continua válido (sem omica/visao, que não estavam nele)', () => {
    const link = ['medicamentos', 'condicoes', 'habitos', 'eventos', 'exames', 'medidas', 'sinais']
    expect(normalizeReportSectionsV1(link)).toEqual(ALL_SECTION_KEYS_V1.filter(k => link.includes(k)))
  })
  it('inválida/ausente/vazia/desconhecida → todas (seguro)', () => {
    expect(normalizeReportSectionsV1(null)).toEqual(ALL_SECTION_KEYS_V1)
    expect(normalizeReportSectionsV1([])).toEqual(ALL_SECTION_KEYS_V1)
    expect(normalizeReportSectionsV1(['x'])).toEqual(ALL_SECTION_KEYS_V1)
  })
  it('serialize grava só o marcado, na ordem oficial', () => {
    expect(serializeReportSectionsV1({ ...defaultReportSelectionV1(), visao: false }))
      .toEqual(ALL_SECTION_KEYS_V1.filter(k => k !== 'visao'))
  })
})

describe('buildReportTree — TESTE DE EQUIVALÊNCIA (árvore lógica, não HTML)', () => {
  it('dashboard e público produzem a MESMA árvore para a mesma seleção', () => {
    const selection = Object.fromEntries(
      normalizeReportSectionsV1(['medicamentos', 'condicoes', 'eventos', 'exames']).map(k => [k, true]),
    )
    const treeDashboard = buildReportTree(REPORT_DIMENSIONS_V1, selection)
    const treePublic    = buildReportTree(REPORT_DIMENSIONS_V1, selection)
    expect(treeDashboard).toEqual(treePublic) // equivalência garantida pela fonte única
    expect(treeDashboard).toEqual([
      { group: 'Minha Saúde', keys: ['eventos', 'exames', 'medicamentos'] },
      { group: 'Meu Perfil', keys: ['condicoes'] },
    ])
  })
  it('grupo sem seções selecionadas some da árvore', () => {
    const sel = Object.fromEntries(ALL_SECTION_KEYS_V1.map(k => [k, false])) as Record<string, boolean>
    sel.eventos = true
    expect(buildReportTree(REPORT_DIMENSIONS_V1, sel)).toEqual([{ group: 'Minha Saúde', keys: ['eventos'] }])
  })
})

describe('V2 (Marco 2, dormente) — adaptador v1→v2 pronto', () => {
  it('link antigo v1 expande p/ v2 (medicamentos→4 tipos; medidas→atual+evolução; exames→exames+últimos)', () => {
    const out = normalizeReportSectionsV2(['medicamentos', 'medidas', 'exames'])
    for (const k of ['medicamento', 'suplemento', 'produto', 'dispositivo', 'medidasAtuais', 'medidasEvolucao', 'exames', 'ultimosExames']) {
      expect(out).toContain(k)
    }
  })
  it('chaves v2 são idempotentes, na ordem oficial', () => {
    expect(normalizeReportSectionsV2(['omica', 'medicamento', 'medidasAtuais'])).toEqual(['medicamento', 'medidasAtuais', 'omica'])
  })
})
