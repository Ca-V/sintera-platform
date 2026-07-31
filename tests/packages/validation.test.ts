// @sintera/validation — validadores puros do Perfil + infra de resultado.
import { describe, it, expect } from 'vitest'
import {
  ok, err,
  normalizeName, normalizePhone, validateName, validatePhone, validateProfileEditable, NAME_MAX,
} from '../../packages/validation/src'

describe('validation · infra (ValidationResult)', () => {
  it('ok/err carregam valor e mensagem', () => {
    expect(ok(5)).toEqual({ ok: true, value: 5 })
    expect(err('x')).toEqual({ ok: false, error: 'x' })
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

describe('validation · robustez do nome (unicode/acentos/emoji/hífen/compostos)', () => {
  it('acentos e ç preservados', () => {
    expect(validateName('José Conceição')).toEqual({ ok: true, value: 'José Conceição' })
  })
  it('nome composto com hífen preservado', () => {
    expect(validateName('Ana-Maria Souza-Lima')).toEqual({ ok: true, value: 'Ana-Maria Souza-Lima' })
  })
  it('emoji não quebra (preservado; espaços colapsados)', () => {
    expect(validateName('  Ana   😀  Maria ')).toEqual({ ok: true, value: 'Ana 😀 Maria' })
  })
  it('tabs/quebras de linha viram espaço único', () => {
    expect(validateName('Ana\tMaria\nSouza')).toEqual({ ok: true, value: 'Ana Maria Souza' })
  })
  it('undefined → null (opcional)', () => {
    expect(validateName(undefined)).toEqual({ ok: true, value: null })
  })
  it('exatamente 120 chars é aceito; 121 rejeita (fronteira)', () => {
    expect(validateName('a'.repeat(120)).ok).toBe(true)
    expect(validateName('a'.repeat(121)).ok).toBe(false)
  })
})

describe('validation · robustez do telefone (DDI/DDD/máscara/malformado)', () => {
  it('DDI + DDD + máscara → dígitos com +', () => {
    expect(validatePhone('+55 (11) 99999-8888')).toEqual({ ok: true, value: '+5511999998888' })
  })
  it('DDD sem DDI (sem +) → só dígitos', () => {
    expect(validatePhone('(11) 3555-1234')).toEqual({ ok: true, value: '1135551234' })
  })
  it('letras/prefixo são descartados', () => {
    expect(validatePhone('tel: 11 3555 1234')).toEqual({ ok: true, value: '1135551234' })
  })
  it('só "+" → null (sem dígitos = opcional)', () => {
    expect(validatePhone('+')).toEqual({ ok: true, value: null })
  })
  it('poucos dígitos (malformado) → erro', () => {
    expect(validatePhone('11 999').ok).toBe(false)
  })
  it('undefined/espaços → null', () => {
    expect(validatePhone(undefined)).toEqual({ ok: true, value: null })
    expect(validatePhone('   ')).toEqual({ ok: true, value: null })
  })
})
