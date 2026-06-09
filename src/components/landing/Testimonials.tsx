'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-28 bg-cream">
      <div ref={ref} className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-6">
            Beta · Acesso antecipado
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-6">
            Seja uma das primeiras<br />
            <span className="text-gradient">a usar a SINTERA.</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-xl mx-auto leading-relaxed mb-10">
            A SINTERA está em Beta fechado com um grupo seleto de pessoas.
            O acesso é gratuito durante o Beta e seu feedback molda diretamente
            o desenvolvimento da plataforma.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/onboarding">
              <button className="inline-flex items-center gap-2 gradient-sintera text-white font-body font-medium px-8 py-4 rounded-full hover:opacity-90 transition-opacity shadow-md text-[0.95rem]">
                Solicitar acesso Beta
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { emoji: '🧪', title: 'Gratuito no Beta',   desc: 'Acesso completo sem custo durante o período de Beta.' },
              { emoji: '🔒', title: 'Dados protegidos',   desc: 'LGPD compliant. Seus dados são seus. Exclua a qualquer momento.' },
              { emoji: '💬', title: 'Seu feedback importa', desc: 'Cada relato de problema ou sugestão influencia diretamente o produto.' },
            ].map(({ emoji, title, desc }) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card-premium p-6 text-left">
                <span className="text-3xl block mb-3">{emoji}</span>
                <h3 className="font-body text-sm font-semibold text-onyx mb-1">{title}</h3>
                <p className="font-body text-xs text-mauve leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
