'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Star, Quote } from 'lucide-react'

const featured = {
  name: 'Mariana Luz',
  role: 'Triatleta profissional · 29 anos',
  text: 'Sincronizar minha periodização de treinos com as fases do ciclo foi o maior salto de performance da minha carreira. A SINTERA me deu o mapa que nenhum técnico nunca me ensinou.',
  avatar: '#C2849A',
  initials: 'ML',
  metric: '+31% performance em competições desde que comecei a usar',
}

const reviews = [
  {
    name: 'Ana Clara M.',
    role: 'Nutricionista, 32 anos',
    text: 'Finalmente entendo por que certas semanas me sinto invencível e outras sem energia. A SINTERA mudou como me planejo.',
    avatar: '#9A6478',
    initials: 'AC',
  },
  {
    name: 'Isabela R.',
    role: 'Executiva, 38 anos',
    text: 'Minhas reuniões de alto impacto são sempre na fase folicular ou ovulatória. Parece óbvio depois que você aprende.',
    avatar: '#7DAF9E',
    initials: 'IR',
  },
  {
    name: 'Camila F.',
    role: 'Médica, 35 anos',
    text: 'Eu trato pacientes com questões hormonais há 10 anos. Me surpreendi com a qualidade dos insights da plataforma.',
    avatar: '#A89CBD',
    initials: 'CF',
  },
  {
    name: 'Renata P.',
    role: 'Coach, 41 anos',
    text: 'Recomendo para todas as minhas clientes. Não é só um rastreador de ciclo — é uma ferramenta de autoconhecimento real.',
    avatar: '#C9A97A',
    initials: 'RP',
  },
]

export default function Testimonials() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="py-28 bg-cream overflow-hidden">
      <div ref={ref} className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-sage-light border border-sage/25 text-xs font-body font-medium text-sage uppercase tracking-wider mb-5">
            Depoimentos
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold text-onyx mb-3">
            Elas transformaram
            <span className="text-gradient italic block">sua relação com o corpo.</span>
          </h2>
        </motion.div>

        {/* Featured */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="relative gradient-sintera rounded-3xl p-8 lg:p-12 mb-6 overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-xl" />

          <div className="relative flex flex-col lg:flex-row items-start gap-8">
            <Quote size={48} className="text-white/20 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-display text-xl lg:text-2xl font-light text-white leading-relaxed mb-6 italic">
                "{featured.text}"
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-display font-bold text-base shadow-md"
                  style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                >
                  {featured.initials}
                </div>
                <div>
                  <p className="font-body font-semibold text-white">{featured.name}</p>
                  <p className="text-sm font-body text-white/70">{featured.role}</p>
                </div>
                <div className="hidden lg:block ml-auto bg-white/15 rounded-2xl px-4 py-3 text-right">
                  <p className="text-xs font-body text-white/70 mb-0.5">Resultado</p>
                  <p className="text-sm font-body font-semibold text-white">{featured.metric}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grid reviews */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.2 + i * 0.09, ease: 'easeOut' }}
              className="card-premium p-5"
            >
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} size={12} className="fill-gold text-gold" />
                ))}
              </div>
              <p className="font-body text-sm text-onyx/75 leading-relaxed mb-4 italic">
                "{t.text}"
              </p>
              <div className="flex items-center gap-2.5 pt-3 border-t border-border">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-display font-bold flex-shrink-0"
                  style={{ backgroundColor: t.avatar }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-xs font-body font-semibold text-onyx leading-tight">{t.name}</p>
                  <p className="text-[11px] font-body text-mauve leading-tight">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Marquee logos strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 pt-10 border-t border-border"
        >
          <p className="text-center text-xs font-body text-mauve/60 uppercase tracking-widest mb-6">
            Mencionada em
          </p>
          <div className="flex items-center justify-center flex-wrap gap-8">
            {['Forbes Brasil', 'Exame', 'Claudia', 'Women\'s Health', 'Veja Saúde', 'Boa Forma'].map((pub) => (
              <span key={pub} className="font-display text-base font-medium text-mauve/40 tracking-wide">
                {pub}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
