import { describe, it, expect } from 'vitest'
import { planBundleSplit, restrictPages, type SplitInputCdu } from '@/lib/capture/bundle-split'

// FUNC — Bundle Split (M3). "1 upload → N registros" é consequência da Segmentação. Puro/determinístico.
// Nunca achata N exames num só; nunca divide automaticamente quando há revisão técnica.

const cdu = (index: number, pages: number[], extra: Partial<SplitInputCdu> = {}): SplitInputCdu => ({
  index, pages, title: `CDU ${index}`, discoveredUnits: 1, status: 'certified', ...extra,
})

describe('FUNC · planBundleSplit', () => {
  it('bundle de 1 CDU → sem split, processa o intervalo da própria CDU', () => {
    const plan = planBundleSplit({ cdus: [cdu(1, [0, 1, 2])], isRoot: true })
    expect(plan.split).toBe(false)
    expect(plan.count).toBe(1)
    expect(plan.thisRange).toEqual({ start: 0, end: 2 })
    expect(plan.siblings).toHaveLength(0)
  })

  it('bundle de 3 CDUs na raiz → split: este vira CDU#1, cria 2 irmãos (caso AXIAL)', () => {
    const plan = planBundleSplit({
      cdus: [cdu(1, [0]), cdu(2, [1]), cdu(3, [2])],
      isRoot: true,
    })
    expect(plan.split).toBe(true)
    expect(plan.count).toBe(3)
    expect(plan.thisRange).toEqual({ start: 0, end: 0 })
    expect(plan.siblings).toHaveLength(2)
    expect(plan.siblings.map(s => s.index)).toEqual([2, 3])
    expect(plan.siblings[0].range).toEqual({ start: 1, end: 1 })
    expect(plan.siblings[1].range).toEqual({ start: 2, end: 2 })
  })

  it('CDU em revisão TÉCNICA → NÃO divide automaticamente (retém para revisão)', () => {
    const plan = planBundleSplit({
      cdus: [cdu(1, [0]), cdu(2, [1], { status: 'needs_review', reviewType: 'technical' })],
      isRoot: true,
    })
    expect(plan.split).toBe(false)
    expect(plan.blockedTechnical).toBe(true)
    expect(plan.siblings).toHaveLength(0)
  })

  it('revisão CLÍNICA (falta extrator) NÃO bloqueia o split', () => {
    const plan = planBundleSplit({
      cdus: [cdu(1, [0]), cdu(2, [1], { status: 'needs_review', reviewType: 'clinical' })],
      isRoot: true,
    })
    expect(plan.split).toBe(true)
    expect(plan.blockedTechnical).toBe(false)
    expect(plan.siblings).toHaveLength(1)
  })

  it('exame que JÁ é irmão (existingRange) → processa só o seu intervalo, nunca redivide', () => {
    const plan = planBundleSplit({
      cdus: [cdu(1, [0]), cdu(2, [1]), cdu(3, [2])],
      isRoot: false,
      existingRange: { start: 1, end: 1 },
    })
    expect(plan.split).toBe(false)
    expect(plan.thisRange).toEqual({ start: 1, end: 1 })
    expect(plan.siblings).toHaveLength(0)
  })

  it('multi-CDU mas NÃO é raiz (sem intervalo) → não cria irmãos (evita duplicação)', () => {
    const plan = planBundleSplit({
      cdus: [cdu(1, [0]), cdu(2, [1])],
      isRoot: false,
    })
    expect(plan.split).toBe(false)
    expect(plan.siblings).toHaveLength(0)
  })

  it('é DETERMINÍSTICO', () => {
    const cdus = [cdu(1, [0]), cdu(2, [1])]
    const a = JSON.stringify(planBundleSplit({ cdus, isRoot: true }))
    const b = JSON.stringify(planBundleSplit({ cdus, isRoot: true }))
    expect(a).toBe(b)
  })
})

describe('FUNC · restrictPages', () => {
  it('recorta o intervalo inclusivo', () => {
    expect(restrictPages(['a', 'b', 'c', 'd'], { start: 1, end: 2 })).toEqual(['b', 'c'])
  })
  it('range nulo → todas as páginas', () => {
    expect(restrictPages(['a', 'b'], null)).toEqual(['a', 'b'])
  })
  it('intervalo de 1 página', () => {
    expect(restrictPages(['a', 'b', 'c'], { start: 2, end: 2 })).toEqual(['c'])
  })
})
