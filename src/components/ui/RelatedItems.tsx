'use client'

import { cn } from '@/lib/utils'
import type { RelatedItem } from '@/lib/ui/related'
import { ChevronRight } from 'lucide-react'

interface RelatedItemsProps {
  items: RelatedItem[]
  /** moldura em linguagem natural (EventLink explicado), ex.: "Este resultado está relacionado a:" */
  title?: string
  /** abre sob demanda (colapsado por padrão) — mantém a Timeline legível */
  collapsible?: boolean
  className?: string
}

function Row({ item }: { item: RelatedItem }) {
  const clickable = Boolean(item.onOpen || item.href)
  const inner = (
    <div className={cn('flex items-center gap-3 px-3 py-2.5', clickable && 'transition-colors hover:bg-mist')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {item.type && <span className="shrink-0 text-xs text-lavender">{item.type}</span>}
          <span className="truncate font-body text-sm text-onyx">{item.title}</span>
        </div>
        {item.description && <p className="truncate text-xs text-mauve">{item.description}</p>}
      </div>
      {clickable && <ChevronRight className="h-4 w-4 shrink-0 text-mauve" aria-hidden="true" />}
    </div>
  )
  if (item.href) return <a href={item.href} className="block">{inner}</a>
  if (item.onOpen) return (
    <button type="button" onClick={item.onOpen} className="block w-full text-left">{inner}</button>
  )
  return inner
}

function List({ items }: { items: RelatedItem[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item, i) => (
        <li key={item.href ?? `${item.title}-${i}`}><Row item={item} /></li>
      ))}
    </ul>
  )
}

/**
 * Lista de itens relacionados — transversal, agnóstico de domínio (só RelatedItem).
 * Materializa o "Relacionado" (EventLink) em linguagem natural. Oculto quando vazio.
 * `collapsible`: abre sob demanda (Timeline); senão, expandido (página de detalhe).
 */
export default function RelatedItems({ items, title = 'Relacionado', collapsible = false, className }: RelatedItemsProps) {
  if (items.length === 0) return null

  // 1 relacionado: mostra direto, sem disclosure (não faz sentido "( 1 )")
  if (collapsible && items.length === 1) {
    return (
      <section className={cn('overflow-hidden rounded-2xl border border-border bg-white', className)}>
        <p className="px-3 pt-2 text-xs font-medium text-mauve">{title}</p>
        <List items={items} />
      </section>
    )
  }

  if (collapsible) {
    return (
      <details className={cn('group overflow-hidden rounded-2xl border border-border bg-white', className)}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-mauve [&::-webkit-details-marker]:hidden">
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" aria-hidden="true" />
          {title} <span className="text-lavender">({items.length})</span>
        </summary>
        <div className="border-t border-border">
          <List items={items} />
        </div>
      </details>
    )
  }

  return (
    <section className={cn('overflow-hidden rounded-2xl border border-border bg-white', className)}>
      <h3 className="border-b border-border px-3 py-2 text-xs font-medium text-mauve">{title}</h3>
      <List items={items} />
    </section>
  )
}
