'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { User, Building2, Watch } from 'lucide-react'

// Camada 5 da narrativa — "Como a SINTERA evolui comigo ao longo do tempo".
// Descreve o ESTADO ATUAL com precisão e prepara a VISÃO FUTURA, sem prometer
// funcionalidades ainda não implementadas.
//
// ⚠️ MARCADOR DE EVOLUÇÃO: quando as integrações automáticas (instituições
// parceiras) e a conexão com wearables/apps entrarem no ar, trocar APENAS o
// parágrafo `futureText` abaixo por uma descrição de estado atual, ex.:
// "A SINTERA reúne automaticamente informações provenientes dos seus
// laboratórios, clínicas, dispositivos e aplicativos de saúde." Nada mais muda.
const currentText =
  'Hoje você pode registrar suas informações e adicionar documentos recebidos de laboratórios, clínicas e profissionais de saúde.'
const futureText =
  'A evolução da plataforma permitirá que essas informações também sejam recebidas automaticamente de instituições parceiras e integradas a dispositivos e aplicativos de saúde, como relógios inteligentes e plataformas de atividade física.'

const sources = [
  { icon: User,      label: 'Você',                 sub: 'Registros e documentos que você adiciona', now: true  },
  { icon: Building2, label: 'Laboratórios e clínicas', sub: 'Recebimento automático de instituições parceiras', now: false },
  { icon: Watch,     label: 'Dispositivos e apps',  sub: 'Relógios inteligentes e atividade física', now: false },
]

export default function EcosystemSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="ecossistema" className="py-28 bg-cream">
      <div ref={ref} className="max-w-4xl mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Cresce com você
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-6">
            Cada nova informação torna sua<br />
            <span className="text-gradient">história de saúde mais completa.</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-2xl mx-auto leading-relaxed mb-3">
            {currentText}
          </p>
          <p className="font-body text-mauve text-lg max-w-2xl mx-auto leading-relaxed">
            {futureText}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4 mt-14">
          {sources.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                className="card-premium p-6 text-left relative">
                <div className="w-11 h-11 rounded-2xl bg-blush flex items-center justify-center mb-4">
                  <Icon size={20} className="text-petal" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-lg font-semibold text-onyx">{s.label}</h3>
                  <span className={`font-body text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    s.now
                      ? 'text-sage bg-sage-light border-sage/20'
                      : 'text-mauve bg-warm border-border'
                  }`}>
                    {s.now ? 'Hoje' : 'Em breve'}
                  </span>
                </div>
                <p className="font-body text-sm text-mauve leading-relaxed">{s.sub}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
