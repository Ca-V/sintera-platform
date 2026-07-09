'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Upload, FlaskConical, TrendingUp } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Faça upload do laudo',
    description: 'Envie seu laudo laboratorial em PDF — de qualquer laboratório. O processo leva menos de 1 minuto.',
    detail: 'Suportamos laudos em PDF de texto nativo. Não importa o laboratório ou o formato.',
    color: '#EDD5DF',
    iconColor: '#9A6478',
  },
  {
    number: '02',
    icon: FlaskConical,
    title: 'A IA extrai os biomarcadores',
    description: 'Nossa IA lê o laudo e extrai automaticamente todos os biomarcadores — valores, unidades e referências do próprio laudo.',
    detail: 'Glicemia, colesterol, vitaminas, hormônios, hemograma — tudo estruturado automaticamente, sem que você precise digitar nada.',
    color: '#E2D9EE',
    iconColor: '#7A6490',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Acompanhe sua evolução',
    description: 'Visualize como cada biomarcador evoluiu ao longo dos anos. Leve essa visão para a sua próxima consulta.',
    detail: 'Histórico longitudinal, filtros por período, resumo de variação percentual, export para o médico. Tudo em um lugar só.',
    color: '#C8E2DB',
    iconColor: '#4A8F7A',
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="como-funciona" className="py-28 bg-white">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Como funciona
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Três passos.<br />
            <span className="text-gradient">Anos de dados organizados.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div key={step.number}
                initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.15, ease: 'easeOut' }}
                className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: step.color }}>
                    <Icon size={24} style={{ color: step.iconColor }} />
                  </div>
                  <span className="font-display text-5xl font-semibold text-border">{step.number}</span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-onyx mb-2">{step.title}</h3>
                  <p className="font-body text-mauve leading-relaxed mb-3">{step.description}</p>
                  <p className="font-body text-sm text-mauve leading-relaxed">{step.detail}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
