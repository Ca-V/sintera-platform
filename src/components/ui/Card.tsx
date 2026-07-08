import { cn } from '@/lib/utils'
import { forwardRef, type HTMLAttributes } from 'react'

// Escala CANÔNICA de espaçamento interno do Design System (Onda 1 · TEMA B).
// A base histórica usava paddings ad-hoc (p-2..p-12); a Onda 1 normaliza para
// esta escala durante a adoção (com homologação visual por página). Casos fora
// da escala (ex.: dropdown p-2, item de lista p-3.5 = ListCard) NÃO são escopo
// de Card — usam componente próprio ou `padding="none"` + className.
//   none=0 · sm=p-4 (compacto) · md=p-5 (padrão) · lg=p-6 (confortável)
//   xl=p-8 (amplo: auth, docs) · 2xl=p-10 (estados vazios/loading centrados)
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
  '2xl': 'p-10',
}

// Classe canônica do card premium — FONTE ÚNICA reutilizada por Card, MotionCard
// e ActionCard, para o estilo do card viver num só lugar.
export function cardClassName(padding: CardPadding = 'md', className?: string) {
  return cn('card-premium', PADDING[padding], className)
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Espaçamento interno canônico. Default 'md' (p-5). */
  padding?: CardPadding
}

// Card premium (Design System · TEMA B). CONTAINER estático — painéis,
// formulários, estados vazios/loading, tiles. Encapsula a classe canônica
// `.card-premium` para as páginas pararem de reescrever `<div className="card-premium p-5">`.
//
// ESCOPO: apenas `<div>`. Cards animados → `MotionCard`; clicáveis → `ActionCard`.
// Encaminha `ref` (forwardRef), cobrindo scroll-to (`ref` + scroll-mt).
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cardClassName(padding, className)} {...props}>
      {children}
    </div>
  )
})

export default Card
