'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Card from '@/components/ui/Card'

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const datasets = {
  Energia: { values: [72, 68, 84, 89, 84, 61, 78], color: '#C9A97A', gradient: ['#C9A97A', '#E2C49A'] },
  Humor:   { values: [75, 70, 82, 88, 80, 65, 85], color: '#E28C7D', gradient: ['#E28C7D', '#EEA898'] },
  Sono:    { values: [65, 70, 75, 72, 68, 80, 77], color: '#57B3AD', gradient: ['#57B3AD', '#8FD8CE'] },
}

type DataKey = keyof typeof datasets

const W = 400, H = 120, PAD_X = 0, PAD_Y = 10

function buildPath(values: number[]): string {
  const max = 100
  const pts = values.map((v, i) => ({
    x: PAD_X + (i / (values.length - 1)) * (W - PAD_X * 2),
    y: PAD_Y + (1 - v / max) * (H - PAD_Y * 2),
  }))

  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const cp1x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.4
    const cp2x = pts[i].x + (pts[i + 1].x - pts[i].x) * 0.6
    d += ` C ${cp1x} ${pts[i].y} ${cp2x} ${pts[i + 1].y} ${pts[i + 1].x} ${pts[i + 1].y}`
  }
  return d
}

function buildArea(values: number[]): string {
  const linePath = buildPath(values)
  const max = 100
  const lastX = PAD_X + W - PAD_X * 2
  const firstY = PAD_Y + (1 - values[0] / max) * (H - PAD_Y * 2)
  return `${linePath} L ${lastX} ${H} L ${PAD_X} ${H} L ${PAD_X} ${firstY} Z`
}

export default function WeeklyChart() {
  const [active, setActive] = useState<DataKey>('Energia')
  const { values, color } = datasets[active]
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const max = 100

  const pts = values.map((v, i) => ({
    x: PAD_X + (i / (values.length - 1)) * (W - PAD_X * 2),
    y: PAD_Y + (1 - v / max) * (H - PAD_Y * 2),
  }))

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-body font-semibold text-onyx">Evolução Semanal</h3>
          <p className="text-xs font-body text-mauve">Média: <span className="font-medium text-onyx">{avg}%</span></p>
        </div>
        <div className="flex gap-1">
          {(Object.keys(datasets) as DataKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`text-xs font-body px-3 py-1 rounded-full transition-all duration-200 ${
                active === key
                  ? 'text-white font-medium shadow-sm'
                  : 'text-mauve hover:text-onyx bg-ivory/50'
              }`}
              style={active === key ? { background: datasets[key].color } : {}}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative overflow-hidden rounded-xl" style={{ height: `${H + 20}px` }}>
        <svg
          viewBox={`0 0 ${W} ${H + 20}`}
          className="w-full"
          style={{ height: `${H + 20}px` }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[25, 50, 75].map((v) => {
            const y = PAD_Y + (1 - v / max) * (H - PAD_Y * 2)
            return <line key={v} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth="1"/>
          })}

          {/* Area */}
          <motion.path
            key={active + '-area'}
            d={buildArea(values)}
            fill="url(#areaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Line */}
          <motion.path
            key={active + '-line'}
            d={buildPath(values)}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />

          {/* Data points */}
          {pts.map((pt, i) => (
            <motion.circle
              key={i}
              cx={pt.x} cy={pt.y} r="3.5"
              fill="white"
              stroke={color}
              strokeWidth="2"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
              style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
            />
          ))}

          {/* Day labels */}
          {days.map((d, i) => {
            const x = PAD_X + (i / (days.length - 1)) * (W - PAD_X * 2)
            return (
              <text key={d} x={x} y={H + 16} textAnchor="middle" fontSize="9"
                fill="rgba(122,100,112,0.6)" fontFamily="sans-serif">{d}</text>
            )
          })}
        </svg>
      </div>
    </Card>
  )
}
