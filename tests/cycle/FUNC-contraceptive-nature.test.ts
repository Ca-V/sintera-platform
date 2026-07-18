// FUNC · CTC-001 — natureza do método contraceptivo + rótulos (categoria/timeline). PURO.
import { describe, it, expect } from 'vitest'
import {
  contraceptiveNature, isHormonalContraceptive, isDeviceContraceptive,
  contraceptiveCategoryLabel, contraceptiveStartLabel, contraceptiveStopLabel, CONTRACEPTIVE_KINDS,
  defaultCadenceFor, cadenceLabel, cadenceDays, cadenceUsageLabel, CONTRACEPTIVE_CADENCES,
} from '@/lib/cycle'

describe('CTC-001 · natureza do método', () => {
  it('hormonais: pílula/injeção/anel/adesivo', () => {
    for (const k of ['pilula', 'injecao', 'anel', 'adesivo']) {
      expect(contraceptiveNature(k)).toBe('hormonal')
      expect(isHormonalContraceptive(k)).toBe(true)
      expect(isDeviceContraceptive(k)).toBe(false)
    }
  })
  it('dispositivos: DIU (cobre/hormonal)/implante', () => {
    for (const k of ['diu_cobre', 'diu_hormonal', 'implante']) {
      expect(contraceptiveNature(k)).toBe('dispositivo')
      expect(isDeviceContraceptive(k)).toBe(true)
    }
  })
  it('toda kind da SSOT tem natureza definida (nunca undefined)', () => {
    for (const { value } of CONTRACEPTIVE_KINDS) expect(['hormonal', 'dispositivo', 'outro']).toContain(contraceptiveNature(value))
  })
})

describe('CTC-001 · rótulos', () => {
  it('categoria: hormonal → "Contracepção hormonal"; dispositivo → "Dispositivo contraceptivo"', () => {
    expect(contraceptiveCategoryLabel('pilula')).toBe('Contracepção hormonal')
    expect(contraceptiveCategoryLabel('diu_hormonal')).toBe('Dispositivo contraceptivo')
  })
  it('timeline preserva a natureza (contexto), não "Medicamento iniciado"', () => {
    expect(contraceptiveStartLabel('pilula')).toBe('Início do anticoncepcional')
    expect(contraceptiveStartLabel('diu_cobre')).toContain('Inserção do DIU')
    expect(contraceptiveStartLabel('implante')).toBe('Colocação do implante')
    expect(contraceptiveStopLabel('implante')).toBe('Remoção do implante')
    expect(contraceptiveStopLabel('diu_hormonal')).toContain('Remoção do DIU')
  })
})

describe('CTC-001 · cadência de recompra/reaplicação (hormonais)', () => {
  it('sugere cadência por método hormonal; dispositivos/outro → null', () => {
    expect(defaultCadenceFor('pilula')).toBe('mensal')
    expect(defaultCadenceFor('anel')).toBe('mensal')
    expect(defaultCadenceFor('adesivo')).toBe('semanal')
    expect(defaultCadenceFor('injecao')).toBe('trimestral')
    expect(defaultCadenceFor('diu_hormonal')).toBeNull()
    expect(defaultCadenceFor('outro')).toBeNull()
  })
  it('todo hormonal tem cadência default; nenhum dispositivo tem', () => {
    for (const { value } of CONTRACEPTIVE_KINDS) {
      if (isHormonalContraceptive(value)) expect(defaultCadenceFor(value)).not.toBeNull()
      if (isDeviceContraceptive(value)) expect(defaultCadenceFor(value)).toBeNull()
    }
  })
  it('rótulos e dias por cadência; valores inválidos degradam (não quebram)', () => {
    expect(cadenceLabel('mensal')).toBe('Mensal')
    expect(cadenceDays('trimestral')).toBe(90)
    expect(cadenceUsageLabel('semanal')).toBe('Recompra semanal')
    expect(cadenceLabel(null)).toBe('')
    expect(cadenceDays('xpto')).toBeNull()
    expect(cadenceUsageLabel(undefined)).toBe('')
  })
  it('cada cadência da SSOT tem dias positivos', () => {
    for (const c of CONTRACEPTIVE_CADENCES) expect(c.days).toBeGreaterThan(0)
  })
})
