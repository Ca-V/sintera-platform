'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { Upload, Layers, Bell, Share2 } from 'lucide-react'

// "Como funciona" — funde o antigo "No dia a dia" (benefícios) com os 3 passos
// (registre → organiza → acompanhe → compartilhe). 4 cards process+benefício.
const features = [
  {
    icon: Upload,
    title: 'Registre e centralize suas informações',
    description: 'Exames, documentos, consultas, medicamentos, suplementos, hábitos e mais — num só lugar. Parte é capturada dos documentos que você envia; parte você registra diretamente.',
    iconColor: 'text-petal', iconBg: 'bg-blush', highlight: false,
  },
  {
    icon: Layers,
    title: 'Visualize sua saúde de forma integrada',
    description: 'Acompanhe sua evolução ao longo do tempo — por ano, exame, procedimento ou tratamento — e compreenda toda a sua trajetória de saúde numa única visão integrada, pronta para compartilhar com a sua rede de cuidado.',
    iconColor: 'text-petal', iconBg: 'bg-blush', highlight: true,
  },
  {
    icon: Bell,
    title: 'Continuidade do cuidado',
    description: 'Acompanhe medicamentos, exames, consultas e outras ações recorrentes — com lembretes por e-mail e WhatsApp, para você não se preocupar em lembrar de tudo.',
    iconColor: 'text-lavender', iconBg: 'bg-lavender-light', highlight: false,
  },
  {
    icon: Share2,
    title: 'Compartilhe sua história de saúde',
    description: 'Compartilhe uma visão organizada e integrada da sua história de saúde com os profissionais que acompanham você, facilitando a continuidade do cuidado.',
    iconColor: 'text-gold', iconBg: 'bg-warm', highlight: false,
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
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: 'easeOut' }}>
                <Link href="/onboarding"
                  className={`card-premium p-7 flex flex-col gap-4 h-full transition-all hover:border-petal/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-petal/40 ${f.highlight ? 'border-petal/40 ring-1 ring-petal/20 bg-blush/20 relative' : ''}`}>
                  {f.highlight && (
                    <span className="absolute top-4 right-4 font-body text-[10px] font-semibold text-petal-dark bg-blush border border-petal/20 rounded-full px-2 py-0.5 uppercase tracking-wider">Diferencial</span>
                  )}
                  <div className={`w-11 h-11 rounded-2xl ${f.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} className={f.iconColor} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-onyx mb-2">{f.title}</h3>
                    <p className="font-body text-sm text-mauve leading-relaxed">{f.description}</p>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
