'use client'

import { cn } from '@/lib/utils'
import { Badge } from "@/lib/ui/ds"
import { REFERENCE_STATUS, type ReferenceStatus } from '@/lib/ui/indicator'
import { clickableContainerProps, type ClickableCardProps } from '@/lib/ui/clickable'

interface IndicatorSummaryCardProps extends ClickableCardProps {
  name: string
  value: string
  unit?: string
  status: ReferenceStatus
  /** data da coleta já formatada */
  collectedAt: string
  className?: string
}

/**
 * Q1 — "Como estou hoje?". Situação atual factual (RDC 657): último valor,
 * faixa do laboratório e data da coleta. Nunca interpreta.
 */
export default function IndicatorSummaryCard({ name, value, unit, status, collectedAt, onOpen, className }: IndicatorSummaryCardProps) {
  const ref = REFERENCE_STATUS[status]
  const clickable = Boolean(onOpen)
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-white p-4',
        clickable && 'cursor-pointer transition-all duration-200 hover:shadow-md',
        className
      )}
      {...clickableContainerProps(onOpen)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-body font-medium text-onyx">{name}</p>
        <Badge tone={ref.badge}>{ref.label}</Badge>
      </div>
      <p className="mt-2 text-3xl font-medium text-onyx">
        {value}{unit && <span className="ml-1 text-base text-mauve">{unit}</span>}
      </p>
      <p className="mt-1 text-xs text-mauve">última coleta · {collectedAt}</p>
    </div>
  )
}
