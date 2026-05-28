'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface RingCardProps {
  title: string
  value: string
  unit?: string
  sub: string
  pct: number          // 0-100
  icon: LucideIcon
  gradient: string     // CSS gradient string for the ring stroke
  gradientId: string
  accentColor: string  // hex, for text/icon
  delay?: number
}

const R = 32
const C = 2 * Math.PI * R

export default function RingCard({
  title, value, unit, sub, pct, icon: Icon, gradient, gradientId, accentColor, delay = 0
}: RingCardProps) {
  const filled = C * (pct / 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="card-premium p-4 flex items-center gap-4"
    >
      {/* Ring */}
      <div className="relative w-[72px] h-[72px] flex-shrink-0">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={R} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="5"/>
          <motion.circle
            cx="36" cy="36" r={R}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - filled }}
            transition={{ duration: 1.1, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              {gradient.split(',').map((stop, i, arr) => (
                <stop key={i} offset={`${(i/(arr.length-1))*100}%`} stopColor={stop.trim()}/>
              ))}
            </linearGradient>
          </defs>
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={16} style={{ color: accentColor }}/>
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-[10px] font-body text-mauve uppercase tracking-wider mb-0.5">{title}</p>
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className="font-display text-2xl font-semibold text-onyx leading-none">{value}</span>
          {unit && <span className="text-xs font-body text-mauve">{unit}</span>}
        </div>
        <p className="text-[11px] font-body text-mauve/70 leading-tight">{sub}</p>
        {/* Mini progress bar */}
        <div className="mt-2 h-1 bg-ivory rounded-full overflow-hidden w-full">
          <motion.div
            className="h-full rounded-full"
            style={{ background: gradient }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
