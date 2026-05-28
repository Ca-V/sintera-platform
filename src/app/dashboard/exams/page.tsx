'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react'

const mockExams = [
  { id: '1', name: 'Hemograma Completo', date: '15 Mai 2025', status: 'processed', biomarkers: 12 },
  { id: '2', name: 'Perfil Hormonal',     date: '02 Abr 2025', status: 'processed', biomarkers: 8  },
  { id: '3', name: 'Tireoide (TSH, T3, T4)', date: '18 Mar 2025', status: 'processed', biomarkers: 3  },
]

const statusConfig = {
  processed: { label: 'Analisado',      color: 'text-sage',    bg: 'bg-sage-light',     icon: CheckCircle },
  pending:   { label: 'Processando',    color: 'text-gold',    bg: 'bg-warm',           icon: Clock },
  error:     { label: 'Erro',           color: 'text-red-400', bg: 'bg-red-50',         icon: AlertCircle },
}

export default function ExamsPage() {
  const [dragging, setDragging] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Exames</h1>
        <p className="font-body text-sm text-mauve">Faça upload dos seus exames e a IA irá interpretar automaticamente</p>
      </motion.div>

      {/* Upload area */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false) }}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
          ${dragging ? 'border-petal bg-blush' : 'border-border hover:border-petal/50 hover:bg-blush/30'}`}
      >
        <div className="w-14 h-14 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-4">
          <Upload size={24} className="text-petal" />
        </div>
        <p className="font-display text-lg font-semibold text-onyx mb-1">Arraste seu exame aqui</p>
        <p className="font-body text-sm text-mauve mb-4">ou clique para selecionar um arquivo</p>
        <p className="text-xs font-body text-mauve/60">PDF, JPG ou PNG · Até 10MB</p>
        <button className="mt-5 inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
          <Plus size={15} /> Selecionar arquivo
        </button>
      </motion.div>

      {/* Exam list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest">Histórico</h2>
          <span className="text-xs font-body text-mauve">{mockExams.length} exames</span>
        </div>

        {mockExams.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <FileText size={36} className="text-border mx-auto mb-3" />
            <p className="font-body text-sm text-mauve">Nenhum exame ainda</p>
            <p className="font-body text-xs text-mauve/60 mt-1">Faça upload do primeiro exame acima</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mockExams.map((exam, i) => {
              const s = statusConfig[exam.status as keyof typeof statusConfig]
              const Icon = s.icon
              return (
                <motion.div key={exam.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="card-premium p-5 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-petal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-onyx group-hover:text-petal transition-colors truncate">
                      {exam.name}
                    </p>
                    <p className="font-body text-xs text-mauve">{exam.date} · {exam.biomarkers} biomarcadores</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1 rounded-full ${s.bg} ${s.color}`}>
                    <Icon size={11} /> {s.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="card-dark p-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-petal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">🧬</span>
        </div>
        <div>
          <p className="font-body text-sm font-semibold text-white mb-1">IA de Interpretação — Em breve</p>
          <p className="font-body text-xs text-white/50 leading-relaxed">
            Nossa IA irá extrair automaticamente os biomarcadores dos seus exames via OCR, interpretar os
            valores com base em faixas de referência e gerar insights preventivos personalizados.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
