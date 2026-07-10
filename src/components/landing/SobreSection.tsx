'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Target, Compass } from 'lucide-react'

// "Propósito" — quem é a SINTERA: propósito, missão e visão (conteúdo canônico
// da Constituição Estratégica / Branding §3). Aprofunda a convicção antes de
// Planos/CTA. Fatos institucionais — sem promessa de funcionalidade.
export default function SobreSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="proposito" className="py-28 bg-cream">
      <div ref={ref} className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Propósito
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold text-onyx leading-tight max-w-3xl mx-auto">
            Existimos para que toda pessoa tenha sua história de saúde{' '}
            <span className="text-gradient">sempre pronta — completa, contínua e a serviço dela.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mt-14 text-left">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="card-premium p-7">
            <div className="w-11 h-11 rounded-2xl bg-blush flex items-center justify-center mb-4">
              <Target size={20} className="text-petal" />
            </div>
            <h3 className="font-display text-lg font-semibold text-onyx mb-2">Missão</h3>
            <p className="font-body text-sm text-mauve leading-relaxed">
              Eliminar continuamente o trabalho administrativo da saúde.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
            className="card-premium p-7">
            <div className="w-11 h-11 rounded-2xl bg-sage-light flex items-center justify-center mb-4">
              <Compass size={20} className="text-sage" />
            </div>
            <h3 className="font-display text-lg font-semibold text-onyx mb-2">Visão</h3>
            <p className="font-body text-sm text-mauve leading-relaxed">
              Ser a infraestrutura pessoal de continuidade da saúde — usada sempre que alguém precisar
              organizar, entender, acompanhar ou compartilhar sua história ao longo da vida.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
