'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronRight } from 'lucide-react'

function fadeUp(delay = 0) {
  return {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1, y: 0,
      transition: { duration: 0.7, delay, ease: 'easeOut' as const },
    },
  }
}

const marqueePhrases = [
  'Ciclo Menstrual', 'Energia & Performance', 'Sono & Recuperação',
  'Equilíbrio Hormonal', 'Saúde Integral', 'Insights Personalizados',
  'Fase Folicular', 'Progesterona', 'Ovulação', 'Cortisol',
  'Biofeedback Feminino', 'Relatórios Mensais',
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden gradient-hero">
      {/* Decorative rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            border: '1px solid rgba(194,132,154,0.12)',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 right-[-6%] -translate-y-1/2 w-[540px] h-[540px] rounded-full"
          style={{
            border: '1.5px dashed rgba(168,156,189,0.15)',
          }}
        />
        <div className="absolute top-1/2 right-[6%] -translate-y-1/2 w-[360px] h-[360px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(194,132,154,0.07) 0%, transparent 70%)' }}
        />

        {/* Blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-petal-light/20 blur-3xl animate-breathe" />
        <div className="absolute -bottom-48 left-[20%] w-[500px] h-[500px] rounded-full bg-lavender-light/25 blur-3xl animate-breathe delay-300" />
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 pt-28 pb-16 grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Left — copy */}
          <div className="flex flex-col">
            <motion.div variants={fadeUp(0.1)} initial="hidden" animate="show" className="inline-flex mb-6">
              <span className="inline-flex items-center gap-2 bg-white/80 border border-petal-light rounded-full pl-2 pr-4 py-1.5 text-xs font-body font-medium text-petal-dark shadow-sm">
                <span className="w-5 h-5 rounded-full gradient-sintera flex items-center justify-center">
                  <span className="text-white text-[9px]">✦</span>
                </span>
                Lançamento 2025 · Versão Beta
                <ChevronRight size={12} className="text-petal ml-0.5" />
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp(0.2)}
              initial="hidden"
              animate="show"
              className="font-display font-semibold leading-[1.05] text-onyx mb-6"
              style={{ fontSize: 'clamp(2.8rem, 5.5vw, 4.2rem)' }}
            >
              O seu corpo tem{' '}
              <span className="text-gradient italic">ciclos de poder.</span>
              <br />
              Aprenda a{' '}
              <span className="relative inline-block">
                usá-los.
                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" preserveAspectRatio="none">
                  <path d="M0 5 Q30 1 60 5 Q90 9 120 5" stroke="#C2849A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp(0.32)}
              initial="hidden"
              animate="show"
              className="font-body text-[1.05rem] text-mauve leading-relaxed max-w-[480px] mb-8"
            >
              SINTERA transforma seus dados biológicos em inteligência feminina —
              ciclo, hormônios, energia, sono e performance. Tudo em um lugar feito para você.
            </motion.p>

            <motion.div
              variants={fadeUp(0.44)}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link href="/onboarding">
                <button className="inline-flex items-center gap-2 gradient-sintera text-white font-body font-medium px-7 py-3.5 rounded-full hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md text-[0.9rem]">
                  Começar gratuitamente
                  <ArrowRight size={16} />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 bg-white border border-border text-onyx font-body font-medium px-7 py-3.5 rounded-full hover:border-petal hover:bg-blush transition-all duration-200 text-[0.9rem] shadow-sm">
                  Ver demonstração
                </button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp(0.56)}
              initial="hidden"
              animate="show"
              className="flex flex-wrap items-center gap-5"
            >
              {/* Avatars */}
              <div className="flex -space-x-2.5">
                {['#EDD5DF','#E2D9EE','#C8E2DB','#F8EDF2','#EEE8E1'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: c, zIndex: 5 - i }}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-body font-semibold text-onyx leading-tight">+18.000 mulheres</p>
                <p className="text-xs font-body text-mauve">já transformaram sua saúde</p>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block" />

              {/* Rating */}
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#C9A97A">
                      <path d="M7 1l1.6 3.3 3.6.5-2.6 2.6.6 3.6L7 9.3l-3.2 1.7.6-3.6L1.8 4.8l3.6-.5z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-body font-medium text-onyx">4.9</span>
                <span className="text-xs text-mauve font-body">(2.1k avaliações)</span>
              </div>
            </motion.div>
          </div>

          {/* Right — product preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
            className="hidden lg:block relative"
          >
            <ProductPreview />
          </motion.div>
        </div>
      </div>

      {/* Marquee strip */}
      <div className="relative border-t border-border/50 bg-white/60 backdrop-blur-sm py-4 overflow-hidden marquee-mask">
        <div className="flex gap-0 w-max animate-marquee">
          {[...marqueePhrases, ...marqueePhrases].map((p, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-5 text-xs font-body font-medium text-mauve uppercase tracking-widest whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-petal inline-block" />
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductPreview() {
  return (
    <div className="relative w-full max-w-[420px] ml-auto">
      {/* Browser-frame card */}
      <div className="card-premium overflow-hidden">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-ivory border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs font-body text-mauve/60 text-center border border-border">
            sintera.app/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 bg-cream">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-body text-mauve">Bom dia, Sofia 🌸</p>
              <p className="text-base font-display font-semibold text-onyx">Dia 8 · Fase Folicular</p>
            </div>
            <div className="w-9 h-9 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-display font-bold">S</span>
            </div>
          </div>

          {/* Cycle arc */}
          <div className="bg-white rounded-2xl p-4 mb-4 border border-border/60">
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full">
                  {/* Segments */}
                  {[
                    { color: '#EDD5DF', start: 0, length: 0.18 },
                    { color: '#C2849A', start: 0.18, length: 0.30, active: true },
                    { color: '#C8E2DB', start: 0.48, length: 0.10 },
                    { color: '#E2D9EE', start: 0.58, length: 0.42 },
                  ].map((seg, i) => {
                    const r = 30, cx = 40, cy = 40
                    const c = 2 * Math.PI * r
                    const offset = c * (0.75 - seg.start)
                    const dash = c * seg.length
                    return (
                      <circle key={i} cx={cx} cy={cy} r={r}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={seg.active ? 9 : 7}
                        strokeDasharray={`${dash} ${c - dash}`}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    )
                  })}
                  <circle cx="40" cy="40" r="20" fill="white" />
                  <text x="40" y="38" textAnchor="middle" fontSize="11" fontWeight="600" fill="#9A6478" fontFamily="serif">8</text>
                  <text x="40" y="50" textAnchor="middle" fontSize="7" fill="#7A6470" fontFamily="sans-serif">dia</text>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-body text-mauve mb-1 uppercase tracking-wider">Fase atual</p>
                <p className="text-base font-display font-semibold text-onyx mb-0.5">Folicular</p>
                <p className="text-[11px] font-body text-mauve">Estrogênio ↑ · Alta energia</p>
                <div className="mt-2 flex gap-1">
                  {['Menstrual', 'Folicular', 'Ovulação', 'Lútea'].map((p, i) => (
                    <span key={p} className={`text-[9px] font-body px-1.5 py-0.5 rounded-full ${i === 1 ? 'bg-petal-light text-petal-dark font-medium' : 'bg-ivory text-mauve'}`}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metric chips */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Energia', value: '84%', color: '#C9A97A', bg: '#F5F0EC' },
              { label: 'Sono', value: '7.5h', color: '#A89CBD', bg: '#F0EBF7' },
              { label: 'Humor', value: '9/10', color: '#C2849A', bg: '#F8EDF2' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl py-2.5 px-2 text-center border border-border/50"
                style={{ backgroundColor: m.bg }}>
                <p className="text-base font-display font-semibold" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[10px] font-body text-mauve">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating insight card */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-10 top-1/3 glass rounded-2xl p-3 shadow-xl w-44"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">⚡</span>
          <span className="text-[11px] font-body font-semibold text-onyx">Alta performance</span>
        </div>
        <p className="text-[10px] font-body text-mauve leading-snug">
          Ótimo dia para treinos intensos e decisões importantes
        </p>
        <div className="mt-2 flex items-center gap-1">
          <div className="flex-1 h-1 bg-ivory rounded-full overflow-hidden">
            <div className="w-4/5 h-full rounded-full" style={{ background: 'linear-gradient(90deg,#C2849A,#A89CBD)' }} />
          </div>
          <span className="text-[9px] font-body text-mauve">84%</span>
        </div>
      </motion.div>

      {/* Floating ovulation card */}
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-8 bottom-16 glass rounded-2xl p-3 shadow-xl w-40"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-5 h-5 rounded-full bg-sage-light flex items-center justify-center text-[10px]">🌿</span>
          <span className="text-[10px] font-body font-semibold text-onyx">Próxima ovulação</span>
        </div>
        <p className="text-lg font-display font-bold text-sage">5 dias</p>
        <p className="text-[9px] font-body text-mauve">Janela fértil: 13–17 jun</p>
      </motion.div>
    </div>
  )
}
