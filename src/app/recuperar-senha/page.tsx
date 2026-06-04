'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })

    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 gradient-subtle">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-body text-mauve hover:text-petal transition-colors mb-8">
          <ArrowLeft size={16}/>
          Voltar ao login
        </Link>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-green-500"/>
            </div>
            <h1 className="font-display text-2xl font-semibold text-onyx">E-mail enviado</h1>
            <p className="font-body text-sm text-mauve leading-relaxed">
              Se esse endereço está cadastrado, você receberá um link para redefinir sua senha em instantes.
              Verifique também a pasta de spam.
            </p>
            <Link href="/login" className="inline-block mt-4 text-sm font-body text-petal hover:underline">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold text-onyx mb-1">Recuperar senha</h1>
              <p className="font-body text-mauve text-sm">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 mb-5">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0"/>
                <p className="text-sm font-body text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-onyx/80 font-body">E-mail</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve"/>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="sofia@exemplo.com"
                    className="w-full rounded-xl border border-border bg-white pl-9 pr-4 py-3 text-sm font-body text-onyx placeholder:text-mauve/50 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !email}
                className="w-full gradient-sintera text-white font-body font-medium py-3.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md shadow-petal/20">
                {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Enviando…</> : 'Enviar link de recuperação'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}