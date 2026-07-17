'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  CalendarDays, Clock, TrendingUp, Ruler, Activity, FileText,
  Stethoscope, Pill, Leaf, Accessibility, HeartPulse, Droplet, Receipt, ScrollText,
} from 'lucide-react'

// HOM-001 — Módulos & benefícios. Espelha a taxonomia da navegação (FB-010): o que a pessoa recebe.
// Benefícios FACTUAIS (organiza/acompanha/registra) — sem juízo clínico (RDC 657).
const groups: { domain: string; items: { icon: React.ElementType; name: string; desc: string }[] }[] = [
  {
    domain: 'Acompanhamento',
    items: [
      { icon: CalendarDays, name: 'Agenda', desc: 'Consultas, exames e lembretes.' },
      { icon: Clock, name: 'Registros de Saúde', desc: 'Sua linha do tempo de saúde.' },
      { icon: TrendingUp, name: 'Histórico de Exames', desc: 'Cada exame ao longo do tempo.' },
      { icon: Ruler, name: 'Composição Corporal', desc: 'Evolução do corpo, de várias fontes.' },
      { icon: Activity, name: 'Monitoramento', desc: 'Sinais e atividades no tempo.' },
    ],
  },
  {
    domain: 'Minha Saúde',
    items: [
      { icon: Stethoscope, name: 'Condições de Saúde', desc: 'O que você acompanha e o histórico familiar.' },
      { icon: Pill, name: 'Medicamentos', desc: 'O que você usa, com lembretes.' },
      { icon: Leaf, name: 'Suplementos', desc: 'Registro e recompra.' },
      { icon: Accessibility, name: 'Recursos de Saúde', desc: 'Óculos, lentes e outros recursos.' },
      { icon: HeartPulse, name: 'Hábitos', desc: 'Rotinas que fazem parte do seu cuidado.' },
      { icon: Droplet, name: 'Ciclo e Contracepção', desc: 'Acompanhamento do ciclo.' },
    ],
  },
  {
    domain: 'Documentos & Organização',
    items: [
      { icon: FileText, name: 'Exames', desc: 'Envie laudos; a SINTERA lê e organiza.' },
      { icon: Receipt, name: 'Despesas', desc: 'A visão financeira dos seus cuidados.' },
      { icon: ScrollText, name: 'Relatórios', desc: 'Compartilhe com quem cuida de você.' },
    ],
  },
]

export default function ModulesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="modulos" className="py-28 bg-cream">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }} className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Tudo num só lugar
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Os módulos da <span className="text-gradient">sua história de saúde</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-2xl mx-auto leading-relaxed">
            Cada parte do seu cuidado, organizada e conectada — para você acompanhar e compartilhar com facilidade.
          </p>
        </motion.div>

        <div className="space-y-8">
          {groups.map((g, gi) => (
            <motion.div key={g.domain}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + gi * 0.08 }}>
              <p className="font-body text-xs font-semibold text-petal-dark uppercase tracking-wider mb-3">{g.domain}</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map(m => {
                  const Icon = m.icon
                  return (
                    <div key={m.name} className="card-premium p-5 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-petal" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-semibold text-onyx">{m.name}</h3>
                        <p className="font-body text-xs text-mauve mt-0.5 leading-snug">{m.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
