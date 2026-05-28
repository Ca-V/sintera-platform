'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ShieldCheck, Lock, Microscope, Award } from 'lucide-react'

const badges = [
  { icon: ShieldCheck, label: 'Clinicamente validado', sub: 'Revisado por ginecologistas' },
  { icon: Lock, label: '100% privado', sub: 'Dados nunca compartilhados' },
  { icon: Microscope, label: 'Baseado em ciência', sub: 'Pesquisa publicada em periódicos' },
  { icon: Award, label: 'Premiado em 2025', sub: 'Melhor app de saúde feminina' },
]

const dataPoints = [
  { value: '3M+', label: 'ciclos analisados' },
  { value: '47', label: 'biomarcadores monitorados' },
  { value: '96%', label: 'precisão nas previsões' },
  { value: '180+', label: 'estudos científicos' },
]

export default function ScienceSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="ciencia" className="py-28 gradient-dark overflow-hidden relative">
      {/* Decorative glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-petal/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-lavender/8 blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-petal/30 text-xs font-body font-medium text-petal uppercase tracking-wider mb-5">
            Fundamentada em Ciência
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-white leading-tight mb-4">
            Inteligência que respeita<br />
            <span className="text-shimmer">sua complexidade.</span>
          </h2>
          <p className="font-body text-white/55 text-lg max-w-xl mx-auto leading-relaxed">
            SINTERA não é um app de contagem de dias. É uma plataforma construída sobre
            ciência real, revisada por especialistas em saúde feminina.
          </p>
        </motion.div>

        {/* Data points */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {dataPoints.map((dp, i) => (
            <motion.div
              key={dp.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.09, ease: 'easeOut' }}
              className="glass-dark rounded-2xl p-6 text-center border border-white/8"
            >
              <p className="font-display text-4xl font-semibold text-gradient mb-1">{dp.value}</p>
              <p className="font-body text-sm text-white/50">{dp.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Badges */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => {
            const Icon = b.icon
            return (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.09, ease: 'easeOut' }}
                className="flex items-start gap-3 glass-dark rounded-2xl p-5 border border-white/8"
              >
                <div className="w-9 h-9 rounded-xl bg-petal/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-petal-light" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-white leading-tight mb-0.5">{b.label}</p>
                  <p className="text-xs font-body text-white/45 leading-snug">{b.sub}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Quote */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
          className="mt-16 max-w-2xl mx-auto text-center border-t border-white/10 pt-12"
        >
          <p className="font-display text-2xl font-light text-white/80 italic leading-relaxed mb-6">
            "O corpo feminino não é um corpo masculino com variações mensais.
            É um sistema complexo que merece ser tratado com ciência e respeito."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-petal/30 flex items-center justify-center">
              <span className="text-petal-light text-sm font-display font-bold">DG</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-body font-medium text-white/80">Dra. Gabriela Motta</p>
              <p className="text-xs font-body text-white/40">Ginecologista · Consultora científica SINTERA</p>
            </div>
          </div>
        </motion.blockquote>
      </div>
    </section>
  )
}
