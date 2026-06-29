import { describe, it, expect } from 'vitest'
import { normalizeReportSections, serializeReportSections, ALL_REPORT_SECTION_KEYS, defaultReportSelection } from './sections'

describe('normalizeReportSections — adaptador de compatibilidade v1 → v2', () => {
  it('traduz o link ANTIGO (v1) existente para a estrutura v2, preservando a intenção', () => {
    const v1 = ['medicamentos', 'condicoes', 'habitos', 'eventos', 'exames', 'medidas', 'sinais']
    const out = normalizeReportSections(v1)
    // medicamentos → 4 tipos; medidas → atuais+evolução; sinais → atuais+evolução; exames → exames+últimos
    expect(out).toContain('medicamento')
    expect(out).toContain('suplemento')
    expect(out).toContain('produto')
    expect(out).toContain('dispositivo')
    expect(out).toContain('medidasAtuais')
    expect(out).toContain('medidasEvolucao')
    expect(out).toContain('sinaisAtuais')
    expect(out).toContain('sinaisEvolucao')
    expect(out).toContain('ultimosExames')
    expect(out).toContain('exames')
    expect(out).toContain('condicoes')
    expect(out).toContain('habitos')
    expect(out).toContain('eventos')
    // não inclui ômica (não estava no link antigo)
    expect(out).not.toContain('omica')
  })

  it('chaves v2 são idempotentes (já normalizadas), na ordem oficial', () => {
    // medicamento(idx1) < medidasAtuais(idx6) < omica(idx11) → ordem preservada
    expect(normalizeReportSections(['omica', 'medicamento', 'medidasAtuais'])).toEqual(['medicamento', 'medidasAtuais', 'omica'])
  })

  it('"visao" (legado) vira subtipo de Dispositivos', () => {
    expect(normalizeReportSections(['visao'])).toEqual(['dispositivo'])
  })

  it('entrada inválida/ausente → todas as seções (seguro: mostra tudo)', () => {
    expect(normalizeReportSections(null)).toEqual(ALL_REPORT_SECTION_KEYS)
    expect(normalizeReportSections(undefined)).toEqual(ALL_REPORT_SECTION_KEYS)
    expect(normalizeReportSections('x')).toEqual(ALL_REPORT_SECTION_KEYS)
  })

  it('preserva a ordem oficial das seções', () => {
    const out = normalizeReportSections(['omica', 'condicoes', 'eventos'])
    expect(out).toEqual(ALL_REPORT_SECTION_KEYS.filter(k => ['omica', 'condicoes', 'eventos'].includes(k)))
  })
})

describe('serializeReportSections', () => {
  it('grava só as seções marcadas, na ordem oficial', () => {
    const sel = { ...defaultReportSelection(), suplemento: false, omica: false }
    const out = serializeReportSections(sel)
    expect(out).not.toContain('suplemento')
    expect(out).not.toContain('omica')
    expect(out).toContain('medicamento')
    expect(out).toEqual(ALL_REPORT_SECTION_KEYS.filter(k => k !== 'suplemento' && k !== 'omica'))
  })
})
