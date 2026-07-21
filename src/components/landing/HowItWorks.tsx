'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Upload, Layers, TrendingUp } from 'lucide-react'

// Camada 4 da narrativa — "Como funciona". Reframe completo (fora o fluxo
// antigo de "upload de laudo → biomarcadores"): o fluxo real da plataforma
// horizontal, na perspectiva do usuário.
const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Registre e reúna suas informações',
    description: 'Cadastre suas informações e adicione documentos e registros recebidos ao longo da sua jornada de saúde.',
    detail: 'Exames, receitas, laudos, consultas, medicamentos, hábitos — tudo em um só lugar.',
    color: '#CDEAE4',
    iconColor: '#3D6C7B',
  },
  {
    number: '02',
    icon: Layers,
    title: 'A SINTERA organiza tudo para você',
    description: 'Suas informações passam a compor uma visão organizada e contínua da sua saúde, fácil de consultar sempre que precisar.',
    detail: 'Sem digitação e sem planilha — a organização acontece automaticamente.',
    color: '#E7F3EF',
    iconColor: '#488593',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Compreenda sua evolução e compartilhe',
    description: 'Visualize sua trajetória de saúde ao longo do tempo, acompanhe seus compromissos e compartilhe suas informações com os profissionais que participam do seu cuidado.',
    detail: 'Uma visão clara para levar à consulta — a decisão permanece com os profissionais.',
    color: '#ECF2E9',
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
            <span className="text-gradient">Uma visão completa da sua saúde.</span>
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
