// @sintera/core · Relatório (assembleReport) — compilação factual: seleção de seções + item a item, filtro por
// período, split Agenda×Histórico (status), separação medicamentos×suplementos e medidas×sinais vitais.
import { describe, it, expect } from 'vitest'
import { assembleReport, serializeReportText, defaultSections, type ReportData, type ReportSelection } from '../../packages/core/src/domain/report/assemble'
import type { HealthEvent } from '../../packages/core/src/domain/agenda/event'
import type { BiomarkerRow } from '../../packages/core/src/domain/biomarkerGrouping'

const ev = (p: Partial<HealthEvent>): HealthEvent => ({
  id: 'e', type: 'consulta', title: '', isReturn: false, status: 'planejado', source: 'manual', priority: null,
  date: '2026-08-01', time: null, durationMin: null, reminderEnabled: false, reminderSentAt: null,
  professionalKind: null, professionalName: null, establishment: null, location: null, modality: null,
  preparation: null, notes: null, amountCents: null, directExpense: false, attachmentUrl: null,
  expenseDocType: null, links: [], outcome: null, recurrenceRule: null, seriesId: null, parentEventId: null,
  rootEventId: null, ...p,
} as HealthEvent)

const emptyData = (): ReportData => ({
  meds: [], events: [], exams: [], measures: [], conditions: [], habits: [], eyewear: [],
  omics: [], documents: [], contraceptives: [], menstruations: [], expenses: [], biomarkers: [],
})

const bio = (over: Partial<BiomarkerRow>): BiomarkerRow => ({
  id: 'b', name: 'Glicose', value: 90, unit: 'mg/dL', result_type: 'numeric', reference_min: 70, reference_max: 99,
  exam_id: 'x', exams: { exam_date: '2020-01-01', created_at: '2020-01-01' }, ...over,
})

describe('core · report · assembleReport', () => {
  it('split Agenda (aberto) × Histórico (fechado) pelo status do mesmo evento', () => {
    const data = emptyData()
    data.events = [
      ev({ id: 'a', status: 'planejado', title: 'Cardio', date: '2026-08-10' }),
      ev({ id: 'b', status: 'realizado', title: 'Retorno', date: '2026-07-20' }),
    ]
    const model = assembleReport(data, { sections: defaultSections(), period: { preset: 'all' } })
    const acomp = model.groups.find(g => g.title === 'Acompanhamento')!
    const agenda = acomp.sections.find(s => s.key === 'eventos')
    const hist = acomp.sections.find(s => s.key === 'registros')
    expect(agenda?.lines.some(l => l.includes('Cardio'))).toBe(true)
    expect(hist?.lines.some(l => l.includes('Retorno'))).toBe(true)
    expect(agenda?.lines.some(l => l.includes('Retorno'))).toBe(false)
  })

  it('período recorta os módulos temporais (evento fora da janela some)', () => {
    const data = emptyData()
    data.events = [ev({ id: 'old', status: 'realizado', title: 'Antigo', date: '2020-01-01' })]
    const now = new Date('2026-08-04T12:00:00Z')
    const model = assembleReport(data, { sections: defaultSections(), period: { preset: '7d' } }, now)
    expect(model.groups.length).toBe(0) // nada nos últimos 7 dias
  })

  it('Histórico de Exames respeita o período (biomarcador fora da janela some do relatório)', () => {
    const data = emptyData()
    data.biomarkers = [bio({})] // medição em 2020 → fora dos últimos 7 dias
    const now = new Date('2026-08-04T12:00:00Z')
    const histOf = (m: ReturnType<typeof assembleReport>) => m.groups.flatMap(g => g.sections).find(s => s.key === 'histexames')
    expect(histOf(assembleReport(data, { sections: defaultSections(), period: { preset: 'all' } }, now))?.lines.some(l => l.includes('Glicose'))).toBe(true)
    expect(histOf(assembleReport(data, { sections: defaultSections(), period: { preset: '7d' } }, now))).toBeUndefined()
  })

  it('medicamentos × suplementos separados; seleção item a item exclui por nome', () => {
    const data = emptyData()
    data.meds = [
      { name: 'Losartana', kind: 'medicamento', dose: '50mg', frequency: '1x/dia', startedOn: '2025-01-01', untilOn: null, status: 'em_uso' },
      { name: 'Vitamina D', kind: 'suplemento', dose: null, frequency: null, startedOn: null, untilOn: null, status: 'em_uso' },
    ]
    const sel: ReportSelection = { sections: defaultSections(), period: { preset: 'all' }, excluded: { suplementos: ['Vitamina D'] } }
    const model = assembleReport(data, sel)
    const saude = model.groups.find(g => g.title === 'Minha Saúde')!
    expect(saude.sections.find(s => s.key === 'medicamentos')?.lines.some(l => l.includes('Losartana'))).toBe(true)
    expect(saude.sections.find(s => s.key === 'suplementos')).toBeUndefined() // excluído → seção vazia → omitida
  })

  it('medidas corporais × sinais vitais vão para seções distintas', () => {
    const data = emptyData()
    data.measures = [
      { metric: 'peso', label: null, valueText: '80', unit: 'kg', date: '2026-08-01' },
      { metric: 'glicemia', label: null, valueText: '95', unit: 'mg/dL', date: '2026-08-01' },
    ]
    const model = assembleReport(data, { sections: defaultSections(), period: { preset: 'all' } })
    const acomp = model.groups.find(g => g.title === 'Acompanhamento')!
    expect(acomp.sections.find(s => s.key === 'medidas')?.lines.some(l => l.includes('80'))).toBe(true)
    expect(acomp.sections.find(s => s.key === 'sinais')?.lines.some(l => l.includes('95'))).toBe(true)
  })

  it('despesas incluem linha de Total somada', () => {
    const data = emptyData()
    data.expenses = [
      ev({ id: 'x1', type: 'consulta', title: 'A', date: '2026-08-01', amountCents: 10000 }),
      ev({ id: 'x2', type: 'exame', title: 'B', date: '2026-08-02', amountCents: 5000 }),
    ]
    const model = assembleReport(data, { sections: defaultSections(), period: { preset: 'all' } })
    const gastos = model.groups.find(g => g.title === 'Organização')!.sections.find(s => s.key === 'gastos')!
    expect(gastos.lines.some(l => l.includes('Total') && l.includes('150'))).toBe(true)
  })

  it('showEmpty inclui seção selecionada porém vazia com aviso "sem registros"', () => {
    const model = assembleReport(emptyData(), { sections: defaultSections(), period: { preset: 'all' }, showEmpty: true })
    const flat = model.groups.flatMap(g => g.sections)
    expect(flat.length).toBeGreaterThan(0)
    expect(flat.every(s => s.lines.length > 0)).toBe(true)
    expect(flat.some(s => s.lines[0].includes('sem registros'))).toBe(true)
  })

  it('ciclo mostra troca prevista (replaceOn) do contraceptivo', () => {
    const data = emptyData()
    data.contraceptives = [{ kind: 'diu_hormonal', brand: 'Mirena', startedOn: '2024-01-01', replaceOn: '2029-01-01', status: 'ativo' }]
    const model = assembleReport(data, { sections: defaultSections(), period: { preset: 'all' } })
    const ciclo = model.groups.find(g => g.title === 'Minha Saúde')!.sections.find(s => s.key === 'ciclo')!
    expect(ciclo.lines.some(l => l.includes('troca prevista') && l.includes('2029'))).toBe(true)
  })

  it('seção desligada não aparece; serializeReportText inclui período e cabeçalho', () => {
    const data = emptyData()
    data.expenses = [ev({ id: 'x', type: 'consulta', title: 'Consulta', date: '2026-08-01', amountCents: 12000 })]
    const sections = defaultSections(); sections.gastos = false
    const model = assembleReport(data, { sections, period: { preset: 'all' } })
    expect(model.groups.find(g => g.title === 'Organização')).toBeUndefined()
    const txt = serializeReportText(model, { title: 'Relatório', name: 'Fulana' })
    expect(txt).toContain('Período: Todo o histórico')
    expect(txt).toContain('Relatório')
  })
})
