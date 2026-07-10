'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Upload, Layers, Bell, Share2 } from 'lucide-react'

// "Como funciona" — funde o antigo "No dia a dia" (benefícios) com os 3 passos
// (registre → organiza → acompanhe → compartilhe). 4 cards process+benefício.
const features = [
  {
    icon: Upload,
    title: 'Registre e reúna suas informações',
    description: 'Adicione exames, receitas, consultas, medicamentos e hábitos — a SINTERA reúne tudo automaticamente, sem digitação.',
    iconColor: 'text-petal', iconBg: 'bg-blush',
  },
  {
    icon: Layers,
    title: 'A SINTERA organiza tudo para você',
    description: 'Suas informações viram uma linha do tempo clara e contínua da sua saúde.',
    iconColor: 'text-sage', iconBg: 'bg-sage-light',
  },
  {
    icon: Bell,
    title: 'Lembretes de tudo que importa',
    description: 'Consultas, exames e a hora de tomar e repor seus medicamentos — avisos por e-mail e WhatsApp.',
    iconColor: 'text-lavender', iconBg: 'bg-lavender-light',
  },
  {
    icon: Share2,
    title: 'Compreenda e compartilhe',
    description: 'Relatórios prontos para levar e compartilhar com os profissionais que cuidam de você.',
    iconColor: 'text-gold', iconBg: 'bg-warm',
  },
]

export default function Features() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="como-funciona" className="py-28 bg-cream">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Como funciona
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Menos tempo organizando.<br />
            <span className="text-gradient">Mais tempo cuidando de você.</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-2xl mx-auto leading-relaxed">
            A SINTERA reúne e organiza as informações da sua saúde à medida que você registra seus
            dados e adiciona documentos e registros de saúde, construindo uma visão clara da evolução
            do seu cuidado ao longo da vida.
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
