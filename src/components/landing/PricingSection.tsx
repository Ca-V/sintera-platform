'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, ArrowRight } from 'lucide-react'

const features = [
  'Documentos e registros de saúde ilimitados',
  'Organização automática — sem digitação',
  'Sua história de saúde em uma linha do tempo',
  'Registro de consultas, medicamentos, sintomas e hábitos',
  'Lembretes de compromissos por e-mail e WhatsApp',
  'Relatórios prontos para compartilhar',
  'Suas informações protegidas — LGPD',
  'Exclusão de conta e dados a qualquer momento',
]

export default function PricingSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="planos" className="py-28 bg-white">
      <div ref={ref} className="max-w-3xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
            Planos
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx leading-tight mb-4">
            Gratuito agora.<br />
            <span className="text-gradient">Para sempre transparente.</span>
          </h2>
          <p className="font-body text-mauve text-lg max-w-xl mx-auto">
            No momento, o acesso é completamente gratuito.
            Quando lançarmos os planos pagos, você será avisada com antecedência.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card-premium p-8 border-2 border-petal/20">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-2xl font-semibold text-onyx">Gratuito</h3>
                <span className="font-body text-xs font-medium text-sage bg-sage-light px-2.5 py-0.5 rounded-full border border-sage/20">
                  Acesso completo
                </span>
              </div>
              <p className="font-body text-sm text-mauve">Acesso completo a todos os recursos</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-display text-4xl font-bold text-petal">R$0</p>
              <p className="font-body text-xs text-mauve">/mês · por enquanto</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {features.map(f => (
              <div key={f} className="flex items-start gap-2.5">
                <Check size={14} className="text-sage flex-shrink-0 mt-0.5" />
                <span className="font-body text-sm text-onyx/80 leading-snug">{f}</span>
              </div>
            ))}
          </div>

          <Link href="/onboarding" className="block">
            <button className="w-full flex items-center justify-center gap-2 gradient-sintera text-white font-body font-medium py-4 rounded-full hover:opacity-90 transition-opacity shadow-md text-[0.95rem]">
              Criar conta gratuita
              <ArrowRight size={16} />
            </button>
          </Link>

          <p className="font-body text-xs text-mauve text-center mt-4">
            Sem cartão de crédito. Sem compromisso.
            Você pode excluir sua conta e todos os dados a qualquer momento.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
