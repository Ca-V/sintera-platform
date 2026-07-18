'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-28 gradient-dark overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-petal/5 blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-4xl mx-auto px-6 text-center relative">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-white leading-tight mb-6">
            Organize hoje.<br />
            <span className="text-shimmer">Acompanhe por toda a vida.</span>
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5 mt-10">
            <Link href="/onboarding">
              <button className="inline-flex items-center gap-2 gradient-sintera text-white font-body font-medium px-8 py-4 rounded-full hover:opacity-90 transition-opacity shadow-lg text-[0.95rem]">
                Criar conta gratuitamente
                <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/login">
              <button className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-body font-medium px-8 py-4 rounded-full hover:bg-white/15 transition-colors text-[0.95rem]">
                Entrar
              </button>
            </Link>
          </div>
          <p className="font-body text-sm text-white/50 mb-14">
            Prefere só acompanhar a evolução?{' '}
            <Link href="/lista-de-espera" className="text-white/80 font-medium hover:underline">Entre na lista de espera</Link>.
          </p>

          <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="font-display italic text-lg lg:text-xl text-white/70 leading-relaxed mt-14 max-w-xl mx-auto">
            Cada informação registrada hoje torna sua história de saúde mais completa amanhã.
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
