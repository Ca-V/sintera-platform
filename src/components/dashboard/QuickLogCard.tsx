'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

const items = [
  { id: 'energy', emoji: '⚡', label: 'Energia',  max: 10, rangeClass: 'range-gold',    color: '#C9A97A', gradColor: 'linear-gradient(90deg,#C9A97A,#E2C49A)' },
  { id: 'sleep',  emoji: '🌙', label: 'Sono (h)', max: 10, rangeClass: 'range-lavender', color: '#579DA8', gradColor: 'linear-gradient(90deg,#579DA8,#97C9C3)' },
  { id: 'water',  emoji: '💧', label: 'Água (L)', max: 4,  rangeClass: 'range-sage',     color: '#7E9B6E', gradColor: 'linear-gradient(90deg,#7E9B6E,#A6BE99)' },
  { id: 'mood',   emoji: '🌸', label: 'Humor',    max: 10, rangeClass: '',               color: '#B15C4C', gradColor: 'linear-gradient(90deg,#B15C4C,#CE8570)' },
]

const moods = [
  { label: '😔', value: 2  },
  { label: '😐', value: 4  },
  { label: '🙂', value: 6  },
  { label: '😊', value: 8  },
  { label: '🤩', value: 10 },
]

export default function QuickLogCard() {
  const [values, setValues] = useState<Record<string, number>>({ energy: 8, sleep: 7.5, water: 1.8, mood: 8 })
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const activeMood = moods.find(m => m.value === values.mood) ?? moods[2]

  return (
    <div className="card-dark p-5 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-body font-semibold text-white">Registro do dia</h3>
          <p className="text-xs font-body text-white/35">Como você está hoje?</p>
        </div>
        <span className="text-2xl">{activeMood.label}</span>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {items.map((item) => {
          const val = values[item.id] ?? 5
          const pct = (val / item.max) * 100
          const displayVal = item.id === 'sleep' || item.id === 'water'
            ? val.toFixed(1)
            : val

          return (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.emoji}</span>
                  <span className="text-xs font-body text-white/60">{item.label}</span>
                </div>
                <span className="font-display text-sm font-semibold text-white">{displayVal}</span>
              </div>
              <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ background: item.gradColor }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              {item.id !== 'mood' ? (
                <input
                  type="range"
                  aria-label={item.label}
                  min={0}
                  max={item.max}
                  step={item.max === 4 ? 0.1 : 1}
                  value={val}
                  onChange={e => setValues(prev => ({ ...prev, [item.id]: +e.target.value }))}
                  className={`w-full mt-2 ${item.rangeClass}`}
                  style={{ background: `linear-gradient(90deg, ${item.color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
                />
              ) : (
                <div className="flex justify-between mt-2">
                  {moods.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setValues(prev => ({ ...prev, mood: m.value }))}
                      className={`text-base transition-all duration-150 ${values.mood === m.value ? 'scale-125' : 'opacity-30 hover:opacity-60'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {saved ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-petal/20 text-petal-light border border-petal/20 text-sm font-body font-medium"
          >
            <Check size={14}/> Registrado!
          </motion.div>
        ) : (
          <motion.button
            key="save"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            onClick={save}
            className="w-full py-3 rounded-xl gradient-sintera text-white text-sm font-body font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md"
          >
            Salvar registro
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
