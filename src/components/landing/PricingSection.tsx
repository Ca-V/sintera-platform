'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, Sparkles } from 'lucide-react'

const plans = [
  {
    name: 'Livre',
    price: 'Grátis',
    sub: 'para sempre',
    description: 'Para quem quer começar a entender seu ciclo.',
    cta: 'Começar grátis',
    ctaHref: '/onboarding',
    primary: false,
    features: [
      'Rastreamento básico do ciclo',
      'Previsão de período e ovulação',
      'Registro de sintomas e humor',
      'Dashboard com métricas essenciais',
      '3 insights por semana',
    ],
  },
  {
    name: 'Premium',
    price: 'R$ 29',
    sub: '/mês · cancele quando quiser',
    description: 'Inteligência completa para quem leva a sério sua saúde.',
    cta: 'Começar Premium',
    ctaHref: '/onboarding',
    primary: true,
    badge: 'Mais popular',
    features: [
      'Tudo do plano Livre',
      'Insights diários ilimitados',
      'Perfil hormonal detalhado',
      'Sincronização com energia & sono',
      'Relatórios mensais completos',
      'Integração com wearables (em breve)',
      'Acesso prioritário a novidades',
    ],
  },
]

export default function PricingSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section id="planos" className="py-28 bg-ivory">
      <div ref={ref} className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-lavender-light border border-lavender/25 text-xs font-body font-medium text-lavender uppercase tracking-wider mb-5">
            Planos
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx mb-3">
            Simples e transparente.
          </h2>
          <p className="font-body text-mauve text-lg">
            Sem surpresas. Cancele quando quiser.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: 'easeOut' }}
              className={`relative rounded-3xl p-8 flex flex-col ${
                plan.primary
                  ? 'gradient-sintera text-white shadow-xl shadow-petal/20'
                  : 'bg-white border border-border'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-onyx text-white text-xs font-body font-medium px-4 py-1.5 rounded-full shadow-md">
                    <Sparkles size={11} />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className={`font-body text-sm font-semibold uppercase tracking-wider mb-2 ${plan.primary ? 'text-white/70' : 'text-mauve'}`}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className={`font-display text-4xl font-semibold ${plan.primary ? 'text-white' : 'text-onyx'}`}>
                    {plan.price}
                  </span>
                  {plan.sub && (
                    <span className={`font-body text-sm ${plan.primary ? 'text-white/60' : 'text-mauve'}`}>
                      {plan.sub}
                    </span>
                  )}
                </div>
                <p className={`font-body text-sm ${plan.primary ? 'text-white/75' : 'text-mauve'}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.primary ? 'bg-white/20' : 'bg-blush'}`}>
                      <Check size={10} className={plan.primary ? 'text-white' : 'text-petal'} />
                    </div>
                    <span className={`font-body text-sm leading-snug ${plan.primary ? 'text-white/85' : 'text-onyx/75'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref}>
                <button className={`w-full py-3.5 rounded-xl font-body font-semibold text-sm transition-all duration-200 active:scale-[0.98] ${
                  plan.primary
                    ? 'bg-white text-petal-dark hover:bg-cream'
                    : 'gradient-sintera text-white hover:opacity-90'
                }`}>
                  {plan.cta}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-sm font-body text-mauve/60 mt-8"
        >
          Precisa de solução para equipes ou empresas?{' '}
          <a href="mailto:business@sintera.app" className="text-petal hover:underline">Fale com a gente.</a>
        </motion.p>
      </div>
    </section>
  )
}
