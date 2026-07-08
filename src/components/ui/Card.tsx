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

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Espaçamento interno canônico. Default 'md' (p-5). */
  padding?: CardPadding
}

// Card premium (Design System · TEMA B). CONTAINER estático — painéis,
// formulários, estados vazios/loading, tiles. Encapsula a classe canônica
// `.card-premium` (fundo branco, cantos 20px, sombra suave, hover sutil) para as
// páginas pararem de reescrever `<div className="card-premium p-5">` à mão.
//
// ESCOPO: apenas `<div>`. Cards clicáveis (`<button>`/`<Link>`) e animados
// (`<motion.div>`) são OUTRO comportamento e terão componentes próprios — NÃO se
// adiciona polimorfismo aqui só para aumentar cobertura.
//
// Encaminha `ref` (forwardRef) para o `<div>`, cobrindo padrões como scroll-to
// (`ref={formRef}` + scroll-mt).
const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padding = 'md', className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn('card-premium', PADDING[padding], className)} {...props}>
      {children}
    </div>
  )
})

export default Card
