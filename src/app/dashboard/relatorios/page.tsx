'use client'

import { motion } from 'framer-motion'
import { BarChart3, FileText, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RelatoriosPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Relatórios</h1>
        <p className="font-body text-sm text-mauve">Resumos consolidados dos seus dados de saúde</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="card-premium p-10 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-5">
          <BarChart3 size={28} className="text-petal" />
        </div>
        <h2 className="font-display text-xl font-semibold text-onyx mb-2">Em desenvolvimento</h2>
        <p className="font-body text-sm text-mauve max-w-sm mx-auto leading-relaxed">
          Os relatórios consolidados — resumos periódicos dos seus biomarcadores, evolução
          e exportações completas — estão sendo preparados para o próximo ciclo de desenvolvimento.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => router.push('/dashboard/exams')}
          className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <FileText size={18} className="text-petal" />
          </div>
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-onyx">Exportar exame individual</p>
            <p className="font-body text-xs text-mauve mt-0.5">CSV ou PDF por exame</p>
          </div>
          <ArrowRight size={14} className="text-mauve/40 group-hover:text-petal transition-colors flex-shrink-0" />
        </button>

        <button onClick={() => router.push('/dashboard/historico')}
          className="card-premium p-5 text-left flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-2xl bg-sage-light flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <BarChart3 size={18} className="text-sage" />
          </div>
          <div className="flex-1">
            <p className="font-body text-sm font-semibold text-onyx">Histórico de biomarcadores</p>
            <p className="font-body text-xs text-mauve mt-0.5">Evolução longitudinal dos resultados</p>
          </div>
          <ArrowRight size={14} className="text-mauve/40 group-hover:text-sage transition-colors flex-shrink-0" />
        </button>
      </motion.div>
    </div>
  )
}
