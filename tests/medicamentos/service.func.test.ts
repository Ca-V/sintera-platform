// FUNC — serviço de Medicamentos (validação + parsing puro de buildMedPayload).
import { describe, it, expect } from 'vitest'
import { buildMedPayload } from '@/lib/medicamentos/service'
import { ValidationError } from '@/lib/api/http'

const base = { kind: 'medicamento' as const, status: 'em_uso' as const, repurchase: false, form: 'comprimido' }

describe('buildMedPayload', () => {
  it('exige nome', () => {
    expect(() => buildMedPayload('u1', { ...base, name: '   ' })).toThrow(ValidationError)
  })

  it('medicamento/suplemento exigem forma farmacêutica', () => {
    expect(() => buildMedPayload('u1', { kind: 'medicamento', status: 'em_uso', repurchase: false, name: 'Losartana', form: '' }))
      .toThrow(ValidationError)
    // produto/dispositivo não exigem forma
    expect(buildMedPayload('u1', { kind: 'produto', status: 'em_uso', repurchase: false, name: 'Fralda', form: '' }).name).toBe('Fralda')
  })

  it('num: só positivo; 0/vazio/inválido → null', () => {
    const p = buildMedPayload('u1', { ...base, name: 'X', acquiredQty: '10', packQty: '0', dailyCons: 'abc' })
    expect(p.acquired_quantity).toBe(10)
    expect(p.pack_quantity).toBeNull()
    expect(p.daily_consumption).toBeNull()
  })

  it('toCents: vírgula BR e R$', () => {
    expect(buildMedPayload('u1', { ...base, name: 'X', amount: '250,00' }).amount_cents).toBe(25000)
    expect(buildMedPayload('u1', { ...base, name: 'X', amount: 'R$ 1.500,00' }).amount_cents).toBe(150000)
    expect(buildMedPayload('u1', { ...base, name: 'X', amount: '' }).amount_cents).toBeNull()
  })

  it('repurchase false → repurchase_frequency null (mesmo se enviado)', () => {
    const p = buildMedPayload('u1', { ...base, name: 'X', repurchase: false, repurchaseFreq: 'mensal' })
    expect(p.repurchase_frequency).toBeNull()
    expect(p.repurchase_reminder).toBe(false)
  })

  it('normaliza brand/dose vazios para null e carimba user_id', () => {
    const p = buildMedPayload('u1', { ...base, name: ' Dipirona ', brand: '  ', dose: '500 mg' })
    expect(p.name).toBe('Dipirona')
    expect(p.brand).toBeNull()
    expect(p.dose).toBe('500 mg')
    expect(p.user_id).toBe('u1')
  })
})
