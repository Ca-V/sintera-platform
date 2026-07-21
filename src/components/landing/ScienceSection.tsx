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
    <section id="confianca" className="py-28 overflow-hidden relative"
      style={{ background: 'linear-gradient(150deg, #9BD8E0 0%, #6FC1CF 58%, #57B0BF 100%)' }}>
      {/* "Flores" do Almond Blossom — mesmas do painel do Login */}
      <div className="absolute -top-16 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(246,242,234,0.45)' }} />
      <div className="absolute bottom-0 right-1/5 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(167,185,140,0.28)' }} />
      <div className="absolute -bottom-10 left-1/3 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(193,131,106,0.18)' }} />

      <div ref={ref} className="max-w-6xl mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#123A40]/25 text-xs font-body font-semibold text-[#123A40] uppercase tracking-wider mb-5">
            Segurança e privacidade
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Por que confiar suas informações<br />
            <span className="text-petal-dark">de saúde à SINTERA?</span>
          </h2>
          <p className="font-body text-onyx/70 text-lg max-w-2xl mx-auto leading-relaxed">
            A SINTERA organiza suas informações preservando o seu conteúdo original: não altera o documento,
            não emite diagnósticos e não substitui a avaliação dos profissionais de saúde.
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
                className="flex items-start gap-3 bg-white/55 backdrop-blur-sm rounded-2xl p-5 border border-white/60">
                <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-petal" />
                </div>
                <div>
                  <p className="text-sm font-body font-semibold text-onyx leading-tight mb-0.5">{b.label}</p>
                  <p className="text-xs font-body text-onyx/60 leading-snug">{b.sub}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
          className="mt-16 max-w-2xl mx-auto text-center border-t border-onyx/10 pt-12">
          <p className="font-display text-2xl font-light text-onyx/75 italic leading-relaxed">
            &ldquo;Informações de saúde espalhadas em papéis, PDFs e lembranças — a SINTERA reúne tudo
            em uma história clara, que acompanha você e o seu cuidado.&rdquo;
          </p>
        </motion.div>
      </div>
    </section>
  )
}
