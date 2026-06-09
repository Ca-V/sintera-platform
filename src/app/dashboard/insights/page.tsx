'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, FlaskConical, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function InsightsPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Insights</h1>
        <p className="font-body text-sm text-mauve">Análise inteligente dos seus dados de saúde</p>
      </motion.div>

      {/* Estado futuro — Em desenvolvimento */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="card-premium p-10 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-5">
          <Sparkles size={28} className="text-petal" />
        </div>
        <h2 className="font-display text-xl font-semibold text-onyx mb-2">
          Em desenvolvimento
        </h2>
        <p className="font-body text-sm text-mauve max-w-sm mx-auto leading-relaxed mb-2">
          A página de Insights está sendo preparada para exibir análises baseadas nos seus
          biomarcadores reais — sem diagnóstico, sem interpretação clínica.
        </p>
        <p className="font-body text-xs text-mauve/60 max-w-xs mx-auto leading-relaxed">
          Enquanto isso, explore o histórico longitudinal dos seus biomarcadores
          e a evolução dos seus exames ao longo do tempo.
        </p>
      </motion.div>

      {/* Atalhos para o que já existe */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => router.push('/dashboard/historico')}
          className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-2xl bg-sage-light flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <TrendingUp size={18} className="text-sage" />
          </div>
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-onyx">Histórico de biomarcadores</p>
            <p className="font-body text-xs text-mauve mt-0.5">Evolução temporal dos seus resultados</p>
          </div>
          <ArrowRight size={14} className="text-mauve/40 group-hover:text-sage transition-colors flex-shrink-0" />
        </button>

        <button onClick={() => router.push('/dashboard/exams')}
          className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <FlaskConical size={18} className="text-petal" />
          </div>
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-onyx">Meus exames</p>
            <p className="font-body text-xs text-mauve mt-0.5">Todos os laudos analisados pela IA</p>
          </div>
          <ArrowRight size={14} className="text-mauve/40 group-hover:text-petal transition-colors flex-shrink-0" />
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="font-body text-xs font-semibold text-amber-800 mb-1">Por que ainda não há insights?</p>
        <p className="font-body text-xs text-amber-700 leading-relaxed">
          Insights automáticos baseados em biomarcadores exigem análise cuidadosa para não cruzar
          a linha entre organização de dados e interpretação clínica. Estamos desenvolvendo essa
          funcionalidade com rigor regulatório (RDC 657/2022).
        </p>
      </motion.div>
    </div>
  )
}
