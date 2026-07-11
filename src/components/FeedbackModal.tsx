'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle } from 'lucide-react'

// Gatilho: 1 durante o Beta (P2 v1.2 — mudar para 2 após o Beta)
const TRIGGER_AFTER_ANALYSES = 1

export default function FeedbackModal() {
  const [show, setShow]             = useState(false)
  const [comprehension, setCompr]   = useState<string | null>(null)
  const [trust, setTrust]           = useState<string | null>(null)
  const [action, setAction]         = useState<string | null>(null)
  const [openText, setOpenText]     = useState('')
  const [step, setStep]             = useState<1 | 2>(1)
  const [submitted, setSubmitted]   = useState(false)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    fetch('/api/feedback')
      .then(r => r.json())
      .then(data => {
        if (data.submitted) return
        const count = parseInt(localStorage.getItem('sintera_analyses_count') ?? '0')
        if (count >= TRIGGER_AFTER_ANALYSES) {
          setTimeout(() => setShow(true), 3000)
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!comprehension || !trust) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comprehension,
          trust,
          action_taken:  action,
          open_feedback: openText.trim() || null,
        }),
      })
      setSubmitted(true)
      setTimeout(() => setShow(false), 2500)
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

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full gradient-sintera flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={14} className="text-white" />
                </div>
                <p className="font-body text-sm font-semibold text-onyx">Feedback rápido</p>
              </div>
              <button onClick={() => setShow(false)} className="text-mauve hover:text-onyx transition-colors">
                <X size={16} />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-3">
                <p className="font-body text-sm text-petal font-medium">Obrigada pelo feedback! 💚</p>
                <p className="font-body text-xs text-mauve mt-1">
                  Seu feedback é mais valioso do que você imagina.
                </p>
              </div>
            ) : step === 1 ? (
              <>
                {/* Pergunta 1 — Compreensão (métrica norteadora P2) */}
                <div className="space-y-2">
                  <p className="font-body text-xs font-semibold text-onyx">
                    Após ver seus resultados aqui, você entendeu melhor seus exames?
                  </p>
                  <div className="flex gap-2">
                    {[
                      { value: 'sim',          label: 'Sim' },
                      { value: 'parcialmente', label: 'Mais ou menos' },
                      { value: 'nao',          label: 'Não mudou' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setCompr(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${
                          comprehension === opt.value
                            ? 'gradient-sintera text-white border-transparent shadow-sm'
                            : 'border-border text-mauve hover:border-petal/40'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pergunta 2 — Confiança (métrica norteadora P2) */}
                <div className="space-y-2">
                  <p className="font-body text-xs font-semibold text-onyx">
                    Você confia nos dados exibidos pela SINTERA?
                  </p>
                  <div className="flex gap-2">
                    {[
                      { value: 'sim_confio',          label: 'Sim' },
                      { value: 'algumas_duvidas',      label: 'Com dúvidas' },
                      { value: 'nao_tenho_certeza',    label: 'Não sei' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setTrust(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${
                          trust === opt.value
                            ? 'gradient-sintera text-white border-transparent shadow-sm'
                            : 'border-border text-mauve hover:border-petal/40'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!comprehension || !trust}
                  className="w-full py-2.5 rounded-xl gradient-sintera text-white text-xs font-body font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-sm">
                  Continuar
                </button>
              </>
            ) : (
              <>
                {/* Pergunta 3 — Ação gerada (métrica norteadora P2, opcional) */}
                <div className="space-y-2">
                  <p className="font-body text-xs font-semibold text-onyx">
                    Depois de usar a SINTERA, você tomou ou planeja alguma ação de saúde?
                  </p>
                  <p className="font-body text-[11px] text-mauve">Opcional</p>
                  <div className="flex gap-2">
                    {[
                      { value: 'sim',             label: 'Sim' },
                      { value: 'nao',             label: 'Não' },
                      { value: 'ainda_nao_decidi', label: 'Ainda não' },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => setAction(prev => prev === opt.value ? null : opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${
                          action === opt.value
                            ? 'gradient-sintera text-white border-transparent shadow-sm'
                            : 'border-border text-mauve hover:border-petal/40'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo aberto (P2 — captura qualitativa) */}
                <div className="space-y-1.5">
                  <p className="font-body text-xs font-semibold text-onyx">
                    Algo que queira nos contar?
                    <span className="font-normal text-mauve ml-1">Opcional</span>
                  </p>
                  <textarea
                    value={openText}
                    onChange={e => setOpenText(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder="Feedback negativo é tão valioso quanto positivo."
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs font-body text-onyx placeholder:text-mauve/40 resize-none focus:outline-none focus:border-petal/60 transition-colors"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="py-2.5 px-4 rounded-xl border border-border text-mauve text-xs font-body font-medium hover:border-petal/40 transition-colors">
                    Voltar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl gradient-sintera text-white text-xs font-body font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-sm">
                    {loading ? 'Enviando…' : 'Enviar feedback'}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
