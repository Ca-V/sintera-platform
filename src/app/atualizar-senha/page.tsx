'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AtualizarSenhaPage() {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState('')
  const [canReset, setCanReset]       = useState(false)
  const [checking, setChecking]       = useState(true)
  const router  = useRouter()
  const supabase = createClient()

  // O link de recuperação chega com o token na URL (code/hash). O client
  // (detectSessionInUrl) cria a sessão de recovery; aqui só confirmamos que ela
  // existe para liberar o formulário — senão mostramos "link inválido/expirado".
  useEffect(() => {
    let active = true

    // Erro vindo do Supabase na própria URL (ex.: link expirado).
    const params = new URLSearchParams(
      window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.search,
    )
    if (params.get('error') || params.get('error_description')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- valida o link de recuperação na montagem
      setError('O link de recuperação é inválido ou expirou. Solicite um novo.')
      setChecking(false)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setCanReset(true); setChecking(false)
      }
    })

    // Checagem inicial (caso a sessão já tenha sido estabelecida antes do listener).
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) { setCanReset(true); setChecking(false) }
    })

    // Se em alguns segundos não houver sessão de recovery, o link não é válido.
    const t = setTimeout(() => {
      if (active && !canReset) setChecking(false)
    }, 4000)

    return () => { active = false; subscription.unsubscribe(); clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="w-14 h-14 rounded-full bg-blush flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-petal" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-onyx mb-2">Senha atualizada</h1>
            <p className="font-body text-sm text-mauve">Redirecionando para o dashboard…</p>
          </div>
        ) : checking ? (
          <div className="card-premium p-8 text-center">
            <span className="inline-block w-6 h-6 border-2 border-petal border-t-transparent rounded-full animate-spin mb-3" />
            <p className="font-body text-sm text-mauve">Verificando o link de recuperação…</p>
          </div>
        ) : !canReset ? (
          <div className="card-premium p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-onyx mb-2">Link inválido ou expirado</h1>
            <p className="font-body text-sm text-mauve leading-relaxed mb-6">
              {error || 'Este link de recuperação não é mais válido. Solicite um novo para redefinir sua senha.'}
            </p>
            <Link href="/recuperar-senha"
              className="inline-block gradient-sintera text-white font-body font-medium px-6 py-3 rounded-full hover:opacity-90 transition-opacity">
              Solicitar novo link
            </Link>
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
                <label htmlFor="nova-senha" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Nova senha</label>
                <div className="relative">
                  <input
                    id="nova-senha"
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
                <label htmlFor="confirmar-nova-senha" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Confirmar nova senha</label>
                <input
                  id="confirmar-nova-senha"
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
