'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { UserCircle, LineChart, Lightbulb } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserCircle,
    title: 'Crie seu perfil',
    description: 'Onboarding feminino e personalizado — ciclo, histórico de saúde e objetivos. Leva menos de 3 minutos.',
    detail: 'Sem dados, sem julgamento. Apenas o início de uma relação mais profunda com seu corpo.',
    color: '#EDD5DF',
    iconColor: '#9A6478',
  },
  {
    number: '02',
    icon: LineChart,
    title: 'Registre e sincronize',
    description: 'Adicione sintomas, energia, sono, humor e marcos do ciclo. Quanto mais você registra, mais poderosos ficam os insights.',
    detail: 'Em breve: integração com Apple Health, Garmin e wearables.',
    color: '#E2D9EE',
    iconColor: '#7A6490',
  },
  {
    number: '03',
    icon: Lightbulb,
    title: 'Receba inteligência',
    description: 'SINTERA analisa seus padrões e entrega recomendações acionáveis para cada fase — treino, alimentação, produtividade e mais.',
    detail: 'Relatórios semanais, alertas de fases e insights diários personalizados.',
    color: '#C8E2DB',
    iconColor: '#5A9080',
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="como-funciona" className="py-28 bg-ivory overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-lavender-light border border-lavender/25 text-xs font-body font-medium text-lavender uppercase tracking-wider mb-5">
            Como funciona
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Três passos para se<br />
            <span className="text-gradient italic">conhecer de verdade.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line (desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-petal-light via-lavender/40 to-sage-light -translate-x-1/2" />

          <div className="flex flex-col gap-12 lg:gap-16">
            {steps.map((step, i) => {
              const isEven = i % 2 === 0
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: isEven ? -32 : 32 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.7, delay: i * 0.18, ease: 'easeOut' }}
                  className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${!isEven ? 'lg:flex-row-reverse' : ''}`}
                >
                  {/* Text side */}
                  <div className="flex-1 text-center lg:text-left">
                    <div className="flex items-center gap-3 mb-3 justify-center lg:justify-start">
                      <span className="text-5xl font-display font-light text-onyx/10 leading-none">{step.number}</span>
                      <div className="h-px w-8 bg-border" />
                      <span className="text-xs font-body font-semibold text-mauve uppercase tracking-widest">Passo {step.number}</span>
                    </div>
                    <h3 className="font-display text-2xl lg:text-3xl font-semibold text-onyx mb-3">{step.title}</h3>
                    <p className="font-body text-mauve leading-relaxed mb-3">{step.description}</p>
                    <p className="font-body text-sm text-mauve/60 italic">{step.detail}</p>
                  </div>

                  {/* Center node */}
                  <div className="hidden lg:flex flex-shrink-0 flex-col items-center gap-0 relative z-10">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: step.color }}
                    >
                      <Icon size={24} style={{ color: step.iconColor }} />
                    </div>
                  </div>

                  {/* Visual card side */}
                  <div className="flex-1 flex justify-center">
                    <div className="card-premium p-5 w-full max-w-xs">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 lg:hidden"
                        style={{ backgroundColor: step.color }}
                      >
                        <Icon size={20} style={{ color: step.iconColor }} />
                      </div>
                      <StepVisual step={i} color={step.color} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function StepVisual({ step, color }: { step: number; color: string }) {
  if (step === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs font-body text-mauve uppercase tracking-wider mb-1">Seu perfil</p>
        {[
          { label: 'Nome', value: 'Sofia Martins' },
          { label: 'Ciclo médio', value: '28 dias' },
          { label: 'Objetivo', value: 'Energia & Performance' },
        ].map((field) => (
          <div key={field.label} className="flex items-center justify-between py-1.5 border-b border-border/50">
            <span className="text-xs font-body text-mauve">{field.label}</span>
            <span className="text-xs font-body font-medium text-onyx">{field.value}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-ivory rounded-full overflow-hidden">
            <div className="w-full h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, #A89CBD)` }} />
          </div>
          <span className="text-[10px] font-body text-mauve">Completo</span>
        </div>
      </div>
    )
  }
  if (step === 1) {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
    const values = [7, 8, 6, 9, 8, 5, 9]
    return (
      <div>
        <p className="text-xs font-body text-mauve uppercase tracking-wider mb-3">Esta semana</p>
        <div className="flex items-end gap-2">
          {days.map((d, i) => (
            <div key={d} className="flex flex-col items-center gap-1 flex-1">
              <motion.div
                className="w-full rounded-md"
                style={{ backgroundColor: color, height: `${values[i] * 6}px` }}
                initial={{ height: 0 }}
                animate={{ height: `${values[i] * 6}px` }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
              />
              <span className="text-[8px] font-body text-mauve">{d}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-body text-mauve">Energia · Média: 7.4</span>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-body text-mauve uppercase tracking-wider mb-1">Insights do dia</p>
      {[
        { icon: '⚡', text: 'Alta energia — ideal para treinos intensos', tag: 'Agora' },
        { icon: '🌙', text: 'Ovulação em 3 dias — pico de estrogênio', tag: '3 dias' },
        { icon: '💡', text: 'Evite grandes decisões na próxima semana', tag: 'Dica' },
      ].map((ins, i) => (
        <div key={i} className="flex items-start gap-2 p-2 rounded-xl" style={{ backgroundColor: color + '30' }}>
          <span className="text-sm flex-shrink-0">{ins.icon}</span>
          <p className="text-[11px] font-body text-onyx/80 leading-snug flex-1">{ins.text}</p>
          <span className="text-[9px] font-body text-mauve bg-white/70 px-1.5 py-0.5 rounded-full flex-shrink-0">{ins.tag}</span>
        </div>
      ))}
    </div>
  )
}
