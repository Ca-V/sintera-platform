'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { EVOLUTION_WINDOWS, windowPoints, type EvolutionWindow } from '@/lib/ui/indicator'

export interface SeriesPoint {
  x: string
  y: number
}

interface IndicatorEvolutionCardProps {
  series: SeriesPoint[]
  /** linha de referência opcional (ex.: limite do laboratório) */
  reference?: number
  className?: string
}

const W = 300
const H = 96
const PAD = 8

function path(points: SeriesPoint[], min: number, max: number): { d: string; xs: number[]; ys: number[] } {
  const span = max - min || 1
  const step = points.length > 1 ? (W - 2 * PAD) / (points.length - 1) : 0
  const xs = points.map((_, i) => PAD + i * step)
  const ys = points.map((p) => PAD + (1 - (p.y - min) / span) * (H - 2 * PAD))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  return { d, xs, ys }
}

/**
 * Q3 — "Como evoluí?". Gráfico temporal com janelas (6m · 1 ano · todo histórico),
 * sem trocar de tela. Apenas apresentação: recebe a série por props.
 */
export default function IndicatorEvolutionCard({ series, reference, className }: IndicatorEvolutionCardProps) {
  const [win, setWin] = useState<EvolutionWindow>('1a')
  const points = windowPoints(series, win)

  const ys = points.map((p) => p.y)
  const min = Math.min(...ys, reference ?? Infinity)
  const max = Math.max(...ys, reference ?? -Infinity)
  const { d, xs, ys: py } = path(points, min, max)
  const refY = reference != null ? PAD + (1 - (reference - min) / ((max - min) || 1)) * (H - 2 * PAD) : null

  return (
    <div className={cn('rounded-2xl border border-border bg-white p-4', className)}>
      <div className="mb-3 flex gap-2">
        {EVOLUTION_WINDOWS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWin(w.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              win === w.id ? 'border-petal bg-blush text-petal-dark' : 'border-border bg-white text-mauve hover:bg-mist'
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      {points.length < 2 ? (
        <p className="py-6 text-center text-sm text-mauve">Sem medições suficientes para tendência.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolução do indicador no período">
          {refY != null && (
            <line x1={PAD} y1={refY} x2={W - PAD} y2={refY} stroke="var(--color-lavender)" strokeDasharray="4 3" strokeWidth="1" opacity="0.7" />
          )}
          <path d={d} fill="none" stroke="var(--color-petal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {xs.map((x, i) => (
            <circle key={i} cx={x} cy={py[i]} r="3" fill="var(--color-petal)" />
          ))}
        </svg>
      )}
    </div>
  )
}
