'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Moon, Zap, BedDouble } from 'lucide-react'

const SCORE = 87
const R = 54
const C = 2 * Math.PI * R
const FILLED = C * (SCORE / 100)

const subMetrics = [
  { label: 'Energia',     value: '84%',  icon: Zap,      color: '#C9A97A' },
  { label: 'Sono',        value: '7.5h', icon: BedDouble, color: '#7FC6BF' },
  { label: 'Ciclo',       value: 'Dia 8',icon: Moon,     color: '#C1836A' },
]

function label(score: number) {
  if (score >= 85) return { text: 'Excelente', color: '#A7B98C' }
  if (score >= 70) return { text: 'Boa',       color: '#C9A97A' }
  if (score >= 50) return { text: 'Regular',   color: '#7FC6BF' }
  return { text: 'Baixa', color: '#C1836A' }
}

export default function DailyScoreCard() {
  const { text, color } = label(SCORE)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="card-dark p-6 flex flex-col gap-6 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(226,140,125,0.12) 0%, transparent 65%)' }}/>
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(87,179,173,0.08) 0%, transparent 60%)' }}/>

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div>
          <p className="text-xs font-body text-white/35 uppercase tracking-widest mb-0.5">Prontidão do dia</p>
          <p className="text-sm font-body font-medium text-white/70">{greeting}, Sofia ✦</p>
        </div>
        <button className="flex items-center gap-1 text-xs font-body text-white/35 hover:text-white/70 transition-colors">
          Detalhes <ArrowUpRight size={12}/>
        </button>
      </div>

      {/* Score ring + info */}
      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative w-32 h-32 flex-shrink-0">
          {/* Glow layer */}
          <div className="absolute inset-0 rounded-full blur-xl opacity-20"
            style={{ background: `conic-gradient(#C1836A, #7FC6BF, transparent)` }}/>
          <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90 relative">
            {/* Track */}
            <circle cx="64" cy="64" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
            {/* Progress */}
            <motion.circle
              cx="64" cy="64" r={R}
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - FILLED }}
              transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#C1836A"/>
                <stop offset="100%" stopColor="#7FC6BF"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="font-display text-4xl font-semibold text-white leading-none"
            >
              {SCORE}
            </motion.span>
            <span className="text-[11px] font-body text-white/60 mt-0.5">de 100</span>
          </div>
        </div>

        {/* Right info */}
        <div className="flex flex-col gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-semibold border"
              style={{ color, borderColor: `${color}40`, backgroundColor: `${color}12` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}/>
              {text}
            </span>
          </div>
          <div>
            <p className="text-sm font-body text-white/80 leading-relaxed max-w-[180px]">
              Fase Folicular ativa. Estrogênio em alta — ótimo para treinos e foco.
            </p>
          </div>
          <p className="text-xs font-body text-white/60">Ovulação prevista em 5 dias</p>
        </div>
      </div>

      {/* Sub metrics */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/6">
        {subMetrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Icon size={12} style={{ color: m.color }}/>
                <span className="text-[11px] font-body text-white/35 uppercase tracking-wider">{m.label}</span>
              </div>
              <span className="font-display text-lg font-semibold text-white">{m.value}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
