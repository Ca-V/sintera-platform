// FUNC · EXA-C1 (multi-exame) — agrupamento "partes do mesmo documento" (NC-0010). PURO.
import { describe, it, expect } from 'vitest'
import { bundlePartInfo, bundlePartLabel, groupBundleParts, type BundleFields } from '@/lib/exams/bundleGroup'

const ex = (p: Partial<BundleFields> & { id: string }): BundleFields => ({
  source_bundle_exam_id: null, bundle_cdu_index: null, bundle_cdu_count: null, ...p,
})

describe('bundlePartInfo', () => {
  it('exame comum (sem bundle) → não é parte', () => {
    const i = bundlePartInfo(ex({ id: 'a' }))
    expect(i.isPart).toBe(false)
    expect(bundlePartLabel(i)).toBeNull()
  })
  it('bundle de 1 (count=1) → não é parte', () => {
    expect(bundlePartInfo(ex({ id: 'a', source_bundle_exam_id: 'a', bundle_cdu_index: 1, bundle_cdu_count: 1 })).isPart).toBe(false)
  })
  it('raiz de um documento com 3 partes', () => {
    const i = bundlePartInfo(ex({ id: 'root', source_bundle_exam_id: 'root', bundle_cdu_index: 1, bundle_cdu_count: 3 }))
    expect(i).toMatchObject({ isPart: true, index: 1, count: 3, rootId: 'root', isRoot: true })
    expect(bundlePartLabel(i)).toBe('Parte 1 de 3 de um documento')
  })
  it('parte irmã aponta para a raiz', () => {
    const i = bundlePartInfo(ex({ id: 's2', source_bundle_exam_id: 'root', bundle_cdu_index: 2, bundle_cdu_count: 3 }))
    expect(i).toMatchObject({ isPart: true, index: 2, count: 3, rootId: 'root', isRoot: false })
  })
})

describe('groupBundleParts', () => {
  it('mantém as partes do mesmo documento adjacentes e ordenadas por índice, preservando a ordem dos grupos', () => {
    const list = [
      ex({ id: 'x' }),                                                                       // isolado
      ex({ id: 's3', source_bundle_exam_id: 'root', bundle_cdu_index: 3, bundle_cdu_count: 3 }),
      ex({ id: 'y' }),                                                                       // isolado
      ex({ id: 'root', source_bundle_exam_id: 'root', bundle_cdu_index: 1, bundle_cdu_count: 3 }),
      ex({ id: 's2', source_bundle_exam_id: 'root', bundle_cdu_index: 2, bundle_cdu_count: 3 }),
    ]
    // 1ª aparição do grupo-bundle é em s3; o grupo assume essa posição, ordenado root→s2→s3.
    expect(groupBundleParts(list).map(e => e.id)).toEqual(['x', 'root', 's2', 's3', 'y'])
  })
})
