'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Upload, TrendingUp, FileText } from 'lucide-react'

const floatingChips = [
  { icon: Upload,     text: 'Dados extraídos em segundos',         color: 'bg-blush/20 text-petal border-petal/20'       },
  { icon: TrendingUp, text: '7 anos de exames organizados',       color: 'bg-sage-light/20 text-sage border-sage/20'    },
  { icon: FileText,   text: '24 biomarcadores extraídos',         color: 'bg-lavender-light/20 text-lavender border-lavender/20' },
]

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
            Seus exames merecem<br />
            <span className="text-shimmer">ser compreendidos.</span>
          </h2>
          <p className="font-body text-white/60 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Pare de guardar laudos em pasta. Comece a entender o que eles dizem
            sobre a sua saúde ao longo do tempo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link href="/lista-de-espera">
              <button className="inline-flex items-center gap-2 gradient-sintera text-white font-body font-medium px-8 py-4 rounded-full hover:opacity-90 transition-opacity shadow-lg text-[0.95rem]">
                Começar gratuitamente
                <ArrowRight size={16} />
              </button>
            </Link>
            <Link href="/login">
              <button className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-body font-medium px-8 py-4 rounded-full hover:bg-white/15 transition-colors text-[0.95rem]">
                Já tenho conta
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {floatingChips.map(({ icon: Icon, text, color }) => (
              <motion.span key={text}
                initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 }}
                className={`inline-flex items-center gap-2 border rounded-full px-4 py-2 text-xs font-body font-medium backdrop-blur-sm ${color}`}>
                <Icon size={12} />
                {text}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
