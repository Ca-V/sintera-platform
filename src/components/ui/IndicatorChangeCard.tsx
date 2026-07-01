'use client'

import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp, Minus, Target } from 'lucide-react'

type ChangeIcon = 'down' | 'up' | 'flat' | 'target'

const ICON = { down: TrendingDown, up: TrendingUp, flat: Minus, target: Target }

export interface Reading {
  icon?: ChangeIcon
  text: string
}

interface IndicatorChangeCardProps {
  readings: Reading[]
  className?: string
}

/**
 * Q2 — "O que mudou?". Leitura factual (saída de analyzeSeries + referenceReadout):
 * tendência, ritmo, aderência à referência. Sempre descritivo — nunca "bom/ruim".
 */
export default function IndicatorChangeCard({ readings, className }: IndicatorChangeCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border bg-white p-4', className)}>
      <ul className="flex flex-col gap-2">
        {readings.map((r, i) => {
          const Icon = ICON[r.icon ?? 'flat']
          return (
            <li key={i} className="flex items-center gap-2 text-sm text-onyx">
              <Icon className="h-4 w-4 shrink-0 text-mauve" aria-hidden="true" />
              {r.text}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
