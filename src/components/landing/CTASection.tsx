'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Moon, Zap, Heart } from 'lucide-react'

const floatingChips = [
  { icon: Moon, text: 'Fase Folicular · Dia 8', color: 'bg-petal-light/20 text-petal-light border-petal-light/30' },
  { icon: Zap, text: 'Energia: 84% · Alta', color: 'bg-gold/20 text-gold/80 border-gold/20' },
  { icon: Heart, text: 'Ovulação em 5 dias', color: 'bg-sage/20 text-sage-light border-sage/20' },
]

export default function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-28 gradient-dark overflow-hidden relative">
      {/* Glows */}
      <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] rounded-full bg-petal/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-1/4 w-64 h-64 rounded-full bg-lavender/10 blur-3xl pointer-events-none" />

      {/* Floating rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ border: '1px solid rgba(194,132,154,0.08)' }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ border: '1px dashed rgba(168,156,189,0.1)' }}
      />

      <div ref={ref} className="max-w-4xl mx-auto px-6 relative text-center">
        {/* Chips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {floatingChips.map((chip, i) => {
            const Icon = chip.icon
            return (
              <motion.span
                key={chip.text}
                animate={{ y: [0, i % 2 === 0 ? -5 : 5, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
                className={`inline-flex items-center gap-2 border rounded-full px-4 py-2 text-xs font-body font-medium backdrop-blur-sm ${chip.color}`}
              >
                <Icon size={12} />
                {chip.text}
              </motion.span>
            )
          })}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="font-display font-semibold text-white leading-[1.05] mb-6"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
        >
          Comece a se entender
          <br />
          <span className="text-shimmer">de verdade, hoje.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.22, ease: 'easeOut' }}
          className="font-body text-white/55 text-lg max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Junte-se a mais de 18.000 mulheres que transformaram a relação com seu
          corpo usando inteligência de dados femininos.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.34, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/onboarding">
            <button className="inline-flex items-center gap-2 bg-white text-onyx font-body font-semibold px-8 py-4 rounded-full hover:bg-cream transition-all duration-200 active:scale-[0.98] shadow-xl text-[0.95rem]">
              Criar conta gratuita
              <ArrowRight size={17} />
            </button>
          </Link>
          <Link href="/dashboard">
            <button className="inline-flex items-center gap-2 border border-white/20 text-white/80 font-body font-medium px-8 py-4 rounded-full hover:bg-white/8 hover:border-white/35 transition-all duration-200 text-[0.95rem]">
              Ver demonstração
            </button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="font-body text-white/30 text-sm mt-6"
        >
          Grátis para sempre no plano básico · Sem cartão de crédito · Cancele quando quiser
        </motion.p>
      </div>
    </section>
  )
}
