'use client'

import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

interface ReportSectionProps {
  /** número da seção (ordem narrativa) */
  index?: number
  title: string
  subtitle?: string
  /** abre sob demanda (ex.: Anexos) */
  collapsible?: boolean
  children: React.ReactNode
  className?: string
}

function Header({ index, title, subtitle }: { index?: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      {index != null && (
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blush text-[11px] text-petal-dark">{index}</span>
      )}
      <span className="font-body font-medium text-onyx">{title}</span>
      {subtitle && <span className="text-xs text-mauve">· {subtitle}</span>}
    </div>
  )
}

/**
 * Unidade de composição do Relatório. Reutilizada em web · PDF · impressão ·
 * compartilhamento. Só organiza o conteúdo recebido — não cria conhecimento.
 */
export default function ReportSection({ index, title, subtitle, collapsible, children, className }: ReportSectionProps) {
  if (collapsible) {
    return (
      <details className={cn('group overflow-hidden rounded-2xl border border-border bg-white', className)}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <ChevronRight className="h-4 w-4 shrink-0 text-mauve transition-transform group-open:rotate-90" aria-hidden="true" />
          <Header index={index} title={title} subtitle={subtitle} />
        </summary>
        <div className="border-t border-border p-4">{children}</div>
      </details>
    )
  }
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-border bg-white', className)}>
      <div className="border-b border-border px-4 py-3"><Header index={index} title={title} subtitle={subtitle} /></div>
      <div className="p-4">{children}</div>
    </section>
  )
}
