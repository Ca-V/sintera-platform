import { describe, it, expect, vi } from 'vitest'
import { clickableContainerProps } from './clickable'

describe('Convenção de cards clicáveis (onOpen)', () => {
  it('sem onOpen, não devolve props interativas', () => {
    expect(clickableContainerProps(undefined)).toEqual({})
  })

  it('com onOpen, devolve role/button + tabIndex + handlers', () => {
    const open = vi.fn()
    const p = clickableContainerProps(open)
    expect(p).toMatchObject({ role: 'button', tabIndex: 0 })
    expect(typeof p.onClick).toBe('function')
    expect(typeof p.onKeyDown).toBe('function')
  })

  it('onClick chama onOpen', () => {
    const open = vi.fn()
    clickableContainerProps(open).onClick()
    expect(open).toHaveBeenCalledOnce()
  })

  it('Enter e Espaço abrem; outras teclas não', () => {
    const open = vi.fn()
    const onKeyDown = clickableContainerProps(open).onKeyDown
    const ev = (key: string) => ({ key, preventDefault: vi.fn() }) as never
    onKeyDown(ev('Enter'))
    onKeyDown(ev(' '))
    onKeyDown(ev('a'))
    expect(open).toHaveBeenCalledTimes(2)
  })
})
