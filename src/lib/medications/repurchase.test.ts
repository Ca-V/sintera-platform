import { describe, it, expect } from 'vitest'
import { totalUnits, runoutDate, recompraDate, recompraFromFrequency, nextRepurchaseDate } from './repurchase'

describe('totalUnits — considera o número de embalagens', () => {
  it('multiplica unidades/embalagem pelo nº de embalagens', () => {
    expect(totalUnits(30, 2)).toBe(60) // 2 caixas de 30
  })
  it('default = 1 embalagem quando acquiredQty ausente/zero', () => {
    expect(totalUnits(30, null)).toBe(30)
    expect(totalUnits(30, 0)).toBe(30)
    expect(totalUnits(30)).toBe(30)
  })
  it('sem unidades por embalagem ⇒ null', () => {
    expect(totalUnits(null, 2)).toBeNull()
    expect(totalUnits(0, 2)).toBeNull()
  })
})

describe('runoutDate — REGRESSÃO REV-01 (EFEXOR: 2 caixas não viram 15 dias)', () => {
  // EFEXOR: 1 caixa = 30 comprimidos, 2 comprimidos/dia, 2 CAIXAS compradas.
  // Total = 60 comprimidos ÷ 2/dia = 30 dias (não 15).
  it('2 caixas de 30 a 2/dia ⇒ 30 dias (antes dava 15)', () => {
    expect(runoutDate('2026-06-01', 30, 2, 2)).toBe('2026-07-01')
  })
  it('1 caixa de 30 a 2/dia ⇒ 15 dias (comportamento de uma embalagem preservado)', () => {
    expect(runoutDate('2026-06-01', 30, 2, 1)).toBe('2026-06-16')
  })
  it('acquiredQty ausente ⇒ assume 1 embalagem', () => {
    expect(runoutDate('2026-06-01', 30, 2)).toBe('2026-06-16')
  })
  it('faltando dados ⇒ null', () => {
    expect(runoutDate(null, 30, 2, 2)).toBeNull()
    expect(runoutDate('2026-06-01', null, 2, 2)).toBeNull()
    expect(runoutDate('2026-06-01', 30, 0, 2)).toBeNull()
  })
})

describe('recompraDate — ~5 dias antes do término, considerando as embalagens', () => {
  it('2 caixas (término 01/07) ⇒ recompra ~26/06', () => {
    // purchasedOn no passado distante o suficiente p/ o término (01/07/2026) cair
    // antes de "hoje" no ambiente de teste seria clampado; usamos data bem futura.
    expect(recompraDate('2099-06-01', 30, 2, 2)).toBe('2099-06-26')
  })
})

describe('recompraFromFrequency — recorrência declarada (compra + intervalo)', () => {
  it('trimestral ⇒ compra + 3 meses', () => {
    expect(recompraFromFrequency('2099-03-15', 'trimestral')).toBe('2099-06-15')
  })
  it('mensal/bimestral/semestral/anual em meses', () => {
    expect(recompraFromFrequency('2099-01-10', 'mensal')).toBe('2099-02-10')
    expect(recompraFromFrequency('2099-01-10', 'bimestral')).toBe('2099-03-10')
    expect(recompraFromFrequency('2099-01-10', 'semestral')).toBe('2099-07-10')
    expect(recompraFromFrequency('2099-01-10', 'anual')).toBe('2100-01-10')
  })
  it('semanal/quinzenal em dias', () => {
    expect(recompraFromFrequency('2099-01-10', 'semanal')).toBe('2099-01-17')
    expect(recompraFromFrequency('2099-01-10', 'quinzenal')).toBe('2099-01-25')
  })
  it('sem data ou sem frequência ⇒ null', () => {
    expect(recompraFromFrequency(null, 'trimestral')).toBeNull()
    expect(recompraFromFrequency('2099-01-10', null)).toBeNull()
    expect(recompraFromFrequency('2099-01-10', 'inexistente')).toBeNull()
  })
})

describe('nextRepurchaseDate — HIERARQUIA (consumo > recorrência > nada)', () => {
  it('1) havendo consumo, usa o cálculo por consumo (ignora a recorrência)', () => {
    // consumo dá término 16/06 → recompra 11/06; mesmo com "trimestral" definido
    expect(nextRepurchaseDate('2099-06-01', 30, 2, 1, 'trimestral')).toBe('2099-06-11')
  })
  it('2) sem consumo, cai na recorrência declarada (o bug do trimestral)', () => {
    expect(nextRepurchaseDate('2099-03-15', null, null, null, 'trimestral')).toBe('2099-06-15')
  })
  it('3) sem consumo e sem recorrência ⇒ null (não cria recompra)', () => {
    expect(nextRepurchaseDate('2099-03-15', null, null, null, null)).toBeNull()
  })
})
