// ============================================================
// Convenção ÚNICA de cards clicáveis
// ============================================================
// Toda a Biblioteca usa a MESMA prop e o MESMO comportamento para "abrir":
// `onOpen`. Evita que cada card invente onClick/onSelect/onNavigate/onAction
// para a mesma intenção. Padroniza também o teclado (Enter/Espaço) e a a11y.
// ============================================================

import type { KeyboardEvent } from 'react'

export interface ClickableCardProps {
  /** abre o item (card inteiro clicável). Ausente ⇒ card não interativo. */
  onOpen?: () => void
}

interface ClickableHandlers {
  onClick: () => void
  role: 'button'
  tabIndex: 0
  onKeyDown: (e: KeyboardEvent) => void
}

/** Props para espalhar no container do card quando ele for clicável. */
export function clickableContainerProps(onOpen: () => void): ClickableHandlers
export function clickableContainerProps(onOpen?: () => void): ClickableHandlers | Record<string, never>
export function clickableContainerProps(onOpen?: () => void): ClickableHandlers | Record<string, never> {
  if (!onOpen) return {}
  return {
    onClick: onOpen,
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpen()
      }
    },
  }
}
