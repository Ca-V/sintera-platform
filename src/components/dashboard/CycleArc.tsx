'use client'

import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'

type Phase = { name: string; startDay: number; endDay: number; color: string; label: string; active?: boolean }

const PHASES: Phase[] = [
  { name: 'Menstrual',  startDay: 1,  endDay: 5,  color: '#C2849A', label: 'Dias 1–5' },
  { name: 'Folicular',  startDay: 6,  endDay: 13, color: '#A89CBD', label: 'Dias 6–13', active: true },
  { name: 'Ovulatória', startDay: 14, endDay: 16, color: '#7DAF9E', label: 'Dias 14–16' },
  { name: 'Lútea',      startDay: 17, endDay: 28, color: '#C9A97A', label: 'Dias 17–28' },
]

const CYCLE = 28
const CURRENT_DAY = 8
const CX = 100, CY = 100, R_OUTER = 80, R_INNER = 55, GAP = 0.03 // gap between segments (radians)

function phaseArc(phase: Phase) {
  const startAngle = ((phase.startDay - 1) / CYCLE) * 2 * Math.PI - Math.PI / 2 + GAP
  const endAngle   = (phase.endDay / CYCLE) * 2 * Math.PI - Math.PI / 2 - GAP
  const lf = endAngle - startAngle > Math.PI ? 1 : 0

  const x1o = CX + R_OUTER * Math.cos(startAngle), y1o = CY + R_OUTER * Math.sin(startAngle)
  const x2o = CX + R_OUTER * Math.cos(endAngle),   y2o = CY + R_OUTER * Math.sin(endAngle)
  const x1i = CX + R_INNER * Math.cos(endAngle),   y1i = CY + R_INNER * Math.sin(endAngle)
  const x2i = CX + R_INNER * Math.cos(startAngle), y2i = CY + R_INNER * Math.sin(startAngle)

  return `M ${x1o} ${y1o} A ${R_OUTER} ${R_OUTER} 0 ${lf} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${R_INNER} ${R_INNER} 0 ${lf} 0 ${x2i} ${y2i} Z`
}

function dayMarker(day: number) {
  const angle = ((day - 1) / CYCLE) * 2 * Math.PI - Math.PI / 2
  const r = (R_OUTER + R_INNER) / 2
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

const hormones = [
  { label: 'Estrogênio', values: [20,30,45,65,80,95,72,50,40,35,38,42,46,48,50,48,45,42,38,35,32,30,28,26,24,22,20,18], color: '#C2849A' },
  { label: 'Progesterona', values: [8,8,9,10,12,14,16,18,22,28,35,42,50,58,65,70,75,78,80,76,68,58,45,30,20,14,10,8], color: '#A89CBD' },
]

const CHART_W = 200, CHART_H = 48

function sparkPath(values: number[]): string {
  const max = Math.max(...values)
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * CHART_W
    const y = CHART_H - (v / max) * CHART_H
    return `${x},${y}`
  })
  return `M ${pts.join(' L ')}`
}

export default function CycleArc() {
  const marker = dayMarker(CURRENT_DAY)
  const activePhase = PHASES.find(p => p.active)

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-body font-semibold text-onyx">Ciclo Menstrual</h3>
          <p className="text-xs font-body text-mauve">Ciclo de {CYCLE} dias</p>
        </div>
        <span className="text-[11px] font-body font-medium px-3 py-1 rounded-full bg-blush text-petal-dark border border-petal-light/60">
          {activePhase?.name}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Arc diagram */}
        <div className="flex-shrink-0 mx-auto lg:mx-0">
          <svg viewBox="0 0 200 200" width="200" height="200">
            {PHASES.map((phase, i) => (
              <motion.path
                key={phase.name}
                d={phaseArc(phase)}
                fill={phase.color}
                opacity={phase.active ? 1 : 0.35}
                initial={{ opacity: 0 }}
                animate={{ opacity: phase.active ? 1 : 0.35 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            ))}

            {/* Center */}
            <circle cx={CX} cy={CY} r={R_INNER - 2} fill="white"/>
            <text x={CX} y={CY - 8} textAnchor="middle" fontSize="26" fontWeight="600"
              fontFamily="serif" fill="#1E1820">{CURRENT_DAY}</text>
            <text x={CX} y={CY + 8} textAnchor="middle" fontSize="9" fill="#7A6470" fontFamily="sans-serif">DIA</text>
            <text x={CX} y={CY + 20} textAnchor="middle" fontSize="8" fill="#9A6478" fontFamily="sans-serif">FOLICULAR</text>

            {/* Current day marker */}
            <motion.circle
              cx={marker.x} cy={marker.y} r="5"
              fill="white"
              stroke="#1E1820"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              style={{ transformOrigin: `${marker.x}px ${marker.y}px` }}
            />
          </svg>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          {/* Phase list */}
          <div className="flex flex-col gap-1">
            {PHASES.map((p) => (
              <div key={p.name}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${p.active ? 'bg-blush' : 'bg-transparent'}`}
              >
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color, opacity: p.active ? 1 : 0.5 }}/>
                <span className={`text-xs font-body flex-1 ${p.active ? 'font-semibold text-onyx' : 'text-mauve'}`}>{p.name}</span>
                <span className="text-[11px] font-body text-mauve/60">{p.label}</span>
                {p.active && <span className="w-1.5 h-1.5 rounded-full bg-petal animate-pulse-soft"/>}
              </div>
            ))}
          </div>

          {/* Hormone sparklines */}
          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-body text-mauve uppercase tracking-wider mb-2">Curvas hormonais</p>
            <div className="flex flex-col gap-2">
              {hormones.map((h) => (
                <div key={h.label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }}/>
                  <span className="text-[11px] font-body text-mauve w-24 flex-shrink-0">{h.label}</span>
                  <div className="flex-1">
                    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-6" preserveAspectRatio="none">
                      <path d={sparkPath(h.values)} fill="none" stroke={h.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                      {/* Current day marker */}
                      <line
                        x1={(CURRENT_DAY - 1) / (CYCLE - 1) * CHART_W}
                        y1="0"
                        x2={(CURRENT_DAY - 1) / (CYCLE - 1) * CHART_W}
                        y2={CHART_H}
                        stroke={h.color}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.5"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast row */}
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
            {[
              { label: 'Ovulação', value: '5 dias', color: 'text-lavender' },
              { label: 'Menstrua',  value: '20 dias', color: 'text-gold' },
              { label: 'Energia',   value: 'Alta',    color: 'text-sage' },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <p className={`font-display text-base font-semibold ${f.color}`}>{f.value}</p>
                <p className="text-[11px] font-body text-mauve">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
