// FUNC · BOD-001 área ⑤ — Marcos da Evolução (projeções, sem tabela própria). PURO.
import { describe, it, expect } from 'vitest'
import { buildMilestones, medicationMilestones, consultaMilestones, MILESTONE_COLOR } from '@/lib/body/milestones'

describe('BOD-001 · marcos de medicamentos/suplementos', () => {
  it('início e suspensão; suplemento vira categoria própria; rastreável', () => {
    const ms = medicationMilestones([
      { id: 'm1', name: 'Ozempic', kind: 'medicamento', startedOn: '2026-01-10', untilOn: null, status: 'em_uso' },
      { id: 'm2', name: 'Creatina', kind: 'suplemento', startedOn: '2026-02-01', untilOn: '2026-06-01', status: 'suspenso' },
    ])
    const start = ms.find(m => m.key === 'med:m1:start')!
    expect(start.category).toBe('medicamento')
    expect(start.title).toBe('Início: Ozempic')
    expect(start.href).toBe('/dashboard/medicamentos')
    const stop = ms.find(m => m.key === 'med:m2:stop')!
    expect(stop.category).toBe('suplemento')
    expect(stop.date).toBe('2026-06-01')
    expect(stop.href).toBe('/dashboard/suplementos')
  })

  it('sem started_on → não gera marco de início (não inventa)', () => {
    const ms = medicationMilestones([{ id: 'm3', name: 'X', kind: 'medicamento', startedOn: null, untilOn: null, status: 'em_uso' }])
    expect(ms).toHaveLength(0)
  })
})

describe('BOD-001 · marcos de consultas (só corporais)', () => {
  it('inclui nutricionista/fisioterapeuta; ignora outras especialidades', () => {
    const ms = consultaMilestones([
      { id: 'c1', date: '2026-03-01', professionalKind: 'nutricionista', professionalLabel: 'Nutricionista', title: null },
      { id: 'c2', date: '2026-03-05', professionalKind: 'dentista', professionalLabel: 'Dentista', title: null },
      { id: 'c3', date: '2026-03-10', professionalKind: null, professionalLabel: null, title: null },
    ])
    expect(ms).toHaveLength(1)
    expect(ms[0].category).toBe('consulta')
    expect(ms[0].title).toContain('Nutricionista')
  })
})

describe('BOD-001 · buildMilestones', () => {
  it('junta as fontes e ordena por data (asc); sem tabela própria', () => {
    const all = buildMilestones({
      meds: [{ id: 'm1', name: 'A', kind: 'medicamento', startedOn: '2026-05-01', untilOn: null, status: 'em_uso' }],
      assessments: [{ date: '2026-01-15', sourceLabel: 'Bioimpedância', examId: 'e1' }],
      consultas: [{ id: 'c1', date: '2026-03-01', professionalKind: 'nutricionista', professionalLabel: 'Nutricionista', title: null }],
    })
    expect(all.map(m => m.date)).toEqual(['2026-01-15', '2026-03-01', '2026-05-01'])
    expect(all[0].category).toBe('avaliacao')
    expect(all[0].href).toBe('/dashboard/exams/e1')
  })

  it('toda categoria tem cor', () => {
    expect(Object.keys(MILESTONE_COLOR).sort()).toEqual(['avaliacao', 'consulta', 'medicamento', 'suplemento'])
  })
})
