'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ShieldCheck, Lock, FileText, Brain } from 'lucide-react'

const badges = [
  { icon: ShieldCheck, label: 'Não é SaMD',            sub: 'Organiza dados — não diagnostica' },
  { icon: Lock,        label: '100% privado',           sub: 'Dados nunca vendidos ou compartilhados' },
  { icon: FileText,    label: 'Qualquer laboratório',   sub: 'Lê PDFs de todos os labs brasileiros' },
  { icon: Brain,       label: 'IA como meio',           sub: 'Clareza para você é o fim' },
]

const pillars = [
  { value: 'PDF',    label: 'Qualquer laudo em PDF'          },
  { value: 'IA',     label: 'Extração automática'            },
  { value: 'LGPD',   label: 'Conformidade com privacidade'   },
  { value: 'Zero',   label: 'Diagnósticos automáticos'       },
]

export default function ScienceSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="ciencia" className="py-28 gradient-dark overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-petal/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-lavender/8 blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full border border-petal/30 text-xs font-body font-medium text-petal uppercase tracking-wider mb-5">
            Como a SINTERA funciona
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-white leading-tight mb-4">
            IA como ferramenta.<br />
            <span className="text-shimmer">Você no controle.</span>
          </h2>
          <p className="font-body text-white/55 text-lg max-w-xl mx-auto leading-relaxed">
            A SINTERA usa inteligência artificial para extrair biomarcadores dos seus laudos em PDF
            e organiza tudo em um histórico longitudinal claro. Sem diagnóstico. Sem interpretação clínica.
            A decisão é sempre sua.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {pillars.map((p, i) => (
            <motion.div key={p.label}
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.09, ease: 'easeOut' }}
              className="glass-dark rounded-2xl p-6 text-center border border-white/8">
              <p className="font-display text-3xl font-semibold text-gradient mb-1">{p.value}</p>
              <p className="font-body text-sm text-white/50">{p.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => {
            const Icon = b.icon
            return (
              <motion.div key={b.label}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.09, ease: 'easeOut' }}
                className="flex items-start gap-3 glass-dark rounded-2xl p-5 border border-white/8">
                <div className="w-9 h-9 rounded-xl bg-petal/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-petal-light" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-white leading-tight mb-0.5">{b.label}</p>
                  <p className="text-xs font-body text-white/45 leading-snug">{b.sub}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
          className="mt-16 max-w-2xl mx-auto text-center border-t border-white/10 pt-12">
          <p className="font-display text-2xl font-light text-white/80 italic leading-relaxed">
            "Anos de exames espalhados em papel e PDF. A SINTERA transforma isso em uma linha do tempo
            que você consegue entender — e levar para o seu médico."
          </p>
        </motion.div>
      </div>
    </section>
  )
}
