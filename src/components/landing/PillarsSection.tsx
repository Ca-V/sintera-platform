'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Infinity as InfinityIcon, TrendingUp, ShieldCheck, Link2 } from 'lucide-react'

// HOM-001 — Os 4 pilares institucionais da SINTERA (principal diferencial). Fundamentados na Narrativa
// Estratégica (continuidade = missão; longitudinalidade = ativo; governança = moat; rastreabilidade = proveniência).
const pillars = [
  {
    icon: InfinityIcon,
    title: 'Continuidade',
    desc: 'O cuidado acompanha você ao longo da vida — sem recomeçar do zero a cada consulta ou exame.',
  },
  {
    icon: TrendingUp,
    title: 'Longitudinalidade',
    desc: 'O que importa é a trajetória: a evolução das suas informações no tempo, não o dado isolado.',
  },
  {
    icon: ShieldCheck,
    title: 'Governança',
    desc: 'Suas informações são organizadas, estruturadas e preservadas com regras claras e consistentes.',
  },
  {
    icon: Link2,
    title: 'Rastreabilidade',
    desc: 'Cada informação volta à sua origem — o laudo ou registro original. Nada fica solto.',
  },
]

export default function PillarsSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="pilares" className="py-28 bg-white">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }} className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            O que nos diferencia
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Quatro pilares que sustentam <span className="text-gradient">sua história de saúde</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-2xl mx-auto leading-relaxed">
            Mais do que guardar documentos, a SINTERA constrói uma história de saúde contínua, íntegra e sua.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.div key={p.title}
                initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.09, ease: 'easeOut' }}
                className="card-premium p-7 flex flex-col gap-4 h-full">
                <div className="w-12 h-12 rounded-2xl gradient-sintera flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-onyx mb-2">{p.title}</h3>
                  <p className="font-body text-sm text-mauve leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
