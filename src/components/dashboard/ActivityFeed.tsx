'use client'

import { motion } from 'framer-motion'
import { Moon, Zap, Droplets, Heart, MessageCircle } from 'lucide-react'

const activities = [
  {
    icon: Zap,
    color: 'bg-warm text-gold',
    title: 'Energia registrada',
    description: 'Nível 8/10 — acima da média desta fase',
    time: 'Hoje, 08:30',
    type: 'insight',
  },
  {
    icon: Moon,
    color: 'bg-lavender-light text-lavender',
    title: 'Fase Folicular iniciada',
    description: 'Estrogênio em alta — ótimo para criatividade e sociabilidade',
    time: 'Ontem',
    type: 'phase',
  },
  {
    icon: Droplets,
    color: 'bg-sage-light text-sage',
    title: 'Meta de hidratação',
    description: '2.1L atingidos — parabéns!',
    time: 'Ontem',
    type: 'goal',
  },
  {
    icon: Heart,
    color: 'bg-blush text-petal',
    title: 'Relatório semanal disponível',
    description: 'Sua semana em dados — clique para ver',
    time: '3 dias atrás',
    type: 'report',
  },
  {
    icon: MessageCircle,
    color: 'bg-ivory text-mauve',
    title: 'Novo insight de sono',
    description: 'Você dorme 18min a mais na fase lútea',
    time: '5 dias atrás',
    type: 'insight',
  },
]

export default function ActivityFeed() {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-body text-sm font-semibold text-onyx">Atividade Recente</h3>
        <button className="text-xs font-body text-petal hover:underline">Ver tudo</button>
      </div>

      <div className="flex flex-col gap-1">
        {activities.map((activity, i) => {
          const Icon = activity.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-ivory transition-colors cursor-pointer group"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-onyx group-hover:text-petal transition-colors truncate">
                  {activity.title}
                </p>
                <p className="text-xs font-body text-mauve truncate">{activity.description}</p>
              </div>
              <p className="text-[11px] font-body text-mauve flex-shrink-0 mt-0.5">{activity.time}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
