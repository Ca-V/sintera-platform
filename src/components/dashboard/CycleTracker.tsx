'use client'

import { motion } from 'framer-motion'

const phases = [
  { name: 'Menstrual', days: '1-5', color: '#C9899E', active: false },
  { name: 'Folicular', days: '6-13', color: '#B5A5C5', active: true },
  { name: 'Ovulatória', days: '14-16', color: '#7FB0A0', active: false },
  { name: 'Lútea', days: '17-28', color: '#D4B896', active: false },
]

const currentDay = 8
const cycleLength = 28
const progress = (currentDay / cycleLength) * 100
const circumference = 2 * Math.PI * 52

export default function CycleTracker() {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-body text-sm font-semibold text-onyx">Ciclo Menstrual</h3>
          <p className="text-xs font-body text-mauve">Ciclo de {cycleLength} dias</p>
        </div>
        <span className="text-xs font-body px-3 py-1 bg-blush text-petal-dark rounded-full border border-petal-light">
          Fase Folicular
        </span>
      </div>

      <div className="flex items-center gap-8">
        {/* Circle progress */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="#EDE8E3"
              strokeWidth="8"
            />
            <motion.circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="#C9899E"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (circumference * progress) / 100 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="font-display text-3xl font-semibold text-petal-dark"
            >
              {currentDay}
            </motion.span>
            <span className="text-xs font-body text-mauve">dia</span>
          </div>
        </div>

        {/* Phase list */}
        <div className="flex-1 flex flex-col gap-2">
          {phases.map((phase) => (
            <div
              key={phase.name}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                phase.active ? 'bg-blush' : ''
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: phase.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-body ${
                      phase.active ? 'font-semibold text-petal-dark' : 'text-mauve'
                    }`}
                  >
                    {phase.name}
                  </span>
                  <span className="text-[11px] font-body text-mauve/70">{phase.days}</span>
                </div>
              </div>
              {phase.active && (
                <span className="w-1.5 h-1.5 rounded-full bg-petal animate-pulse-soft" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-lavender">5</p>
          <p className="text-xs font-body text-mauve">dias para ovulação</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-gold">20</p>
          <p className="text-xs font-body text-mauve">dias para menstruar</p>
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-sage">Alta</p>
          <p className="text-xs font-body text-mauve">energia esperada</p>
        </div>
      </div>
    </div>
  )
}
