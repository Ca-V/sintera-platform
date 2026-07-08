'use client'

import { motion } from 'framer-motion'
import { Zap, Moon, Droplets, FlaskConical, TrendingUp, ArrowRight } from 'lucide-react'
import Card from '@/components/ui/Card'

type Priority = 'high' | 'medium' | 'low'

type Insight = {
  id: string
  icon: typeof Zap
  title: string
  body: string
  tag: string
  priority: Priority
  time: string
  accentColor: string
  bgColor: string
}

const insights: Insight[] = [
  {
    id: '1',
    icon: Zap,
    title: 'Pico de energia nas próximas 48h',
    body: 'Estrogênio em alta máxima. Ideal para treinos intensos, apresentações e decisões importantes.',
    tag: 'Energia',
    priority: 'high',
    time: 'Agora',
    accentColor: '#C9A97A',
    bgColor: '#FBF7F2',
  },
  {
    id: '2',
    icon: Moon,
    title: 'Ovulação prevista: 5 dias',
    body: 'Janela fértil se aproxima. Estrogênio no pico, libido tende a aumentar.',
    tag: 'Ciclo',
    priority: 'high',
    time: 'Hoje',
    accentColor: '#C2849A',
    bgColor: '#FDF2F7',
  },
  {
    id: '3',
    icon: FlaskConical,
    title: 'Cortisol dentro do normal',
    body: 'Níveis de estresse controlados para a fase atual. Continue com as práticas de recuperação.',
    tag: 'Hormônios',
    priority: 'medium',
    time: 'Ontem',
    accentColor: '#A89CBD',
    bgColor: '#F5F2FB',
  },
  {
    id: '4',
    icon: Droplets,
    title: 'Hidratação abaixo da meta',
    body: 'Você atingiu 1.8L dos 2.5L recomendados para hoje. Fase folicular exige mais hídratação.',
    tag: 'Saúde',
    priority: 'medium',
    time: 'Hoje',
    accentColor: '#7DAF9E',
    bgColor: '#F0F9F6',
  },
  {
    id: '5',
    icon: TrendingUp,
    title: 'Qualidade do sono melhora nesta fase',
    body: 'Dados da semana mostram +0.5h a mais de sono profundo na fase folicular. Padrão consistente.',
    tag: 'Sono',
    priority: 'low',
    time: '3 dias atrás',
    accentColor: '#A89CBD',
    bgColor: '#F5F2FB',
  },
]

const priorityDot: Record<Priority, string> = {
  high:   'bg-petal',
  medium: 'bg-gold',
  low:    'bg-sage',
}

export default function InsightsPanel() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-body font-semibold text-onyx">Insights</h3>
          <p className="text-xs font-body text-mauve">{insights.length} novos esta semana</p>
        </div>
        <button className="flex items-center gap-1 text-xs font-body text-petal hover:underline">
          Ver todos <ArrowRight size={11}/>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {insights.map((ins, i) => {
          const Icon = ins.icon
          return (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' }}
              className="group flex items-start gap-3 p-3.5 rounded-2xl border border-transparent hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer"
              style={{ backgroundColor: ins.bgColor }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: `${ins.accentColor}22` }}
              >
                <Icon size={14} style={{ color: ins.accentColor }}/>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-sm font-body font-semibold text-onyx leading-tight group-hover:text-petal transition-colors">
                    {ins.title}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[ins.priority]}`}/>
                    <span className="text-[10px] font-body text-mauve/60 whitespace-nowrap">{ins.time}</span>
                  </div>
                </div>
                <p className="text-xs font-body text-mauve leading-relaxed line-clamp-2">{ins.body}</p>
                <span
                  className="inline-block mt-1.5 text-[10px] font-body font-medium px-2 py-0.5 rounded-full"
                  style={{ color: ins.accentColor, backgroundColor: `${ins.accentColor}18` }}
                >
                  {ins.tag}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </Card>
  )
}
