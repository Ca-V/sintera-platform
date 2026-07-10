'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ShieldCheck, Lock, FileText, UserCheck } from 'lucide-react'

// Camada 6 da narrativa — "Por que confiar". Foco na TRANQUILIDADE do usuário
// (suas informações preservadas, privadas, no seu controle), NÃO na IA — que é
// meio, não protagonista.
const badges = [
  { icon: ShieldCheck, label: 'Não é dispositivo médico', sub: 'Organiza suas informações, sem emitir diagnósticos (RDC 657/2022)' },
  { icon: Lock,        label: '100% privado',              sub: 'Suas informações nunca são vendidas ou compartilhadas' },
  { icon: FileText,    label: 'Conteúdo preservado',       sub: 'Seus documentos permanecem originais, sem alterações' },
  { icon: UserCheck,   label: 'Você no controle',          sub: 'Suas informações são suas, durante toda a sua jornada' },
]

export default function ScienceSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="confianca" className="py-28 gradient-dark overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-petal/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-lavender/8 blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-6xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full border border-petal/30 text-xs font-body font-medium text-petal uppercase tracking-wider mb-5">
            Por que confiar
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-white leading-tight mb-4">
            Sua história de saúde,<br />
            <span className="text-shimmer">organizada com segurança.</span>
          </h2>
          <p className="font-body text-white/55 text-lg max-w-2xl mx-auto leading-relaxed">
            A SINTERA organiza suas informações preservando seu conteúdo original, sem alterar
            documentos, emitir diagnósticos ou substituir a avaliação dos profissionais de saúde.
            Você permanece no controle das suas informações durante toda a sua jornada de cuidado.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => {
            const Icon = b.icon
            return (
              <motion.div key={b.label}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.09, ease: 'easeOut' }}
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
            &ldquo;Informações de saúde espalhadas em papéis, PDFs e lembranças — a SINTERA reúne tudo
            em uma história clara, que acompanha você e o seu cuidado.&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  )
}
