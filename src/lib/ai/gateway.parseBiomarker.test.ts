// Fidelidade da Ingestão (RF-01/RF-02): parseBiomarker captura o contexto do laudo
// (source_material / source_exam_name) como texto original e retorna null quando
// ausente — NÃO inventa contexto (governança fundadora 03/07 / RDC 657).
import { describe, it, expect, vi } from 'vitest'
// gateway importa (transitivamente) prompt-loader → supabase/server (server-only).
// Stub para isolar a função PURA parseBiomarker no ambiente de teste.
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }))
import { parseBiomarker } from './gateway'

describe('parseBiomarker — contexto do laudo (RF-01/RF-02)', () => {
  it('captura source_material e source_exam_name quando presentes', () => {
    const r = parseBiomarker({
      name: 'Hemoglobina', value: 13.5, unit: 'g/dL',
      source_material: 'Sangue venoso', source_exam_name: 'Hemograma',
    })
    expect(r?.sourceMaterial).toBe('Sangue venoso')
    expect(r?.sourceExamName).toBe('Hemograma')
  })

  it('retorna null quando o laudo não informa (não inventa contexto)', () => {
    const r = parseBiomarker({ name: 'Glicose', value: 92, unit: 'mg/dL' })
    expect(r?.sourceMaterial).toBeNull()
    expect(r?.sourceExamName).toBeNull()
  })

  it('cada biomarcador carrega o próprio contexto (sem vazamento entre exames)', () => {
    const a = parseBiomarker({ name: 'pH', value: 7.35, source_material: 'Sangue venoso', source_exam_name: 'Gasometria venosa' })
    const b = parseBiomarker({ name: 'Leucócitos', value: 7000, source_material: 'Sangue', source_exam_name: 'Hemograma' })
    expect(a?.sourceExamName).toBe('Gasometria venosa')
    expect(b?.sourceExamName).toBe('Hemograma')
  })

  it('valor não-string vira null (defensivo)', () => {
    const r = parseBiomarker({ name: 'X', value: 1, source_material: 123, source_exam_name: {} })
    expect(r?.sourceMaterial).toBeNull()
    expect(r?.sourceExamName).toBeNull()
  })

  it('rangeExtracted só é true com AMBOS os limites numéricos (flag do modelo é ignorado)', () => {
    expect(parseBiomarker({ name: 'A', value: 1, reference_min: 10, reference_max: 20 })?.rangeExtracted).toBe(true)
    expect(parseBiomarker({ name: 'B', value: 1, reference_min: 10 })?.rangeExtracted).toBe(false)
    expect(parseBiomarker({ name: 'C', value: 1, reference_max: 20 })?.rangeExtracted).toBe(false)
    expect(parseBiomarker({ name: 'D', value: 1 })?.rangeExtracted).toBe(false)
    // flag do modelo NÃO força true sem os dois limites:
    expect(parseBiomarker({ name: 'E', value: 1, reference_min: 10, range_extracted: true })?.rangeExtracted).toBe(false)
    // ...nem força false quando os dois limites existem:
    expect(parseBiomarker({ name: 'F', value: 1, reference_min: 10, reference_max: 20, range_extracted: false })?.rangeExtracted).toBe(true)
  })
})
