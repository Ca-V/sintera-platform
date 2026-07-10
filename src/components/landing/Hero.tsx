'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, FileText, Pill, Syringe, Bell, Check } from 'lucide-react'

function fadeUp(delay = 0) {
  return {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: 'easeOut' as const } },
  }
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden gradient-hero">
      {/* Decorative rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ border: '1px solid rgba(87,179,173,0.16)' }} />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 right-[-6%] -translate-y-1/2 w-[540px] h-[540px] rounded-full"
          style={{ border: '1.5px dashed rgba(14,110,100,0.13)' }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-petal-light/20 blur-3xl animate-breathe" />
        <div className="absolute -bottom-48 left-[20%] w-[500px] h-[500px] rounded-full bg-lavender-light/25 blur-3xl animate-breathe delay-300" />
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex items-center">
        <div className="max-w-6xl mx-auto w-full px-6 pt-28 pb-16 grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Left — copy */}
          <div className="flex flex-col">
            <motion.h1 variants={fadeUp(0.15)} initial="hidden" animate="show"
              className="font-display font-semibold leading-[1.1] text-onyx mb-6"
              style={{ fontSize: 'clamp(2rem, 3.8vw, 3rem)' }}>
              Comece hoje a construir uma história de saúde organizada — e compreenda melhor a{' '}
              <span className="text-gradient italic">evolução do seu cuidado ao longo da vida.</span>
            </motion.h1>

            {/* Frase de impacto — acento coral */}
            <motion.p variants={fadeUp(0.36)} initial="hidden" animate="show"
              className="font-display italic text-onyx leading-snug mb-8 pl-4 border-l-2 border-lavender"
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
    </section>
  )
}

function ProductPreview() {
  const records = [
    { icon: Calendar, title: 'Consulta — Cardiologista', date: '12 mar', color: 'text-petal',    bg: 'bg-blush' },
    { icon: FileText, title: 'Exame — Hemograma',        date: '3 fev',  color: 'text-sage',     bg: 'bg-sage-light' },
    { icon: Pill,     title: 'Receita — Losartana',      date: '20 jan', color: 'text-lavender', bg: 'bg-lavender-light' },
    { icon: Syringe,  title: 'Vacina — Influenza',       date: '5 jan',  color: 'text-gold',     bg: 'bg-warm' },
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
            sintera.app/minha-saude
          </div>
        </div>

        <div className="p-5 bg-cream space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-body text-mauve">Bom dia 👋</p>
              <p className="text-base font-display font-semibold text-onyx">Minha saúde</p>
            </div>
            <span className="font-body text-[11px] text-petal bg-blush px-2.5 py-1 rounded-full border border-petal-light font-medium">
              Tudo organizado
            </span>
          </div>

          {/* Linha do tempo — documentos organizados */}
          <div className="bg-white rounded-2xl border border-border/60 overflow-hidden">
            <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
              <p className="text-[11px] font-body font-semibold text-mauve uppercase tracking-wider">Sua linha do tempo</p>
              <p className="text-[11px] font-body text-mauve">4 anos organizados</p>
            </div>
            {records.map((r, i) => {
              const Icon = r.icon
              return (
                <div key={r.title} className={`flex items-center gap-3 px-3 py-2.5 ${i < records.length - 1 ? 'border-b border-border/30' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg ${r.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={13} className={r.color} />
                  </div>
                  <span className="font-body text-xs text-onyx font-medium flex-1 leading-snug">{r.title}</span>
                  <span className="font-body text-[11px] text-mauve whitespace-nowrap">{r.date}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Floating card — lembrete de consulta (agenda) */}
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-10 top-1/4 glass rounded-2xl p-3 shadow-xl w-52">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-lg gradient-sintera flex items-center justify-center flex-shrink-0">
            <Bell size={10} className="text-white" />
          </div>
          <span className="text-[11px] font-body font-semibold text-onyx">Consulta amanhã · 14h</span>
        </div>
        <p className="text-[11px] font-body text-sage font-medium flex items-center gap-1">
          <Check size={11} /> Lembrete enviado por WhatsApp
        </p>
      </motion.div>

      {/* Floating card — lembrete de medicação */}
      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-8 bottom-16 glass rounded-2xl p-3 shadow-xl w-44">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 rounded-lg bg-lavender-light flex items-center justify-center flex-shrink-0">
            <Pill size={10} className="text-lavender" />
          </div>
          <span className="text-[11px] font-body font-semibold text-onyx">Losartana</span>
        </div>
        <p className="text-[11px] font-body text-mauve leading-snug">Hora de repor — lembrete por e-mail</p>
      </motion.div>
    </div>
  )
}
