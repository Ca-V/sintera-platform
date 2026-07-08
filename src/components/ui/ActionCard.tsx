'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react'
import { cardClassName, type CardPadding } from './Card'

// Afordância interativa padrão dos cards clicáveis.
const INTERACTIVE = 'block w-full text-left transition-shadow hover:shadow-md'

type Common = { padding?: CardPadding; className?: string; children: ReactNode }
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common>
type AsLink = Common & { href: string } & Omit<ComponentProps<typeof Link>, keyof Common | 'href'>

// Card premium CLICÁVEL (Design System · TEMA B). Renderiza `<button>` (ação) ou
// `<Link>` (quando recebe `href`), com o estilo canônico do card + hover. Para os
// cards navegáveis/acionáveis que antes usavam
// `<button|Link className="card-premium …hover:shadow-md group">`.
export default function ActionCard(props: AsButton | AsLink) {
  if (props.href !== undefined) {
    const { padding, className, children, ...rest } = props
    return (
      <Link className={cardClassName(padding, cn(INTERACTIVE, className))} {...rest}>
        {children}
      </Link>
    )
  }
  // href descartado no ramo button (discriminante da união); não vai ao <button>.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { padding, className, children, href: _href, ...rest } = props
  return (
    <button className={cardClassName(padding, cn(INTERACTIVE, className))} {...rest}>
      {children}
    </button>
  )
}
