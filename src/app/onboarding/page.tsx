'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, Upload, TrendingUp, FlaskConical, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Direction = 1 | -1

const TOTAL_STEPS = 3

const stepMeta = [
  { label: 'Boas-vindas', sublabel: 'Quem é você'       },
  { label: 'Como funciona', sublabel: 'O que a SINTERA faz' },
  { label: 'Sua conta',   sublabel: 'Começar agora'     },
]

const leftPanels = [
  {
    bg:          'linear-gradient(150deg, #9BD8E0 0%, #6FC1CF 58%, #57B0BF 100%)',
    accentGlow:  'rgba(246,242,234,0.45)',
    accent2:     'rgba(167,185,140,0.30)',
  },
  {
    bg:          'linear-gradient(150deg, #A6DCE3 0%, #72C3D0 58%, #5AB2C0 100%)',
    accentGlow:  'rgba(167,185,140,0.40)',
    accent2:     'rgba(107,192,206,0.30)',
  },
  {
    bg:          'linear-gradient(150deg, #9BD8E0 0%, #6FC1CF 58%, #57B0BF 100%)',
    accentGlow:  'rgba(193,131,106,0.32)',
    accent2:     'rgba(246,242,234,0.40)',
  },
]

const quotes = [
  {
    headline: 'Sua saúde tem uma história.',
    emphasis: 'A SINTERA te ajuda a organizá-la e compreendê-la melhor.',
    sub: 'Cada laudo é um capítulo da sua saúde.',
  },
  {
    headline: 'PDF para biomarcadores em segundos.',
    emphasis: 'IA que organiza, não que interpreta.',
    sub: 'Você permanece no controle das decisões.',
  },
  {
    headline: '',
    emphasis: 'Sua jornada começa agora.',
    sub: 'Envie o primeiro exame e veja a mágica acontecer.',
  },
]

export default function OnboardingPage() {
  const [step, setStep]           = useState(0)
  const [dir, setDir]             = useState<Direction>(1)
  const [name, setName]           = useState('')
  const [examFreq, setExamFreq]   = useState('')   // segmentação P2
  const [tracksMedic, setTracksMedic] = useState('') // segmentação P2
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPassword, setShowPw] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading]     = useState(false)
  const supabase = createClient()

  const next = () => { setDir(1);  setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)) }
  const prev = () => { setDir(-1); setStep(s => Math.max(s - 1, 0)) }

  const canContinue =
    step === 0 ? name.trim().length > 1 :
    step === 1 ? true :
    email.includes('@') && password.length >= 6

  const finish = async () => {
    setAuthError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setAuthError(error.message === 'User already registered' ? 'Este e-mail já está cadastrado.' : error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('profiles').upsert({ id: data.user.id, name })
      // Registro de consentimento (LGPD) — termos + dados de saúde. Best-effort:
      // não bloqueia a criação de conta se falhar.
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ types: ['terms', 'health_data'] }),
      }).catch(() => {})
      // Segmentação P2 — salva como evento de perfil
      if (examFreq || tracksMedic) {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_name: 'perfil_segmentacao',
            metadata: { exam_frequency: examFreq || null, tracks_with_doctor: tracksMedic || null },
          }),
        }).catch(() => {})
      }
    }
    window.location.href = '/dashboard'
  }

  const panel = leftPanels[step]
  const quote = quotes[step]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: '#0F0B14' }}>

      {/* ── Painel esquerdo ── */}
      <motion.div className="relative lg:sticky lg:top-0 lg:h-screen lg:w-[45%] flex-shrink-0 overflow-hidden"
        style={{ minHeight: '240px' }}>

        <AnimatePresence>
          <motion.div key={step} className="absolute inset-0"
            style={{ background: panel.bg }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }} />
        </AnimatePresence>

        <motion.div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${panel.accentGlow} 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />

        {/* Visual por passo */}
        <AnimatePresence mode="wait">
          <motion.div key={`visual-${step}`} className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>

            {step === 0 && (
              <div className="flex flex-col items-center gap-3">
                {[140, 220, 310].map((size, i) => (
                  <motion.div key={i} className="absolute rounded-full border"
                    style={{ width: size, height: size, borderColor: `rgba(226,140,125,${0.1 - i * 0.025})` }}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 30 + i * 15, repeat: Infinity, ease: 'linear' }} />
                ))}
                <motion.div className="w-20 h-20 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(226,140,125,0.5) 0%, rgba(87,179,173,0.3) 50%, transparent 70%)' }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col items-center gap-5 px-10">
                {[
                  { icon: Upload,       label: 'Upload do laudo em PDF',           color: '#C1836A', delay: 0    },
                  { icon: FlaskConical, label: 'IA extrai os biomarcadores',        color: '#6BC0CE', delay: 0.15 },
                  { icon: TrendingUp,   label: 'Histórico longitudinal organizado', color: '#A7B98C', delay: 0.30 },
                ].map(({ icon: Icon, label, color, delay }, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay + 0.3, duration: 0.5 }}
                    className="flex items-center gap-4 w-full max-w-xs">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}25`, border: `1px solid ${color}40` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <p className="font-body text-sm text-onyx/75">{label}</p>
                    {i < 2 && (
                      <motion.div className="absolute w-0.5 bg-onyx/10 rounded-full"
                        style={{ height: 24, left: 'calc(50% - 28px)', top: `calc(${i * 72 + 68}px)` }} />
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center gap-4 px-8 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full gradient-sintera flex items-center justify-center shadow-lg shadow-petal/25">
                  <span className="text-white font-display text-3xl font-bold">
                    {(name || 'S')[0].toUpperCase()}
                  </span>
                </motion.div>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display text-2xl font-medium text-onyx">
                  {name || 'Você'} está pronta.
                </motion.p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Texto no rodapé do painel */}
        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10"
          style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.42) 0%, transparent 100%)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
              {quote.headline && (
                <p className="font-body text-sm text-onyx/60 mb-1">{quote.headline}</p>
              )}
              <p className="font-display text-xl lg:text-2xl font-medium text-onyx leading-snug mb-2">
                {quote.emphasis}
              </p>
              <p className="font-body text-xs text-onyx/45">{quote.sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Logo */}
        <div className="absolute top-6 left-8">
          <Link href="/" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full gradient-sintera flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.3" fill="none"/>
                <circle cx="8" cy="8" r="2" fill="white"/>
              </svg>
            </div>
            <span className="font-display text-sm font-semibold tracking-[0.2em] text-onyx">SINTERA</span>
          </Link>
        </div>

        {/* Dots de progresso */}
        <div className="absolute top-1/2 right-6 -translate-y-1/2 hidden lg:flex flex-col gap-2">
          {stepMeta.map((s, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? 'w-2 h-2 bg-petal shadow-[0_0_6px_rgba(14,117,128,0.7)]' : i < step ? 'w-1.5 h-1.5 bg-onyx/35' : 'w-1.5 h-1.5 bg-onyx/15'}`}/>
          ))}
        </div>
      </motion.div>

      {/* ── Painel direito ── */}
      <div className="flex-1 bg-cream flex flex-col min-h-screen lg:min-h-0 lg:overflow-y-auto">

        {/* Header de progresso */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 lg:pt-8">
          <div className="flex items-center gap-3">
            {stepMeta.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`rounded-full transition-all duration-300 ${i === step ? 'w-5 h-1.5 bg-petal' : i < step ? 'w-1.5 h-1.5 bg-petal/40' : 'w-1.5 h-1.5 bg-border'}`}/>
                {i === step && (
                  <span className="text-[11px] font-body font-medium text-petal uppercase tracking-wider">{s.label}</span>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs font-body text-mauve">{step + 1}/{TOTAL_STEPS}</span>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 py-4">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir}
              initial={{ opacity: 0, x: dir * 48, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0,      filter: 'blur(0px)' }}
              exit={{ opacity: 0,  x: dir * -48, filter: 'blur(4px)' }}
              transition={{ duration: 0.38, ease: 'easeInOut' }}>

              {/* Passo 0 — Nome */}
              {step === 0 && (
                <div className="flex flex-col gap-6 max-w-md">
                  <div>
                    <p className="text-xs font-body text-mauve uppercase tracking-[0.18em] mb-3">{stepMeta[0].sublabel}</p>
                    <h1 className="font-display text-3xl lg:text-4xl font-semibold text-onyx leading-tight mb-2">
                      Como gostaria<br/>de ser chamada?
                    </h1>
                    <p className="font-body text-mauve text-sm leading-relaxed">
                      Vamos usar seu nome para personalizar sua experiência na plataforma.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="onboarding-name" className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Seu nome</label>
                    <input
                      id="onboarding-name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && canContinue) next() }}
                      placeholder="Como você se chama?"
                      autoFocus
                      className="text-2xl font-display font-medium text-onyx bg-transparent border-0 border-b-2 border-border pb-2 focus:outline-none focus:border-petal transition-colors duration-300 placeholder:text-mauve/30"
                    />
                  </div>

                  {/* Segmentação P2 — frequência de exames */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">
                      Com que frequência você faz exames? <span className="normal-case font-normal text-mauve">(opcional)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: 'anual',      l: 'Uma vez ao ano'     },
                        { v: 'semestral',  l: 'A cada 6 meses'     },
                        { v: 'trimestral', l: 'A cada 3 meses'     },
                        { v: 'frequente',  l: 'Com mais frequência' },
                      ].map(opt => (
                        <button key={opt.v} type="button"
                          onClick={() => setExamFreq(p => p === opt.v ? '' : opt.v)}
                          className={`px-3 py-1.5 rounded-full text-xs font-body transition-all ${
                            examFreq === opt.v
                              ? 'gradient-sintera text-white shadow-sm'
                              : 'bg-white border border-border text-mauve hover:border-petal'
                          }`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Segmentação P2 — acompanha com médico */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">
                      Você costuma discutir seus resultados com um profissional de saúde? <span className="normal-case font-normal text-mauve">(opcional)</span>
                    </label>
                    <div className="flex gap-2">
                      {[
                        { v: 'sim',    l: 'Sim, regularmente' },
                        { v: 'as_vezes', l: 'Às vezes'         },
                        { v: 'nao',    l: 'Raramente'          },
                      ].map(opt => (
                        <button key={opt.v} type="button"
                          onClick={() => setTracksMedic(p => p === opt.v ? '' : opt.v)}
                          className={`flex-1 py-2 rounded-xl text-xs font-body font-medium border transition-all ${
                            tracksMedic === opt.v
                              ? 'gradient-sintera text-white border-transparent shadow-sm'
                              : 'border-border text-mauve hover:border-petal/40'
                          }`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blush border border-petal-light/60">
                    <Lock size={14} className="text-petal flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-body text-petal-dark leading-relaxed">
                      Seus dados são 100% privados, nunca vendidos ou compartilhados.
                      Você pode excluir tudo a qualquer momento.
                    </p>
                  </div>
                </div>
              )}

              {/* Passo 1 — Como funciona */}
              {step === 1 && (
                <div className="flex flex-col gap-6 max-w-md">
                  <div>
                    <p className="text-xs font-body text-mauve uppercase tracking-[0.18em] mb-3">{stepMeta[1].sublabel}</p>
                    <h1 className="font-display text-3xl lg:text-4xl font-semibold text-onyx leading-tight mb-2">
                      {name ? `${name}, veja` : 'Veja'} como a<br/>SINTERA funciona.
                    </h1>
                    <p className="font-body text-mauve text-sm leading-relaxed">
                      Em 3 passos simples, seus laudos se transformam em histórico organizado.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {[
                      {
                        icon: Upload,
                        title: '1. Faça upload do laudo',
                        desc: 'Envie qualquer laudo laboratorial em PDF — de qualquer laboratório.',
                        color: '#C1836A',
                        bg: 'bg-blush',
                      },
                      {
                        icon: FlaskConical,
                        title: '2. A IA extrai os biomarcadores',
                        desc: 'Glicemia, colesterol, vitaminas, hormônios — extraídos automaticamente com os valores e referências do seu laudo.',
                        color: '#6BC0CE',
                        bg: 'bg-lavender-light',
                      },
                      {
                        icon: TrendingUp,
                        title: '3. Acompanhe sua evolução',
                        desc: 'Veja como cada biomarcador mudou ao longo do tempo. Leve essa visão para sua próxima consulta.',
                        color: '#A7B98C',
                        bg: 'bg-sage-light',
                      },
                    ].map(({ icon: Icon, title, desc, color, bg }) => (
                      <div key={title} className={`flex items-start gap-4 p-4 rounded-2xl ${bg}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
                          <Icon size={17} style={{ color }} />
                        </div>
                        <div>
                          <p className="font-body text-sm font-semibold text-onyx">{title}</p>
                          <p className="font-body text-xs text-mauve mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-sm flex-shrink-0">⚠️</span>
                    <p className="text-xs font-body text-amber-800 leading-relaxed">
                      A SINTERA organiza e exibe seus dados. Não oferece diagnóstico, interpretação clínica
                      ou recomendações médicas. As decisões de saúde são sempre suas, em conversa com um profissional de saúde.
                    </p>
                  </div>
                </div>
              )}

              {/* Passo 2 — Criar conta */}
              {step === 2 && (
                <div className="flex flex-col gap-5 max-w-md">
                  <div>
                    <p className="text-xs font-body text-mauve uppercase tracking-[0.18em] mb-3">{stepMeta[2].sublabel}</p>
                    <h1 className="font-display text-3xl lg:text-4xl font-semibold text-onyx leading-tight mb-2">
                      {name ? `${name}, crie` : 'Crie'}<br/>sua conta.
                    </h1>
                    <p className="font-body text-mauve text-sm leading-relaxed">
                      Seus dados ficam seguros e só você tem acesso.
                    </p>
                  </div>

                  {authError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                      <AlertCircle size={13} className="text-red-400 flex-shrink-0"/>
                      <p className="text-xs font-body text-red-600">{authError}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="onboarding-email" className="text-xs font-body font-medium text-mauve uppercase tracking-wider">E-mail</label>
                      <input
                        id="onboarding-email"
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="onboarding-password" className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Senha</label>
                      <div className="relative">
                        <input
                          id="onboarding-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password} onChange={e => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-white text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                        />
                        <button type="button" onClick={() => setShowPw(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-mauve hover:text-petal transition-colors">
                          {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-body text-mauve leading-relaxed">
                    Ao criar sua conta, você concorda com os{' '}
                    <Link href="/termos" target="_blank" className="text-petal hover:underline">Termos de Uso</Link>
                    {' '}e a{' '}
                    <Link href="/privacidade" target="_blank" className="text-petal hover:underline">Política de Privacidade</Link>
                    {' '}da SINTERA.
                  </p>

                  <p className="text-xs font-body text-mauve text-center">
                    Já tem conta?{' '}
                    <Link href="/login" className="text-petal hover:underline font-medium">Entrar</Link>
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegação */}
        <div className="px-8 lg:px-12 pb-8 pt-4 flex items-center justify-between border-t border-border/50">
          <button onClick={prev} disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-body text-mauve hover:text-onyx disabled:opacity-0 disabled:pointer-events-none transition-all duration-200">
            <ArrowLeft size={15}/> Voltar
          </button>

          <div className="flex flex-col items-end gap-1">
            {step < TOTAL_STEPS - 1 ? (
              <motion.button onClick={next} disabled={!canContinue} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 gradient-sintera text-white font-body font-medium px-7 py-3 rounded-full text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-petal/20">
                Continuar <ArrowRight size={15}/>
              </motion.button>
            ) : (
              <motion.button onClick={finish} whileTap={{ scale: 0.97 }}
                disabled={!canContinue || loading}
                className="flex items-center gap-2 gradient-sintera text-white font-body font-medium px-8 py-3.5 rounded-full text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-petal/25">
                {loading ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Criando conta…</>
                ) : (
                  <>Criar conta e começar <ArrowRight size={15}/></>
                )}
              </motion.button>
            )}
            {!canContinue && step === 0 && (
              <p className="text-[11px] font-body text-mauve">Digite seu nome para continuar</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
