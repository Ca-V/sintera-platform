'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const stats = [
  { value: 'Grátis', label: 'Acesso completo, sem custo',  color: 'text-petal'    },
  { value: '100%',   label: 'Privado — nunca compartilhado', color: 'text-sage'   },
  { value: 'IA',     label: 'Lê seus documentos e organiza por você', color: 'text-lavender' },
  { value: 'Docs',   label: 'Exames, receitas e outros documentos',  color: 'text-gold'     },
]

export default function StatsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="bg-white border-y border-border">
      <div ref={ref} className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border">
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              className="text-center lg:px-8">
              <p className={`font-display text-3xl font-semibold ${s.color} mb-1`}>{s.value}</p>
              <p className="font-body text-sm text-mauve">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
