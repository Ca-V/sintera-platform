'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, FlaskConical, TrendingUp, Shield } from 'lucide-react'

export default function ListaDeEsperaPage() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [state, setState]     = useState<'idle' | 'success' | 'already' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    try {
      const res  = await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email }),
      })
      const json = await res.json() as { ok?: boolean; already?: boolean; error?: string }
      if (!res.ok) throw new Error(json.error)
      setState(json.already ? 'already' : 'success')
    } catch {
      setState('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">

      {/* Header */}
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full gradient-sintera flex items-center justify-center shadow-sm">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.2" fill="none"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
              <path d="M8 2.5 A5.5 5.5 0 0 1 13.5 8" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-display text-lg font-semibold tracking-[0.18em] text-onyx">SINTERA</span>
        </Link>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blush border border-petal-light text-xs font-body font-medium text-petal-dark uppercase tracking-wider mb-5">
              Beta fechado · Vagas limitadas
            </span>
            <h1 className="font-display text-3xl font-semibold text-onyx leading-tight mb-3">
              Entre para a lista de espera
            </h1>
            <p className="font-body text-sm text-mauve leading-relaxed">
              A SINTERA está em Beta fechado com um grupo seleto.
              Deixe seu nome e e-mail — avisamos assim que houver uma vaga.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {state === 'idle' && (
              <motion.form key="form" onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="card-premium p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="font-body text-xs font-medium text-onyx/60">Nome</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu primeiro nome"
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/20 focus:border-petal/40 transition-all bg-ivory"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-body text-xs font-medium text-onyx/60">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/20 focus:border-petal/40 transition-all bg-ivory"
                  />
                </div>
                <button type="submit" disabled={loading || !name.trim() || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 gradient-sintera text-white font-body font-medium py-3.5 rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Quero uma vaga <ArrowRight size={15} /></>
                  )}
                </button>
                <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
                  Seus dados são tratados conforme nossa{' '}
                  <Link href="/privacidade" className="underline hover:text-petal transition-colors">Política de Privacidade</Link>
                  {' '}e a LGPD. Você pode pedir a exclusão a qualquer momento.
                </p>
              </motion.form>
            )}

            {(state === 'success' || state === 'already') && (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="card-premium p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto">
                  <Check size={24} className="text-sage" />
                </div>
                <h2 className="font-display text-xl font-semibold text-onyx">
                  {state === 'already' ? 'Você já está na lista!' : 'Você está na lista!'}
                </h2>
                <p className="font-body text-sm text-mauve leading-relaxed">
                  {state === 'already'
                    ? 'Seu e-mail já estava cadastrado. Avisaremos assim que houver uma vaga disponível.'
                    : 'Avisaremos assim que houver uma vaga disponível. Fique de olho no seu e-mail.'
                  }
                </p>
                <Link href="/" className="inline-block font-body text-sm text-petal hover:underline transition-colors">
                  Voltar para o início
                </Link>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="card-premium p-6 text-center space-y-4">
                <p className="font-body text-sm text-red-500">Algo deu errado. Tente novamente.</p>
                <button onClick={() => setState('idle')}
                  className="font-body text-sm text-petal hover:underline">
                  Tentar novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features resumidas */}
          {state === 'idle' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: FlaskConical, label: 'Extração automática de biomarcadores' },
                { icon: TrendingUp,   label: 'Histórico longitudinal dos resultados' },
                { icon: Shield,       label: 'LGPD compliant · 100% privado' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center mx-auto">
                    <Icon size={15} className="text-petal" />
                  </div>
                  <p className="font-body text-[11px] text-mauve/70 leading-tight">{label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
