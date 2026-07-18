// FUNC · Q1 — estado do pedido (entidade histórica). PURO.
import { describe, it, expect } from 'vitest'
import { orderStatusOf, orderStatusLabel, effectiveOrderStatus, ORDER_STATUSES } from '@/lib/exams/orderStatus'

describe('Q1 · estado do pedido', () => {
  it('normaliza valores conhecidos; desconhecido/nulo → pendente', () => {
    expect(orderStatusOf('realizado')).toBe('realizado')
    expect(orderStatusOf('finalizado')).toBe('finalizado')
    expect(orderStatusOf('pendente')).toBe('pendente')
    expect(orderStatusOf(null)).toBe('pendente')
    expect(orderStatusOf('xpto')).toBe('pendente')
  })
  it('rótulos pt-BR', () => {
    expect(orderStatusLabel('realizado')).toBe('Realizado')
    expect(orderStatusLabel(undefined)).toBe('Pendente')
  })
  it('resultado vinculado prevalece → finalizado (1→N)', () => {
    expect(effectiveOrderStatus('pendente', 1)).toBe('finalizado')
    expect(effectiveOrderStatus('realizado', 3)).toBe('finalizado')
    expect(effectiveOrderStatus('realizado', 0)).toBe('realizado')
    expect(effectiveOrderStatus(null, 0)).toBe('pendente')
  })
  it('conjunto de estados é fechado', () => {
    expect(ORDER_STATUSES).toEqual(['pendente', 'realizado', 'finalizado'])
  })
})
