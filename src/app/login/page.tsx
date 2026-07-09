'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // Stable client — not recreated on every render
  const supabase = useRef(createClient()).current

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message
      )
      setLoading(false)
    } else {
      // Hard redirect — ensures cookies are included in the next server request
      // so the proxy sees the session and doesn't redirect back to /login
      window.location.href = '/dashboard'
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex gradient-subtle">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-petal to-lavender items-center justify-center p-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative text-white text-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
              <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="font-display text-4xl font-semibold tracking-[0.25em] mb-6">SINTERA</p>
          <p className="font-display text-2xl font-light leading-snug mb-4 italic">
            &ldquo;Seus exames têm<br/>uma história.<br/>Aprenda a lê-la.&rdquo;
          </p>
          <p className="font-body text-white/60 text-sm">Organize seus laudos com inteligência artificial</p>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-body text-mauve hover:text-petal transition-colors mb-8">
            <ArrowLeft size={16}/>
            Voltar ao início
          </Link>

          <div className="mb-8">
            <p className="font-display text-3xl font-semibold text-onyx mb-1">Bem-vinda de volta</p>
            <p className="font-body text-mauve text-sm">
              Não tem conta?{' '}
              <Link href="/onboarding" className="text-petal hover:underline font-medium">
                Criar gratuitamente
              </Link>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-5">
              <AlertCircle size={15} className="text-red-400 flex-shrink-0"/>
              <p className="text-sm font-body text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-onyx/80 font-body">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve"/>
                <input
                  id="login-email"
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="sofia@exemplo.com"
                  className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-3 text-sm font-body text-onyx placeholder:text-mauve/50 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-onyx/80 font-body">Senha</label>
                <Link href="/recuperar-senha" className="text-xs font-body text-petal hover:underline">Esqueci minha senha</Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve"/>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-white pl-9 pr-10 py-3 text-sm font-body text-onyx placeholder:text-mauve/50 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mauve hover:text-petal transition-colors">
                  {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full gradient-sintera text-white font-body font-medium py-3.5 rounded-full hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1 shadow-md shadow-petal/20">
              {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Entrando…</> : 'Entrar'}
            </button>

            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-border"/>
              <span className="text-xs font-body text-mauve">ou</span>
              <div className="flex-1 h-px bg-border"/>
            </div>

            <button type="button" onClick={handleGoogle}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 border border-border rounded-xl text-sm font-body text-onyx/70 hover:bg-ivory hover:border-petal/30 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
