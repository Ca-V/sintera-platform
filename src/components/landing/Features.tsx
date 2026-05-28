'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Moon, Zap, BedDouble, FlaskConical, HeartPulse, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Moon,
    title: 'Ciclo & Fases',
    description: 'Visualize cada fase — menstrual, folicular, ovulatória e lútea — com dados precisos e previsões inteligentes adaptadas ao seu ritmo único.',
    iconColor: 'text-petal',
    iconBg: 'bg-blush',
    span: 'lg:col-span-1 lg:row-span-2',
    large: true,
  },
  {
    icon: Zap,
    title: 'Energia & Performance',
    description: 'Planeje treinos, reuniões e decisões nos picos certos do seu ciclo.',
    iconColor: 'text-gold',
    iconBg: 'bg-warm',
    span: 'lg:col-span-1',
    large: false,
  },
  {
    icon: BedDouble,
    title: 'Sono & Recuperação',
    description: 'Correlacione qualidade do sono com flutuações hormonais e otimize sua recuperação.',
    iconColor: 'text-lavender',
    iconBg: 'bg-lavender-light',
    span: 'lg:col-span-1',
    large: false,
  },
  {
    icon: FlaskConical,
    title: 'Perfil Hormonal',
    description: 'Estrogênio, progesterona, cortisol — entenda como cada hormônio molda seu dia.',
    iconColor: 'text-sage',
    iconBg: 'bg-sage-light',
    span: 'lg:col-span-2',
    large: false,
    wide: true,
  },
  {
    icon: HeartPulse,
    title: 'Saúde Integral',
    description: 'Hidratação, nutrição e variabilidade cardíaca em um só painel.',
    iconColor: 'text-petal',
    iconBg: 'bg-blush',
    span: 'lg:col-span-1',
    large: false,
  },
  {
    icon: BarChart3,
    title: 'Relatórios & Insights',
    description: 'Relatórios mensais com tendências e recomendações baseadas na sua biologia.',
    iconColor: 'text-mauve',
    iconBg: 'bg-ivory',
    span: 'lg:col-span-1',
    large: false,
  },
]

export default function Features() {
  const titleRef = useRef(null)
  const inView = useInView(titleRef, { once: true, margin: '-60px' })

  return (
    <section id="funcionalidades" className="py-28 bg-cream">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="max-w-2xl mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark mb-5 uppercase tracking-wider">
            Funcionalidades
          </span>
          <h2 className="font-display text-5xl lg:text-6xl font-semibold text-onyx leading-tight mb-4">
            Conheça sua
            <span className="text-gradient italic block">biologia profunda.</span>
          </h2>
          <p className="font-body text-[1.05rem] text-mauve leading-relaxed">
            Cada dado coletado torna-se conhecimento. Porque entender seu corpo
            é o primeiro passo para viver com intenção e clareza.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid lg:grid-cols-3 lg:grid-rows-3 gap-5">
          {features.map((f, i) => (
            <FeatureCell key={f.title} f={f} index={i} sectionInView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCell({
  f, index, sectionInView
}: {
  f: typeof features[0]
  index: number
  sectionInView: boolean
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const Icon = f.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={(inView || sectionInView) ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
      className={`card-premium p-6 flex flex-col ${f.span} ${f.large ? 'justify-between min-h-[340px]' : ''}`}
    >
      <div>
        <div className={`w-11 h-11 rounded-xl ${f.iconBg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={20} className={f.iconColor} />
        </div>
        <h3 className={`font-display font-semibold text-onyx mb-2 ${f.large ? 'text-2xl' : 'text-lg'}`}>
          {f.title}
        </h3>
        <p className={`font-body text-mauve leading-relaxed ${f.large ? 'text-base' : 'text-sm'}`}>
          {f.description}
        </p>
      </div>

      {/* Large card extra visual */}
      {f.large && (
        <div className="mt-6">
          <CycleMiniViz />
        </div>
      )}

      {/* Wide card extra visual */}
      {f.wide && (
        <div className="mt-4">
          <HormoneMiniViz />
        </div>
      )}
    </motion.div>
  )
}

function CycleMiniViz() {
  const phases = [
    { label: 'Menstrual', pct: 18, color: '#EDD5DF', textColor: '#9A6478' },
    { label: 'Folicular', pct: 30, color: '#C2849A', textColor: '#9A6478', active: true },
    { label: 'Ovulatória', pct: 10, color: '#C8E2DB', textColor: '#5A9080' },
    { label: 'Lútea', pct: 42, color: '#E2D9EE', textColor: '#7A6490' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {phases.map((p) => (
        <div key={p.label} className="flex items-center gap-3">
          <span className="w-24 text-xs font-body text-mauve flex-shrink-0">{p.label}</span>
          <div className="flex-1 h-2 bg-ivory rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: p.color, width: `${p.pct}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${p.pct}%` }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="w-8 text-right text-xs font-body" style={{ color: p.textColor }}>
            {p.pct}%
          </span>
        </div>
      ))}
    </div>
  )
}

function HormoneMiniViz() {
  const days = [1,5,8,10,13,16,20,24,28]
  const estroValues = [20,30,65,80,95,60,40,50,30]
  const progesValues = [10,10,15,20,30,40,80,75,20]
  const maxW = 95

  return (
    <div className="flex items-end gap-2">
      {days.map((d, i) => (
        <div key={d} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full flex flex-col gap-0.5">
            <motion.div
              className="w-full rounded-sm"
              style={{ backgroundColor: '#EDD5DF', height: `${(estroValues[i] / maxW) * 40}px` }}
              initial={{ height: 0 }}
              animate={{ height: `${(estroValues[i] / maxW) * 40}px` }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
            />
            <motion.div
              className="w-full rounded-sm"
              style={{ backgroundColor: '#E2D9EE', height: `${(progesValues[i] / maxW) * 40}px` }}
              initial={{ height: 0 }}
              animate={{ height: `${(progesValues[i] / maxW) * 40}px` }}
              transition={{ duration: 0.8, delay: i * 0.05 + 0.1, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[9px] font-body text-mauve">{d}</span>
        </div>
      ))}
      <div className="flex flex-col gap-2 ml-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-petal-light" />
          <span className="text-[9px] font-body text-mauve">Estrogênio</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-lavender-light" />
          <span className="text-[9px] font-body text-mauve">Progesterona</span>
        </div>
      </div>
    </div>
  )
}
