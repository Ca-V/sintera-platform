'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Target, Compass } from 'lucide-react'

// "Propósito" — quem é a SINTERA: propósito, missão e visão (conteúdo canônico
// da Constituição Estratégica / Branding §3). Momento de marca em fundo ESCURO
// (premium), no espírito do onboarding. Fatos institucionais — sem promessa.
export default function SobreSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="proposito" className="py-28 gradient-dark overflow-hidden relative">
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-petal/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-lavender/8 blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-4xl mx-auto px-6 relative text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}>
          <span className="inline-block px-4 py-1.5 rounded-full border border-petal/30 text-xs font-body font-medium text-petal uppercase tracking-wider mb-5">
            Propósito
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold text-white leading-tight max-w-3xl mx-auto">
            Existimos para que cada pessoa tenha sua história de saúde{' '}
            <span className="text-shimmer">organizada, compreendida e sempre a serviço do seu cuidado.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mt-14 text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="glass-dark rounded-2xl p-7 border border-white/8">
            <div className="w-11 h-11 rounded-2xl bg-petal/20 flex items-center justify-center mb-4">
              <Target size={20} className="text-petal-light" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">Missão</h3>
            <p className="font-body text-sm text-white/55 leading-relaxed">
              Transformar informações de saúde dispersas em uma história de saúde organizada e
              contínua, que permita compreender e acompanhar melhor o seu cuidado ao longo da vida.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            className="glass-dark rounded-2xl p-7 border border-white/8">
            <div className="w-11 h-11 rounded-2xl bg-petal/20 flex items-center justify-center mb-4">
              <Compass size={20} className="text-petal-light" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">Visão</h3>
            <p className="font-body text-sm text-white/55 leading-relaxed">
              Ser a plataforma de organização e continuidade da saúde, que acompanha cada história ao
              longo de toda a vida — tornando o cuidado mais simples, acessível e humano.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
