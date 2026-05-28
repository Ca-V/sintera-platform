'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const stats = [
  { value: '18K+', label: 'mulheres ativas', color: 'text-petal' },
  { value: '4.9★', label: 'avaliação média', color: 'text-gold' },
  { value: '96%', label: 'precisão preditiva', color: 'text-sage' },
  { value: '47', label: 'biomarcadores', color: 'text-lavender' },
]

const logos = ['Forbes Brasil', 'Exame', 'Claudia', 'Veja Saúde', 'Women\'s Health']

export default function StatsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="bg-white border-y border-border">
      {/* Stats row */}
      <div ref={ref} className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              className="text-center lg:px-8"
            >
              <p className={`font-display text-4xl font-semibold ${s.color} mb-1`}>{s.value}</p>
              <p className="font-body text-sm text-mauve">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Press logos */}
      <div className="border-t border-border py-5 overflow-hidden marquee-mask bg-cream/50">
        <div className="flex gap-0 w-max animate-marquee-slow">
          {[...logos, ...logos].map((pub, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-10 font-display text-sm font-medium text-mauve/40 tracking-wide whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-border inline-block" />
              {pub}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
