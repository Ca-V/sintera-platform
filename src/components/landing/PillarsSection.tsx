'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { LayoutGrid, TrendingUp, ShieldCheck, Link2 } from 'lucide-react'

// HOM-001 — Os 4 pilares institucionais da SINTERA (principal diferencial). Revisão fundadora 17/07:
// "Visão integrada" passa a ser o diferencial-líder; Continuidade + Longitudinalidade unificadas em
// "Acompanhamento longitudinal" (removida a sobreposição); Governança e Rastreabilidade tornadas CONCRETAS
// (capacidades, não conceitos): LGPD + RDC 657/2022; origem·documento·data·histórico de alterações.
const pillars = [
  {
    icon: LayoutGrid,
    title: 'Visão integrada da saúde',
    desc: 'Toda a sua história de saúde num único ambiente — para compreender a trajetória completa, e não informações soltas. É a principal entrega da SINTERA.',
  },
  {
    icon: TrendingUp,
    title: 'Acompanhamento longitudinal',
    desc: 'O cuidado acompanha você ao longo do tempo: o valor está na evolução — a trajetória das suas informações, não o dado isolado.',
  },
  {
    icon: ShieldCheck,
    title: 'Governança',
    desc: 'Organiza e gerencia suas informações com boas práticas de segurança e privacidade, em conformidade com a LGPD e a RDC 657/2022 (ANVISA), preservando a integridade, a confiabilidade e a organização dos registros.',
  },
  {
    icon: Link2,
    title: 'Rastreabilidade',
    desc: 'Cada informação mantém a origem preservada — vinculada ao documento original, à data do registro e ao histórico de alterações — permitindo acompanhar toda a sua trajetória ao longo do tempo.',
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
