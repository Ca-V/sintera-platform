'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

type Trend = 'up' | 'down' | 'neutral'

interface MetricCardProps {
  title: string
  value: string
  unit?: string
  subtitle: string
  trend?: Trend
  trendLabel?: string
  icon: React.ReactNode
  color: 'rose' | 'lavender' | 'sage' | 'gold'
  delay?: number
}

const colorMap = {
  rose: {
    bg: 'bg-blush',
    icon: 'bg-petal-light text-petal-dark',
    value: 'text-petal-dark',
    bar: 'bg-petal',
  },
  lavender: {
    bg: 'bg-lavender-light',
    icon: 'bg-lavender/30 text-lavender',
    value: 'text-lavender',
    bar: 'bg-lavender',
  },
  sage: {
    bg: 'bg-blush',
    icon: 'bg-petal/20 text-petal',
    value: 'text-petal',
    bar: 'bg-petal',
  },
  gold: {
    bg: 'bg-warm',
    icon: 'bg-gold/20 text-gold',
    value: 'text-gold',
    bar: 'bg-gold',
  },
}

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'up') return <TrendingUp size={13} className="text-petal" />
  if (trend === 'down') return <TrendingDown size={13} className="text-red-400" />
  return <Minus size={13} className="text-mauve" />
}

export default function MetricCard({
  title, value, unit, subtitle, trend = 'neutral', trendLabel,
  icon, color, delay = 0
}: MetricCardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-2xl p-5 border border-border/60 hover:shadow-md hover:-translate-y-0.5',
        'transition-all duration-300 cursor-pointer bg-white'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.icon)}>
          {icon}
        </div>
        {trend && trendLabel && (
          <div className="flex items-center gap-1 text-xs font-body text-mauve">
            <TrendIcon trend={trend} />
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      <div className="mb-1">
        <span className={cn('font-display text-3xl font-semibold', c.value)}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-body text-mauve ml-1">{unit}</span>
        )}
      </div>

      <p className="text-sm font-body font-medium text-onyx mb-0.5">{title}</p>
      <p className="text-xs font-body text-mauve">{subtitle}</p>
    </motion.div>
  )
}
