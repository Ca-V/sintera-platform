import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

// Escala canônica de espaçamento interno do container premium.
const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-10',
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Espaçamento interno canônico. Default 'md' (p-5). Use 'none' + className para paddings fora da escala. */
  padding?: CardPadding
}

// Card premium (Design System · TEMA B). Encapsula a classe canônica
// `.card-premium` (fundo branco, cantos 20px, sombra suave e realce de hover)
// para as páginas pararem de reescrever `<div className="card-premium p-5">` à
// mão. Mesmo visual — uma fonte única. Build-then-adopt: este é o primitivo de
// CONTAINER que faltava (ListCard = item de lista; EmptyState = estado vazio).
export default function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div className={cn('card-premium', PADDING[padding], className)} {...props}>
      {children}
    </div>
  )
}
