'use client'

import CycleArc from '@/components/dashboard/CycleArc'
import WeeklyChart from '@/components/dashboard/WeeklyChart'
import { motion } from 'framer-motion'
import { Calendar, Moon, Droplets } from 'lucide-react'

const phaseGuide = [
  { phase: 'Menstrual', days: '1–5', color: '#C2849A', bg: 'bg-blush',
    title: 'Descanso & Renovação',
    tips: ['Prefira treinos leves como yoga', 'Aumente ferro e magnésio', 'Priorize o descanso'] },
  { phase: 'Folicular', days: '6–13', color: '#A89CBD', bg: 'bg-lavender-light',
    title: 'Energia & Criatividade',
    tips: ['Ótimo para iniciar projetos', 'Treinos de força e HIIT', 'Reuniões importantes'] },
  { phase: 'Ovulatória', days: '14–16', color: '#7DAF9E', bg: 'bg-sage-light',
    title: 'Pico de Performance',
    tips: ['Comunicação e liderança no auge', 'Competições e desafios físicos', 'Decisões estratégicas'] },
  { phase: 'Lútea', days: '17–28', color: '#C9A97A', bg: 'bg-warm',
    title: 'Introspecção & Foco',
    tips: ['Trabalho detalhado e analítico', 'Reduza cafeína e açúcar', 'Priorize sono de qualidade'] },
]

export default function CicloPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Ciclo Menstrual</h1>
        <p className="font-body text-sm text-mauve">Visualização detalhada das fases e curvas hormonais</p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3"><CycleArc /></div>
        <div className="lg:col-span-2 flex flex-col gap-4">
          {[
            { icon: Calendar, label: 'Próxima ovulação', value: '5 dias', color: 'text-lavender', bg: 'bg-lavender-light' },
            { icon: Moon,     label: 'Próxima menstruação', value: '20 dias', color: 'text-petal', bg: 'bg-blush' },
            { icon: Droplets, label: 'Ciclo médio', value: '28 dias', color: 'text-sage', bg: 'bg-sage-light' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }} className="card-premium p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs font-body text-mauve">{s.label}</p>
                <p className={`font-display text-xl font-semibold ${s.color}`}>{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <WeeklyChart />

      <div>
        <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest mb-4">Guia por fase</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {phaseGuide.map((p, i) => (
            <motion.div key={p.phase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="card-premium p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-xs font-body font-semibold text-onyx">{p.phase}</span>
                <span className="text-[10px] font-body text-mauve ml-auto">Dias {p.days}</span>
              </div>
              <p className={`text-xs font-body font-semibold mb-3 ${p.bg} rounded-lg px-2 py-1`}
                style={{ color: p.color }}>{p.title}</p>
              <ul className="flex flex-col gap-1.5">
                {p.tips.map(t => (
                  <li key={t} className="text-xs font-body text-mauve flex items-start gap-1.5">
                    <span className="text-[10px] mt-0.5" style={{ color: p.color }}>✦</span>{t}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
