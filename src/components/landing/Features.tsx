'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, TrendingUp, Search, Download, CalendarDays, FlaskConical } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Upload de laudos PDF',
    description: 'Envie qualquer laudo laboratorial em PDF — de qualquer laboratório brasileiro. A IA lê e extrai automaticamente todos os biomarcadores com valores e referências.',
    iconColor: 'text-petal',
    iconBg: 'bg-blush',
    span: 'lg:col-span-1 lg:row-span-2',
    large: true,
  },
  {
    icon: TrendingUp,
    title: 'Histórico longitudinal',
    description: 'Visualize a evolução de cada biomarcador ao longo do tempo — de 2020 até hoje.',
    iconColor: 'text-sage',
    iconBg: 'bg-sage-light',
    span: 'lg:col-span-1',
    large: false,
  },
  {
    icon: Search,
    title: 'Filtros inteligentes',
    description: 'Encontre qualquer exame por ano, tipo, nome ou status em segundos.',
    iconColor: 'text-lavender',
    iconBg: 'bg-lavender-light',
    span: 'lg:col-span-1',
    large: false,
  },
  {
    icon: Download,
    title: 'Exportação',
    description: 'Exporte qualquer exame em CSV ou PDF para compartilhar com seu médico.',
    iconColor: 'text-gold',
    iconBg: 'bg-warm',
    span: 'lg:col-span-1',
    large: false,
  },
  {
    icon: CalendarDays,
    title: 'Agenda de saúde',
    description: 'Crie lembretes de exames e consultas no Google Calendar, Outlook ou Apple Calendar.',
    iconColor: 'text-petal',
    iconBg: 'bg-blush',
    span: 'lg:col-span-1',
    large: false,
  },
  {
    icon: FlaskConical,
    title: 'Índice por exame',
    description: 'Veja a proporção de biomarcadores dentro e fora da referência em cada laudo processado.',
    iconColor: 'text-sage',
    iconBg: 'bg-sage-light',
    span: 'lg:col-span-1',
    large: false,
  },
]

export default function Features() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="funcionalidades" className="py-28 bg-cream">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Funcionalidades
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Tudo o que você precisa<br />
            <span className="text-gradient">para entender seus exames.</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-xl mx-auto">
            Da extração automática ao histórico longitudinal — sem complicação.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4 auto-rows-fr">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                className={`card-premium p-7 flex flex-col gap-4 ${f.span}`}>
                <div className={`w-11 h-11 rounded-2xl ${f.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={f.iconColor} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-onyx mb-2">{f.title}</h3>
                  <p className="font-body text-sm text-mauve leading-relaxed">{f.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
