// @sintera/validation — validadores puros do Perfil + infra de resultado.
import { describe, it, expect } from 'vitest'
import {
  ok, err, all,
  normalizeName, normalizePhone, validateName, validatePhone, validateProfileEditable, NAME_MAX,
} from '../../packages/validation/src'

describe('validation · infra (ValidationResult)', () => {
  it('ok/err carregam valor e mensagem', () => {
    expect(ok(5)).toEqual({ ok: true, value: 5 })
    expect(err('x')).toEqual({ ok: false, error: 'x' })
  })
  it('all encadeia e para no primeiro erro', () => {
    const inc = (n: number) => ok(n + 1)
    const fail = () => err('parou')
    expect(all(0, inc, inc)).toEqual({ ok: true, value: 2 })
    expect(all(0, inc, fail, inc)).toEqual({ ok: false, error: 'parou' })
  })
})

describe('validation · normalização', () => {
  it('normalizeName colapsa espaços e apara', () => {
    expect(normalizeName('  Ana   Maria  ')).toBe('Ana Maria')
    expect(normalizeName(null)).toBe('')
  })
  it('normalizePhone mantém "+" e só dígitos', () => {
    expect(normalizePhone('+55 (11) 99999-8888')).toBe('+5511999998888')
    expect(normalizePhone('(11) 3555 1234')).toBe('1135551234')
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone(null)).toBe('')
  })
})

describe('validation · validateName', () => {
  it('vazio → null (opcional)', () => {
    expect(validateName('')).toEqual({ ok: true, value: null })
    expect(validateName('   ')).toEqual({ ok: true, value: null })
  })
  it('presente → normalizado', () => {
    expect(validateName('  Carina  Leite ')).toEqual({ ok: true, value: 'Carina Leite' })
  })
  it('acima de 120 → erro', () => {
    const r = validateName('a'.repeat(NAME_MAX + 1))
    expect(r.ok).toBe(false)
  })
})

describe('validation · validatePhone', () => {
  it('vazio → null (opcional)', () => {
    expect(validatePhone('')).toEqual({ ok: true, value: null })
  })
  it('válido → normalizado', () => {
    expect(validatePhone('+55 (11) 99999-8888')).toEqual({ ok: true, value: '+5511999998888' })
  })
  it('poucos dígitos → erro', () => {
    expect(validatePhone('123').ok).toBe(false)
  })
})

describe('validation · validateProfileEditable', () => {
  it('name+phone válidos → normalizados', () => {
    expect(validateProfileEditable({ name: ' Ana ', phone: '11 99999-8888' }))
      .toEqual({ ok: true, value: { name: 'Ana', phone: '11999998888' } })
  })
  it('para no primeiro erro (nome longo)', () => {
    expect(validateProfileEditable({ name: 'a'.repeat(200), phone: '11999998888' }).ok).toBe(false)
  })
  it('ambos vazios → nulls', () => {
    expect(validateProfileEditable({})).toEqual({ ok: true, value: { name: null, phone: null } })
  })
})
