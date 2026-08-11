// FUNC — serviço de domínio de Recursos de Saúde (lógica pura de payload).
import { describe, it, expect } from 'vitest'
import { buildResourcePayload } from '@/lib/recursos/service'
import { ValidationError } from '@/lib/api/http'

describe('buildResourcePayload', () => {
  it('exige nome — vazio lança ValidationError', () => {
    expect(() => buildResourcePayload('u1', { resourceType: 'auxilio', name: '  ', status: 'em_uso' }))
      .toThrow(ValidationError)
  })

  it('faz trim do nome e carimba user_id', () => {
    const p = buildResourcePayload('u1', { resourceType: 'auxilio', name: '  Bengala  ', status: 'em_uso' })
    expect(p.name).toBe('Bengala')
    expect(p.user_id).toBe('u1')
  })

  it('normaliza vazios para null (brand/prescriber/datas/notes/file)', () => {
    const p = buildResourcePayload('u1', {
      resourceType: 'auxilio', name: 'X', status: 'em_uso',
      brand: '  ', prescriber: '', startedOn: '', untilDate: '  ', notes: '', fileUrl: '',
    })
    expect(p.brand).toBeNull()
    expect(p.prescriber).toBeNull()
    expect(p.started_on).toBeNull()
    expect(p.until_date).toBeNull()
    expect(p.notes).toBeNull()
    expect(p.file_url).toBeNull()
  })

  it('preserva valores com trim', () => {
    const p = buildResourcePayload('u1', {
      resourceType: 'correcao_visual', name: 'Óculos', status: 'suspenso',
      brand: ' Zeiss ', startedOn: '2026-01-02',
    })
    expect(p.brand).toBe('Zeiss')
    expect(p.started_on).toBe('2026-01-02')
    expect(p.status).toBe('suspenso')
    expect(p.resource_type).toBe('correcao_visual')
  })

  it('tipo/status desconhecidos caem para defaults; attributes default {}', () => {
    // @ts-expect-error — normalização de entrada inesperada
    const p = buildResourcePayload('u1', { resourceType: 'nave', name: 'X', status: 'quebrado' })
    expect(p.resource_type).toBe('dispositivo_medico')
    expect(p.status).toBe('em_uso')
    expect(p.attributes).toEqual({})
  })

  it('attributes é preservado como veio', () => {
    const attrs = { vision_kind: 'oculos', od: { sph: '-2,00' } }
    const p = buildResourcePayload('u1', { resourceType: 'correcao_visual', name: 'X', status: 'em_uso', attributes: attrs })
    expect(p.attributes).toEqual(attrs)
  })
})
