'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AtualizarSenhaPage() {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState('')
  const [sessionReady, setSession]    = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  // Supabase envia o token via hash na URL — precisa ser processado
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSession(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6)  { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.')
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md">

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

        {done ? (
          <div className="card-premium p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-sage" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-onyx mb-2">Senha atualizada</h1>
            <p className="font-body text-sm text-mauve">Redirecionando para o dashboard…</p>
          </div>
        ) : (
          <div className="card-premium p-8">
            <h1 className="font-display text-2xl font-semibold text-onyx mb-2">Nova senha</h1>
            <p className="font-body text-sm text-mauve mb-6">Digite e confirme sua nova senha.</p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="font-body text-xs text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" required autoFocus
                    className="w-full rounded-xl border border-border bg-white px-4 pr-10 py-3 text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mauve hover:text-petal transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Confirmar nova senha</label>
                <input
                  type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha" required
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                />
              </div>

              <button type="submit" disabled={loading || !password || !confirm}
                className="w-full gradient-sintera text-white font-body font-medium py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-md flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando…</>
                  : 'Salvar nova senha'
                }
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  )
}
