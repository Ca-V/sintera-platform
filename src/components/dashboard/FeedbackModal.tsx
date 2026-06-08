'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle } from 'lucide-react'

interface FeedbackModalProps {
  triggerAfterAnalyses: number
}

export default function FeedbackModal({ triggerAfterAnalyses }: FeedbackModalProps) {
  const [show, setShow]             = useState(false)
  const [accuracy, setAccuracy]     = useState<string | null>(null)
  const [mostUseful, setMostUseful] = useState<string | null>(null)
  const [submitted, setSubmitted]   = useState(false)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    fetch('/api/feedback')
      .then(r => r.json())
      .then(data => {
        if (data.submitted) return
        const count = parseInt(localStorage.getItem('sintera_analyses_count') ?? '0')
        if (count >= triggerAfterAnalyses) {
          setTimeout(() => setShow(true), 3000)
        }
      })
      .catch(() => {})
  }, [triggerAfterAnalyses])

  const handleSubmit = async () => {
    if (!accuracy || !mostUseful) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accuracy, most_useful: mostUseful }),
      })
      setSubmitted(true)
      setTimeout(() => setShow(false), 2000)
    } catch {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-border p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full gradient-sintera flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={14} className="text-white" />
                </div>
                <p className="font-body text-sm font-semibold text-onyx">Feedback rapido</p>
              </div>
              <button onClick={() => setShow(false)} className="text-mauve hover:text-onyx transition-colors">
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-3">
                <p className="font-body text-sm text-sage font-medium">Obrigada pelo feedback!</p>
                <p className="font-body text-xs text-mauve mt-1">Isso nos ajuda a melhorar a SINTERA.</p>
              </div>
            ) : (
              <>
                {/* Pergunta 1 — alinhada com a missao: mede compreensao, nao interpretacao */}
                <div className="space-y-2">
                  <p className="font-body text-xs font-semibold text-onyx">
                    Depois de usar a SINTERA, voce entende melhor este exame do que entendia antes?
                  </p>
                  <div className="flex gap-2">
                    {[
                      { value: 'sim',          label: 'Sim' },
                      { value: 'parcialmente', label: 'Parcialmente' },
                      { value: 'nao',          label: 'Nao' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setAccuracy(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${
                          accuracy === opt.value
                            ? 'gradient-sintera text-white border-transparent shadow-sm'
                            : 'border-border text-mauve hover:border-petal/40'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pergunta 2 */}
                <div className="space-y-2">
                  <p className="font-body text-xs font-semibold text-onyx">
                    O que foi mais util?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'historico',   label: 'Historico' },
                      { value: 'organizacao', label: 'Organizacao' },
                      { value: 'indice',      label: 'Indice' },
                      { value: 'outro',       label: 'Outro' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setMostUseful(opt.value)}
                        className={`py-2 rounded-xl text-xs font-body font-medium border transition-all ${
                          mostUseful === opt.value
                            ? 'gradient-sintera text-white border-transparent shadow-sm'
                            : 'border-border text-mauve hover:border-petal/40'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!accuracy || !mostUseful || loading}
                  className="w-full py-2.5 rounded-xl gradient-sintera text-white text-xs font-body font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-sm">
                  {loading ? 'Enviando...' : 'Enviar feedback'}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
