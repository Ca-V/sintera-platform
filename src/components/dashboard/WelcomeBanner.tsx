'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function WelcomeBanner() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-petal-light via-blush to-lavender-light p-6 border border-petal-light/60"
    >
      {/* Background decoration */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/30 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-lavender-light/50 blur-xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-petal" />
            <span className="text-xs font-body text-petal-dark font-medium uppercase tracking-wider">
              Insight do dia
            </span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-onyx mb-2">
            {greeting}, Sofia ✨
          </h2>
          <p className="font-body text-sm text-onyx/70 max-w-sm leading-relaxed">
            Você está no <strong className="text-petal-dark">Dia 8 da Fase Folicular</strong>.
            Estrogênio em alta — ótimo para criatividade, socialização e treinos intensos.
          </p>
          <Link
            href="/dashboard/ciclo"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-body font-medium text-petal-dark hover:gap-2.5 transition-all duration-200"
          >
            Ver detalhes da fase
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mini cycle ring */}
        <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#E8E0E5" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="22"
                fill="none"
                stroke="#C9899E"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 22 * 0.28} ${2 * Math.PI * 22}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-display font-semibold text-petal-dark">
              8
            </span>
          </div>
          <span className="text-[11px] font-body text-mauve">dia do ciclo</span>
        </div>
      </div>
    </motion.div>
  )
}
