'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, Activity, Bell, FileCheck } from 'lucide-react'

// Camada 2 da narrativa — "Como a SINTERA ajuda no dia a dia".
// Perspectiva no USUÁRIO (o que ele ganha). 4 benefícios essenciais (enxuto).
const features = [
  {
    icon: FileText,
    title: 'Tudo organizado em um só lugar',
    description: 'Exames, receitas, consultas, medicamentos e hábitos — reunidos automaticamente, sem digitação.',
    iconColor: 'text-petal', iconBg: 'bg-blush',
  },
  {
    icon: Activity,
    title: 'Um acompanhamento contínuo',
    description: 'Tudo o que acontece com a sua saúde em uma linha do tempo clara.',
    iconColor: 'text-sage', iconBg: 'bg-sage-light',
  },
  {
    icon: Bell,
    title: 'Lembretes por e-mail e WhatsApp',
    description: 'Você é avisado dos seus compromissos de saúde — nunca perde uma consulta.',
    iconColor: 'text-lavender', iconBg: 'bg-lavender-light',
  },
  {
    icon: FileCheck,
    title: 'Relatórios prontos para compartilhar',
    description: 'Um resumo organizado da sua saúde para levar e compartilhar com os profissionais.',
    iconColor: 'text-gold', iconBg: 'bg-warm',
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
            No dia a dia
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Menos tempo organizando.<br />
            <span className="text-gradient">Mais tempo cuidando de você.</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-xl mx-auto">
            A burocracia da saúde deixa de tomar seu tempo: a SINTERA cuida das informações para
            você se dedicar ao que realmente importa — cuidar de você.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                className="card-premium p-7 flex flex-col gap-4">
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
