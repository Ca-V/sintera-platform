'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AtualizarSenhaPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Supabase inserts the session automatically when the user lands here via the reset link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session is ready — user can now set a new password
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Não foi possível atualizar a senha. O link pode ter expirado.')
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 gradient-subtle">
      <div className="w-full max-w-md">
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-green-500"/>
            </div>
            <h1 className="font-display text-2xl font-semibold text-onyx">Senha atualizada</h1>
            <p className="font-body text-sm text-mauve">Redirecionando para o dashboard…</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold text-onyx mb-1">Nova senha</h1>
              <p className="font-body text-mauve text-sm">Escolha uma senha com pelo menos 6 caracteres.</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-5">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0"/>
                <p className="text-sm font-body text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-onyx/80 font-body">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-border bg-white pl-4 pr-10 py-3 text-sm font-body text-onyx placeholder:text-mauve/50 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mauve hover:text-petal transition-colors">
                    {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-onyx/80 font-body">Confirmar nova senha</label>
                <input
                  type="password" required
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full rounded-xl border border-border bg-white pl-4 pr-4 py-3 text-sm font-body text-onyx placeholder:text-mauve/50 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                />
              </div>

              <button type="submit" disabled={loading || !password || !confirm}
                className="w-full gradient-sintera text-white font-body font-medium py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md shadow-petal/20 mt-1">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Salvando…</> : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}