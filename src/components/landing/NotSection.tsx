'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Stethoscope, FileText, Brain, Gauge, UserRound } from 'lucide-react'

// HOM-001 — "O que a SINTERA NÃO é". Reforça os limites regulatórios (RDC 657/2022): a plataforma organiza e
// preserva; não diagnostica, não interpreta, não decide. Fecho positivo: quem cuida é a pessoa + sua equipe.
const nots = [
  { icon: Stethoscope, label: 'Não é telemedicina', desc: 'Não realiza atendimento nem conduta clínica.' },
  { icon: FileText, label: 'Não é prontuário eletrônico', desc: 'Não substitui o registro clínico do serviço de saúde.' },
  { icon: Brain, label: 'Não é IA diagnóstica', desc: 'Não emite diagnósticos nem interpreta seus resultados.' },
  { icon: Gauge, label: 'Não é score de risco', desc: 'Não classifica nem prevê seu estado de saúde.' },
  { icon: UserRound, label: 'Não substitui o médico', desc: 'Apoia; a avaliação e a decisão são da sua equipe de saúde.' },
]

export default function NotSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="limites" className="py-28 bg-cream">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Transparência
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            O que a SINTERA <span className="text-gradient">não é</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-2xl mx-auto leading-relaxed">
            Ser clara sobre os limites faz parte do cuidado. A SINTERA organiza e preserva suas informações —
            ela não interpreta, não diagnostica e não decide.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nots.map((n, i) => {
            const Icon = n.icon
            return (
              <motion.div key={n.label}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
                className="flex items-start gap-3 rounded-2xl bg-white border border-border p-5">
                <div className="w-9 h-9 rounded-xl bg-mauve/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-mauve" />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-onyx leading-tight">{n.label}</p>
                  <p className="font-body text-xs text-mauve mt-0.5 leading-snug">{n.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-center font-body text-sm text-onyx/70 mt-10 max-w-2xl mx-auto">
          A SINTERA apoia o seu cuidado — <strong className="text-onyx">quem cuida é você e a sua equipe de saúde.</strong>
        </motion.p>
      </div>
    </section>
  )
}
