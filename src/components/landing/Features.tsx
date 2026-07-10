'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, Activity, ClipboardList, Bell, FileCheck, Share2 } from 'lucide-react'

// Camada 2 da narrativa — "Como a SINTERA ajuda no dia a dia".
// Perspectiva no USUÁRIO (o que ele ganha), não na plataforma. Recupera o
// diferencial central (menos trabalho administrativo) no título da seção.
const features = [
  {
    icon: FileText,
    title: 'Seus documentos em ordem',
    description: 'Exames, receitas e laudos reunidos e organizados automaticamente, sem digitação.',
    iconColor: 'text-petal', iconBg: 'bg-blush',
  },
  {
    icon: Activity,
    title: 'Um acompanhamento contínuo',
    description: 'Tudo o que acontece com a sua saúde reunido em uma linha do tempo clara.',
    iconColor: 'text-sage', iconBg: 'bg-sage-light',
  },
  {
    icon: ClipboardList,
    title: 'Sua rotina toda em um lugar',
    description: 'Registre consultas, medicamentos, sintomas e hábitos com poucos toques.',
    iconColor: 'text-lavender', iconBg: 'bg-lavender-light',
  },
  {
    icon: Bell,
    title: 'Nunca perca um compromisso',
    description: 'Você recebe lembretes dos seus compromissos de saúde por e-mail e WhatsApp.',
    iconColor: 'text-petal', iconBg: 'bg-blush',
  },
  {
    icon: FileCheck,
    title: 'Relatórios prontos na hora',
    description: 'Um resumo organizado da sua saúde para levar à consulta quando precisar.',
    iconColor: 'text-gold', iconBg: 'bg-warm',
  },
  {
    icon: Share2,
    title: 'Compartilhe em segundos',
    description: 'Leve suas informações organizadas aos profissionais que cuidam de você.',
    iconColor: 'text-sage', iconBg: 'bg-sage-light',
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

        <div className="grid lg:grid-cols-3 gap-4 auto-rows-fr">
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
