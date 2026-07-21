'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) { setError('Digite um e-mail válido.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })
    if (error) {
      console.error('[recuperar-senha] resetPasswordForEmail:', error.status, error.message)
      const isRate = error.status === 429 || /rate|limit|seconds|too many/i.test(error.message ?? '')
      setError(
        isRate
          ? 'Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente.'
          : 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.',
      )
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md">

        <Link href="/login"
          className="inline-flex items-center gap-2 text-sm font-body text-mauve hover:text-petal transition-colors mb-8">
          <ArrowLeft size={16} /> Voltar ao login
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
              <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-display text-xl font-semibold tracking-[0.18em] text-onyx">SINTERA</span>
        </div>

        {sent ? (
          <div className="ds-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-blush flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-petal" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-onyx mb-2">E-mail enviado</h1>
            <p className="font-body text-sm text-mauve leading-relaxed mb-6">
              Enviamos um link para <strong className="text-onyx">{email}</strong>.
              Verifique sua caixa de entrada e spam.
            </p>
            <p className="font-body text-xs text-mauve">
              O link expira em 1 hora.
            </p>
          </div>
        ) : (
          <div className="ds-card p-8">
            <h1 className="font-display text-2xl font-semibold text-onyx mb-2">Recuperar senha</h1>
            <p className="font-body text-sm text-mauve mb-6 leading-relaxed">
              Digite o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <p className="font-body text-xs text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="recuperar-email" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve" />
                  <input
                    id="recuperar-email"
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" required autoFocus
                    className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-3 text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || !email}
                className="w-full gradient-sintera text-white font-body font-medium py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-md flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando…</>
                  : 'Enviar link de recuperação'
                }
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  )
}
