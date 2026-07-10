'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Upload, TrendingUp, Share2 } from 'lucide-react'

function fadeUp(delay = 0) {
  return {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: 'easeOut' as const } },
  }
}

const marqueePhrases = [
  'Hemograma', 'Glicemia', 'Vitamina D', 'Ferritina', 'TSH', 'Colesterol Total',
  'Triglicerídeos', 'Vitamina B12', 'PCR', 'Insulina', 'Cortisol', 'Creatinina',
  'Ácido Úrico', 'Albumina', 'Bilirrubina', 'Hormônios', 'Leucócitos', 'Plaquetas',
]

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden gradient-hero">
      {/* Decorative rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ border: '1px solid rgba(194,132,154,0.12)' }} />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 right-[-6%] -translate-y-1/2 w-[540px] h-[540px] rounded-full"
          style={{ border: '1.5px dashed rgba(168,156,189,0.15)' }} />
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
                Sua saúde, organizada para toda a vida.
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp(0.2)} initial="hidden" animate="show"
              className="font-display font-semibold leading-[1.1] text-onyx mb-6"
              style={{ fontSize: 'clamp(1.9rem, 3.6vw, 2.9rem)' }}>
              Todas as informações da sua saúde, organizadas para que você compreenda melhor a{' '}
              <span className="text-gradient italic">evolução do seu cuidado ao longo da vida.</span>
            </motion.h1>

            <motion.p variants={fadeUp(0.32)} initial="hidden" animate="show"
              className="font-body text-[1.05rem] text-mauve leading-relaxed max-w-[540px] mb-6">
              A SINTERA reúne e organiza as informações da sua saúde à medida que você registra seus
              dados e adiciona documentos e registros de saúde, construindo uma visão clara da evolução
              do seu cuidado ao longo da vida.
            </motion.p>

            {/* Frase de impacto */}
            <motion.p variants={fadeUp(0.4)} initial="hidden" animate="show"
              className="font-display italic text-petal-dark leading-snug mb-8"
              style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)' }}>
              Quem compreende melhor sua saúde, cuida melhor dela.
            </motion.p>

            <motion.div variants={fadeUp(0.44)} initial="hidden" animate="show"
              className="flex flex-wrap gap-3 mb-4">
              <Link href="/onboarding">
                <button className="inline-flex items-center gap-2 gradient-sintera text-white font-body font-medium px-7 py-3.5 rounded-full hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md text-[0.9rem]">
                  Criar conta gratuitamente
                  <ArrowRight size={16} />
                </button>
              </Link>
              <Link href="/login">
                <button className="inline-flex items-center gap-2 bg-white border border-border text-onyx font-body font-medium px-7 py-3.5 rounded-full hover:border-petal hover:bg-blush transition-all duration-200 text-[0.9rem] shadow-sm">
                  Entrar
                </button>
              </Link>
            </motion.div>

            {/* Texto complementar */}
            <motion.p variants={fadeUp(0.5)} initial="hidden" animate="show"
              className="font-body text-sm text-mauve leading-relaxed max-w-[540px] mb-5">
              Ao transformar informações dispersas em uma história de saúde organizada e contínua, a
              SINTERA facilita o acompanhamento da sua saúde e apoia as decisões que você toma junto aos
              profissionais que participam do seu cuidado.
            </motion.p>

            {/* Lista de espera continua disponível para quem quer só acompanhar */}
            <motion.p variants={fadeUp(0.58)} initial="hidden" animate="show"
              className="font-body text-sm text-mauve mb-10">
              Prefere só acompanhar a evolução da plataforma?{' '}
              <Link href="/lista-de-espera" className="text-petal font-medium hover:underline">Entre na lista de espera</Link>.
            </motion.p>

            {/* 3 pilares */}
            <motion.div variants={fadeUp(0.64)} initial="hidden" animate="show"
              className="flex flex-col sm:flex-row gap-4">
              {[
                { icon: Upload,     color: 'text-petal',    bg: 'bg-blush',          text: 'Tudo num só lugar, organizado'   },
                { icon: TrendingUp, color: 'text-lavender', bg: 'bg-lavender-light', text: 'Evolução ao longo do tempo'      },
                { icon: Share2,     color: 'text-sage',     bg: 'bg-sage-light',     text: 'Relatório para compartilhar'     },
              ].map(({ icon: Icon, color, bg, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={14} className={color} />
                  </div>
                  <span className="font-body text-xs text-mauve leading-snug">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — product preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
            className="hidden lg:block relative">
            <ProductPreview />
          </motion.div>
        </div>
      </div>

      {/* Marquee — biomarcadores reais */}
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
  const biomarkers = [
    { name: 'Glicemia',    value: '92',  unit: 'mg/dL', status: 'dentro',  color: 'text-sage',       indicator: '✓' },
    { name: 'Vitamina D',  value: '18',  unit: 'ng/mL', status: 'abaixo',  color: 'text-blue-600',   indicator: '▼' },
    { name: 'Ferritina',   value: '14',  unit: 'ng/mL', status: 'abaixo',  color: 'text-blue-600',   indicator: '▼' },
    { name: 'TSH',         value: '2.1', unit: 'mUI/L', status: 'dentro',  color: 'text-sage',       indicator: '✓' },
    { name: 'Colesterol',  value: '198', unit: 'mg/dL', status: 'dentro',  color: 'text-sage',       indicator: '✓' },
  ]

  return (
    <div className="relative w-full max-w-[420px] ml-auto">
      {/* Browser-frame card */}
      <div className="card-premium overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-ivory border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
          </div>
          <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs font-body text-mauve text-center border border-border">
            sintera.app/dashboard
          </div>
        </div>

        <div className="p-5 bg-cream space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-body text-mauve">Bom dia 👋</p>
              <p className="text-base font-display font-semibold text-onyx">Check-up Anual 2024</p>
            </div>
            <span className="font-body text-[11px] text-sage bg-sage-light px-2.5 py-1 rounded-full border border-sage/20 font-medium">
              Dados extraídos
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Biomarcadores', value: '24',  color: '#C2849A', bg: '#F8EDF2' },
              { label: 'Dentro ref.',   value: '18',  color: '#7DAF9E', bg: '#EBF5F1' },
              { label: 'Fora ref.',     value: '6',   color: '#A89CBD', bg: '#F0EBF7' },
            ].map(m => (
              <div key={m.label} className="rounded-xl py-2.5 px-2 text-center border border-border/50"
                style={{ backgroundColor: m.bg }}>
                <p className="text-base font-display font-semibold" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[11px] font-body text-mauve leading-tight">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Biomarker list */}
          <div className="bg-white rounded-2xl border border-border/60 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
              <p className="text-[11px] font-body font-semibold text-onyx/60 uppercase tracking-wider">Biomarcadores</p>
              <p className="text-[11px] font-body text-mauve">5 de 24</p>
            </div>
            {biomarkers.map((b, i) => (
              <div key={b.name} className={`flex items-center gap-2 px-3 py-2 ${i < biomarkers.length - 1 ? 'border-b border-border/30' : ''}`}>
                <span className="font-body text-xs text-onyx font-medium flex-1">{b.name}</span>
                <span className="font-body text-xs text-onyx">{b.value}</span>
                <span className="font-body text-[11px] text-mauve w-10">{b.unit}</span>
                <span className={`font-body text-xs font-semibold w-4 text-right ${b.color}`}>{b.indicator}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating card — histórico */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-10 top-1/4 glass rounded-2xl p-3 shadow-xl w-44">
        <p className="text-[11px] font-body font-semibold text-onyx mb-2">Vitamina D — histórico</p>
        <div className="flex items-end gap-1 h-8">
          {[32, 28, 22, 18].map((v, i) => (
            <div key={i} className="flex-1 rounded-sm"
              style={{ height: `${(v / 36) * 100}%`, backgroundColor: i === 3 ? '#A89CBD' : '#E2D9EE' }} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] font-body text-mauve">2021</span>
          <span className="text-[9px] font-body text-blue-600 font-medium">2024: 18</span>
        </div>
      </motion.div>

      {/* Floating card — upload */}
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-8 bottom-16 glass rounded-2xl p-3 shadow-xl w-40">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-lg gradient-sintera flex items-center justify-center flex-shrink-0">
            <Upload size={10} className="text-white" />
          </div>
          <span className="text-[11px] font-body font-semibold text-onyx">PDF processado</span>
        </div>
        <p className="text-[11px] font-body text-mauve leading-snug">24 biomarcadores extraídos automaticamente</p>
        <div className="mt-2 h-1 bg-ivory rounded-full overflow-hidden">
          <div className="w-full h-full rounded-full gradient-sintera" />
        </div>
      </motion.div>
    </div>
  )
}
