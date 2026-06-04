'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

/* ─── Types ─── */
type Direction = 1 | -1
type GoalId = 'cycle' | 'energy' | 'sleep' | 'performance' | 'hormones' | 'mood' | 'fertility' | 'nutrition'

/* ─── Data ─── */
const TOTAL_STEPS = 4

const stepMeta = [
  { label: 'Chegada',      sublabel: 'Quem é você' },
  { label: 'Ciclo',        sublabel: 'Seu ritmo único' },
  { label: 'Visão',        sublabel: 'O que importa' },
  { label: 'Transformação',sublabel: 'Começa agora' },
]

const leftPanels = [
  {
    bg: 'linear-gradient(160deg, #0F0B14 0%, #1C1226 50%, #140E1C 100%)',
    accentGlow: 'rgba(194,132,154,0.18)',
    accent2:    'rgba(168,156,189,0.10)',
  },
  {
    bg: 'linear-gradient(160deg, #0B0F1C 0%, #141A2C 50%, #0E1220 100%)',
    accentGlow: 'rgba(168,156,189,0.18)',
    accent2:    'rgba(125,175,158,0.10)',
  },
  {
    bg: 'linear-gradient(160deg, #130B18 0%, #221028 50%, #18101E 100%)',
    accentGlow: 'rgba(194,132,154,0.22)',
    accent2:    'rgba(201,169,122,0.12)',
  },
  {
    bg: 'linear-gradient(160deg, #180E0A 0%, #261614 50%, #1E1210 100%)',
    accentGlow: 'rgba(201,169,122,0.20)',
    accent2:    'rgba(194,132,154,0.14)',
  },
]

const quotes = [
  {
    headline: 'Você não tem um corpo com um ciclo.',
    emphasis: 'Você é um ser que vive em ciclos.',
    sub: 'E há muito que esse ciclo quer te contar.',
  },
  {
    headline: '28 dias. 4 fases.',
    emphasis: 'Uma mulher diferente em cada uma.',
    sub: 'Não existe ciclo perfeito — existe o seu.',
  },
  {
    headline: 'O que você escolhe agora',
    emphasis: 'molda o que você aprende sobre si mesma.',
    sub: 'Cada insight começa com uma intenção.',
  },
  {
    headline: '',
    emphasis: 'Sua jornada começa agora.',
    sub: 'A versão de você que entende seu corpo está a um passo.',
  },
]

const goals: { id: GoalId; emoji: string; title: string; desc: string; color: string }[] = [
  { id: 'cycle',       emoji: '🌙', title: 'Entender meu ciclo',    desc: 'Prever e viver cada fase com intenção',   color: '#C2849A' },
  { id: 'energy',      emoji: '⚡', title: 'Maximizar energia',     desc: 'Descobrir quando sua vitalidade é pico',  color: '#C9A97A' },
  { id: 'sleep',       emoji: '✨', title: 'Dormir melhor',         desc: 'Sono e hormônios em sintonia',            color: '#A89CBD' },
  { id: 'performance', emoji: '🔥', title: 'Alta performance',      desc: 'Treinos e decisões no momento certo',     color: '#C2849A' },
  { id: 'hormones',    emoji: '🧬', title: 'Equilíbrio hormonal',   desc: 'Entender o impacto de cada hormônio',     color: '#A89CBD' },
  { id: 'mood',        emoji: '🌸', title: 'Saúde emocional',       desc: 'Mapear humor e bem-estar ao longo do mês',color: '#C2849A' },
  { id: 'fertility',   emoji: '🌱', title: 'Planejamento familiar', desc: 'Monitorar fertilidade com precisão',       color: '#7DAF9E' },
  { id: 'nutrition',   emoji: '🥗', title: 'Nutrição por fase',     desc: 'Comer conforme as necessidades do ciclo',  color: '#C9A97A' },
]

const regularities = [
  { id: 'regular',   icon: '🎯', label: 'Bastante regular',         sub: 'Varia ±2 dias' },
  { id: 'somewhat',  icon: '〜', label: 'Moderadamente regular',    sub: 'Varia ±5 dias' },
  { id: 'irregular', icon: '🌊', label: 'Irregular',                sub: 'Varia muito' },
  { id: 'unknown',   icon: '❓', label: 'Não tenho certeza',        sub: '' },
]

/* ─── Helpers ─── */
function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.07, ease: 'easeOut' }}
          className="inline-block mr-[0.28em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

/* ─── Left panel visuals ─── */
function VisualStep0() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[120, 200, 300, 400].map((size, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: size, height: size,
            borderColor: `rgba(194,132,154,${0.08 - i * 0.015})`,
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.04, 1] }}
          transition={{
            rotate: { duration: 30 + i * 15, repeat: Infinity, ease: 'linear' },
            scale:  { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      ))}
      <motion.div
        className="w-20 h-20 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(194,132,154,0.5) 0%, rgba(168,156,189,0.3) 50%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const r = 140
        const x = Math.cos((deg * Math.PI) / 180) * r
        const y = Math.sin((deg * Math.PI) / 180) * r
        return (
          <motion.div
            key={deg}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `calc(50% + ${x}px - 4px)`,
              top: `calc(50% + ${y}px - 4px)`,
              backgroundColor: i % 2 === 0 ? '#C2849A' : '#A89CBD',
            }}
            animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        )
      })}
    </div>
  )
}

function VisualStep1() {
  const phases = [
    { color: '#C2849A', start: 0,    length: 0.18 },
    { color: '#A89CBD', start: 0.18, length: 0.30, active: true },
    { color: '#7DAF9E', start: 0.48, length: 0.10 },
    { color: '#C9A97A', start: 0.58, length: 0.42 },
  ]
  const R = 80, CX = 110, CY = 110, C = 2 * Math.PI * R
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 220 220">
        {phases.map((p, i) => {
          const startAngle = p.start * 2 * Math.PI - Math.PI / 2 + 0.04
          const endAngle = (p.start + p.length) * 2 * Math.PI - Math.PI / 2 - 0.04
          const lf = p.length > 0.5 ? 1 : 0
          const x1 = CX + R * Math.cos(startAngle)
          const y1 = CY + R * Math.sin(startAngle)
          const x2 = CX + R * Math.cos(endAngle)
          const y2 = CY + R * Math.sin(endAngle)
          const RI = 54
          const xi1 = CX + RI * Math.cos(endAngle)
          const yi1 = CY + RI * Math.sin(endAngle)
          const xi2 = CX + RI * Math.cos(startAngle)
          const yi2 = CY + RI * Math.sin(startAngle)
          const d = `M ${x1} ${y1} A ${R} ${R} 0 ${lf} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${RI} ${RI} 0 ${lf} 0 ${xi2} ${yi2} Z`
          return (
            <motion.path key={i} d={d} fill={p.color}
              opacity={p.active ? 1 : 0.3}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: p.active ? 1 : 0.3, scale: 1 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
          )
        })}
        {[
          { label: 'Menstrual', angle: 0.09, color: '#C2849A' },
          { label: 'Folicular', angle: 0.33, color: '#A89CBD' },
          { label: 'Ovulatória', angle: 0.53, color: '#7DAF9E' },
          { label: 'Lútea', angle: 0.79, color: '#C9A97A' },
        ].map((l) => {
          const a = l.angle * 2 * Math.PI - Math.PI / 2
          const lr = R + 20
          const lx = CX + lr * Math.cos(a)
          const ly = CY + lr * Math.sin(a)
          return (
            <motion.text key={l.label} x={lx} y={ly} textAnchor="middle" fontSize="8"
              fill={l.color} fontFamily="sans-serif" opacity={0}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {l.label}
            </motion.text>
          )
        })}
        <circle cx={CX} cy={CY} r={46} fill="rgba(10,8,16,0.9)"/>
        <motion.text x={CX} y={CY - 6} textAnchor="middle" fontSize="18"
          fontWeight="600" fill="white" fontFamily="serif"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          28
        </motion.text>
        <motion.text x={CX} y={CY + 10} textAnchor="middle" fontSize="8"
          fill="rgba(255,255,255,0.5)" fontFamily="sans-serif"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          dias / ciclo
        </motion.text>
      </svg>
    </div>
  )
}

function VisualStep2({ selected }: { selected: GoalId[] }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="relative w-56 h-56">
        {goals.map((g, i) => {
          const angle = (i / goals.length) * 2 * Math.PI - Math.PI / 2
          const r = 96
          const x = 112 + r * Math.cos(angle)
          const y = 112 + r * Math.sin(angle)
          const isSelected = selected.includes(g.id)
          return (
            <motion.div key={g.id}
              className="absolute flex items-center justify-center rounded-full text-xl"
              style={{
                left: x - 20, top: y - 20, width: 40, height: 40,
                backgroundColor: isSelected ? `${g.color}30` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isSelected ? g.color + '60' : 'rgba(255,255,255,0.08)'}`,
              }}
              animate={{ scale: isSelected ? 1.2 : 1, opacity: isSelected ? 1 : 0.45 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <span style={{ fontSize: '16px' }}>{g.emoji}</span>
            </motion.div>
          )
        })}
        {/* Lines from center to selected */}
        <svg className="absolute inset-0 pointer-events-none" width="224" height="224">
          {goals.map((g, i) => {
            if (!selected.includes(g.id)) return null
            const angle = (i / goals.length) * 2 * Math.PI - Math.PI / 2
            const r = 96
            const x2 = 112 + r * Math.cos(angle)
            const y2 = 112 + r * Math.sin(angle)
            return (
              <motion.line key={g.id} x1="112" y1="112" x2={x2} y2={y2}
                stroke={g.color} strokeWidth="1" strokeDasharray="3 3" opacity="0.4"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            )
          })}
        </svg>
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          animate={{ opacity: selected.length > 0 ? 1 : 0.5 }}>
          <div className="w-12 h-12 rounded-full gradient-sintera flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-white"/>
          </div>
          {selected.length > 0 && (
            <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-body text-white/50 mt-1 text-center"
            >
              {selected.length} {selected.length === 1 ? 'objetivo' : 'objetivos'}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function VisualStep3({ name }: { name: string }) {
  const displayName = name || 'você'
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <div className="w-full max-w-[260px]">
        {/* Mock dashboard card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="rounded-2xl overflow-hidden border border-white/10"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 p-3 border-b border-white/8">
            <div className="w-8 h-8 rounded-full gradient-sintera flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-display font-bold">
                {(name || 'S')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-body font-medium text-white">{displayName}</p>
              <p className="text-[10px] font-body text-white/40">Fase Folicular · Dia 8</p>
            </div>
          </div>
          {/* Body */}
          <div className="p-3 flex flex-col gap-2">
            {/* Score */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(194,132,154,0.12)' }}>
              <div className="relative w-10 h-10 flex-shrink-0">
                <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                  <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                  <motion.circle cx="20" cy="20" r="14" fill="none" stroke="#C2849A" strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 14}
                    initial={{ strokeDashoffset: 2 * Math.PI * 14 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 14 * 0.13 }}
                    transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-display font-bold text-white">87</span>
              </div>
              <div>
                <p className="text-[11px] font-body font-semibold text-white">Prontidão</p>
                <p className="text-[9px] font-body text-white/40">Excelente hoje</p>
              </div>
            </div>
            {/* Mini metrics */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Energia', val: '84%', c: '#C9A97A' },
                { label: 'Sono',    val: '7.5h', c: '#A89CBD' },
                { label: 'Ciclo',   val: 'Dia 8', c: '#C2849A' },
              ].map(m => (
                <div key={m.label} className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-xs font-display font-semibold" style={{ color: m.c }}>{m.val}</p>
                  <p className="text-[9px] font-body text-white/35">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Floating insight */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-3 ml-4 rounded-xl p-2.5 flex items-center gap-2 border border-white/8"
          style={{ background: 'rgba(194,132,154,0.15)', backdropFilter: 'blur(8px)' }}
        >
          <span className="text-sm">⚡</span>
          <p className="text-[11px] font-body text-white/80">Seu primeiro insight está pronto</p>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Main component ─── */
export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<Direction>(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [lastPeriod, setLastPeriod] = useState('')
  const [cycleLength, setCycleLength] = useState('28')
  const [regularity, setRegularity] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<GoalId[]>([])
  const [prefs, setPrefs] = useState({ daily: true, phase: true, email: false })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentHealth, setConsentHealth] = useState(false)
  const supabase = createClient()

  const toggleGoal = (id: GoalId) =>
    setSelectedGoals(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id])

  const next = () => { setDir(1);  setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)) }
  const prev = () => { setDir(-1); setStep(s => Math.max(s - 1, 0)) }

  const finish = async () => {
    setAuthError('')
    setLoading(true)

    // 1. Create account
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setAuthError(error.message)
      setLoading(false)
      return
    }

    // 2. Save profile
    if (data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('profiles').upsert({
        id: data.user.id,
        name,
        age_range: age,
        cycle_length: parseInt(cycleLength),
        last_period: lastPeriod || null,
        cycle_regularity: regularity || null,
        goals: selectedGoals,
        pref_daily_reminder: prefs.daily,
        pref_phase_alerts: prefs.phase,
        pref_email_insights: prefs.email,
      })
    }

    // 3. Record consent
    if (data.user) {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id }),
      })
    }

    window.location.href = '/dashboard'
  }

  const panel = leftPanels[step]
  const quote = quotes[step]
  const canContinue =
    step === 0 ? name.trim().length > 1 :
    step === 1 ? true :
    step === 2 ? selectedGoals.length > 0 :
    email.includes('@') && password.length >= 6 && consentTerms && consentHealth

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: '#0F0B14' }}>

      {/* ── Left panel ─────────────────────────────────────────── */}
      <motion.div
        className="relative lg:sticky lg:top-0 lg:h-screen lg:w-[45%] flex-shrink-0 overflow-hidden"
        style={{ minHeight: '280px' }}
      >
        {/* Animated background */}
        <AnimatePresence>
          <motion.div
            key={step}
            className="absolute inset-0"
            style={{ background: panel.bg }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          />
        </AnimatePresence>

        {/* Glow blobs */}
        <motion.div
          key={step + '-glow1'}
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${panel.accentGlow} 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          key={step + '-glow2'}
          className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: `radial-gradient(circle, ${panel.accent2} 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Step visual */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`visual-${step}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {step === 0 && <VisualStep0 />}
            {step === 1 && <VisualStep1 />}
            {step === 2 && <VisualStep2 selected={selectedGoals} />}
            {step === 3 && <VisualStep3 name={name} />}
          </motion.div>
        </AnimatePresence>

        {/* Text overlay — bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10"
          style={{ background: 'linear-gradient(to top, rgba(10,8,16,0.85) 0%, transparent 100%)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {quote.headline && (
                <p className="font-body text-sm text-white/45 mb-1 leading-relaxed">
                  {quote.headline}
                </p>
              )}
              <p className="font-display text-xl lg:text-2xl font-medium text-white leading-snug mb-2">
                <WordReveal text={step === 3
                  ? `${name ? name + ',' : 'Você,'} ${quote.emphasis}`
                  : quote.emphasis
                } />
              </p>
              <p className="font-body text-xs text-white/35">{quote.sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Top logo */}
        <div className="absolute top-6 left-8">
          <Link href="/" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full gradient-sintera flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.3" fill="none"/>
                <circle cx="8" cy="8" r="2" fill="white"/>
              </svg>
            </div>
            <span className="font-display text-sm font-semibold tracking-[0.2em] text-white">SINTERA</span>
          </Link>
        </div>

        {/* Step dots — desktop only */}
        <div className="absolute top-1/2 right-6 -translate-y-1/2 hidden lg:flex flex-col gap-2">
          {stepMeta.map((s, i) => (
            <button key={i} onClick={() => { setDir(i > step ? 1 : -1); setStep(i) }}
              className="flex items-center gap-2 group">
              <p className={`text-[10px] font-body transition-all duration-300 text-right hidden group-hover:block ${i === step ? 'text-white/70' : 'text-white/25'}`}>
                {s.label}
              </p>
              <div className={`rounded-full transition-all duration-300 ${i === step ? 'w-2 h-2 bg-petal shadow-[0_0_6px_rgba(194,132,154,0.8)]' : i < step ? 'w-1.5 h-1.5 bg-white/40' : 'w-1.5 h-1.5 bg-white/15'}`}/>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <div className="flex-1 bg-cream flex flex-col min-h-screen lg:min-h-0 lg:overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-4 lg:pt-8">
          <div className="flex items-center gap-3">
            {stepMeta.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`rounded-full transition-all duration-300 ${i === step ? 'w-5 h-1.5 bg-petal' : i < step ? 'w-1.5 h-1.5 bg-petal/40' : 'w-1.5 h-1.5 bg-border'}`}/>
                {i === step && (
                  <span className="text-[10px] font-body font-medium text-petal uppercase tracking-wider">
                    {s.label}
                  </span>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs font-body text-mauve">{step + 1}/{TOTAL_STEPS}</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 py-4">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 48, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: dir * -48, filter: 'blur(4px)' }}
              transition={{ duration: 0.38, ease: 'easeInOut' }}
            >

              {/* Step 0 ─ Welcome */}
              {step === 0 && (
                <div className="flex flex-col gap-6 max-w-md">
                  <div>
                    <p className="text-xs font-body text-mauve uppercase tracking-[0.18em] mb-3">{stepMeta[0].sublabel}</p>
                    <h1 className="font-display text-3xl lg:text-4xl font-semibold text-onyx leading-tight mb-2">
                      Como gostaria<br/>de ser chamada?
                    </h1>
                    <p className="font-body text-mauve text-sm leading-relaxed">
                      Este é o início de uma conversa entre você e seu corpo.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Name input with custom style */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Seu nome</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Sofia"
                        autoFocus
                        className="text-2xl font-display font-medium text-onyx bg-transparent border-0 border-b-2 border-border pb-2 focus:outline-none focus:border-petal transition-colors duration-300 placeholder:text-mauve/30"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Idade</label>
                      <div className="flex gap-2 flex-wrap">
                        {['< 20', '20–25', '26–30', '31–35', '36–40', '41–45', '46+'].map(range => (
                          <button key={range} type="button"
                            onClick={() => setAge(range)}
                            className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-200 ${age === range ? 'gradient-sintera text-white shadow-sm' : 'bg-white border border-border text-mauve hover:border-petal hover:text-onyx'}`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-blush border border-petal-light/60">
                    <span className="text-base flex-shrink-0">🔒</span>
                    <p className="text-xs font-body text-petal-dark leading-relaxed">
                      Seus dados são 100% privados, nunca vendidos ou compartilhados.
                      Você pode excluir tudo a qualquer momento.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1 ─ Cycle */}
              {step === 1 && (
                <div className="flex flex-col gap-5 max-w-md">
                  <div>
                    <p className="text-xs font-body text-mauve uppercase tracking-[0.18em] mb-3">{stepMeta[1].sublabel}</p>
                    <h1 className="font-display text-3xl lg:text-4xl font-semibold text-onyx leading-tight mb-2">
                      {name ? `${name}, conte-nos` : 'Conte-nos'}<br/>sobre seu ciclo.
                    </h1>
                    <p className="font-body text-mauve text-sm leading-relaxed">
                      Não existe resposta errada. Essas informações nos ajudam a calibrar sua experiência.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Last period */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">
                        Início do último período
                      </label>
                      <input
                        type="date"
                        value={lastPeriod}
                        onChange={e => setLastPeriod(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm font-body text-onyx focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                      />
                    </div>

                    {/* Cycle length */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">
                          Duração do ciclo
                        </label>
                        <span className="font-display text-lg font-semibold text-petal">{cycleLength} dias</span>
                      </div>
                      <input
                        type="range" min="21" max="40" step="1"
                        value={cycleLength}
                        onChange={e => setCycleLength(e.target.value)}
                        className="w-full"
                        style={{
                          background: `linear-gradient(90deg, #C2849A ${((+cycleLength - 21) / 19) * 100}%, #EEE8E1 ${((+cycleLength - 21) / 19) * 100}%)`
                        }}
                      />
                      <div className="flex justify-between text-[10px] font-body text-mauve/50">
                        <span>21 dias</span><span>Médio: 28 dias</span><span>40 dias</span>
                      </div>
                    </div>

                    {/* Regularity */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Regularidade</label>
                      <div className="grid grid-cols-2 gap-2">
                        {regularities.map(opt => (
                          <button key={opt.id} type="button"
                            onClick={() => setRegularity(opt.id)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${regularity === opt.id ? 'border-petal bg-blush text-petal-dark shadow-sm' : 'border-border bg-white hover:border-petal/40 text-onyx/70'}`}
                          >
                            <span className="text-base flex-shrink-0">{opt.icon}</span>
                            <div>
                              <p className="text-xs font-body font-medium leading-tight">{opt.label}</p>
                              {opt.sub && <p className="text-[10px] font-body text-mauve">{opt.sub}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 ─ Goals */}
              {step === 2 && (
                <div className="flex flex-col gap-5 max-w-md">
                  <div>
                    <p className="text-xs font-body text-mauve uppercase tracking-[0.18em] mb-3">{stepMeta[2].sublabel}</p>
                    <h1 className="font-display text-3xl lg:text-4xl font-semibold text-onyx leading-tight mb-2">
                      O que você quer<br/>descobrir sobre você?
                    </h1>
                    <p className="font-body text-mauve text-sm">
                      Escolha quantos quiser. Seus insights serão moldados por isso.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {goals.map(goal => {
                      const isSelected = selectedGoals.includes(goal.id)
                      return (
                        <motion.button
                          key={goal.id}
                          type="button"
                          onClick={() => toggleGoal(goal.id)}
                          whileTap={{ scale: 0.97 }}
                          className={`relative flex flex-col gap-1.5 p-4 rounded-2xl border text-left transition-all duration-200 overflow-hidden ${isSelected ? 'border-transparent shadow-md' : 'border-border bg-white hover:border-petal/30 hover:shadow-sm'}`}
                          style={isSelected ? {
                            background: `linear-gradient(135deg, ${goal.color}18 0%, ${goal.color}08 100%)`,
                            borderColor: `${goal.color}40`,
                          } : {}}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: goal.color }}
                            >
                              <Check size={9} className="text-white"/>
                            </motion.div>
                          )}
                          <span className="text-xl leading-none">{goal.emoji}</span>
                          <p className={`text-xs font-body font-semibold leading-tight ${isSelected ? 'text-onyx' : 'text-onyx/75'}`}>
                            {goal.title}
                          </p>
                          <p className="text-[10px] font-body text-mauve leading-snug">{goal.desc}</p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 3 ─ Ready */}
              {step === 3 && (
                <div className="flex flex-col gap-6 max-w-md">
                  <div>
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-16 h-16 rounded-full gradient-sintera flex items-center justify-center mb-5 shadow-lg shadow-petal/25"
                    >
                      <span className="text-white font-display text-2xl font-semibold">
                        {(name || 'S')[0].toUpperCase()}
                      </span>
                    </motion.div>
                    <p className="text-xs font-body text-mauve uppercase tracking-[0.18em] mb-2">{stepMeta[3].sublabel}</p>
                    <h1 className="font-display text-3xl lg:text-4xl font-semibold text-onyx leading-tight mb-2">
                      {name ? `${name}, sua SINTERA` : 'Sua SINTERA'}<br/>
                      <span className="text-gradient">está pronta.</span>
                    </h1>
                    <p className="font-body text-mauve text-sm leading-relaxed">
                      Personalizamos sua experiência com base nas suas escolhas.
                      Agora é hora de se descobrir.
                    </p>
                  </div>

                  {/* Personalization summary */}
                  {selectedGoals.length > 0 && (
                    <div className="bg-white border border-border rounded-2xl p-4">
                      <p className="text-xs font-body text-mauve uppercase tracking-wider mb-3">Seus focos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedGoals.map(id => {
                          const g = goals.find(x => x.id === id)!
                          return (
                            <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-body font-medium border"
                              style={{ color: g.color, borderColor: `${g.color}30`, backgroundColor: `${g.color}10` }}>
                              <span>{g.emoji}</span> {g.title}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Account creation */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-body text-mauve uppercase tracking-wider">Criar sua conta</p>

                    {authError && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                        <AlertCircle size={13} className="text-red-400 flex-shrink-0"/>
                        <p className="text-xs font-body text-red-600">{authError}</p>
                      </div>
                    )}

                    <div className="relative">
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Criar senha (mín. 6 caracteres)"
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-white text-sm font-body text-onyx placeholder:text-mauve/40 focus:outline-none focus:ring-2 focus:ring-petal/25 focus:border-petal transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-mauve hover:text-petal transition-colors">
                        {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                    </div>
                  </div>

                  {/* Consentimento — obrigatório */}
                  <div className="flex flex-col gap-2.5">
                    <p className="text-xs font-body text-mauve uppercase tracking-wider">Consentimento</p>

                    <label className="flex items-start gap-3 p-3.5 bg-white border border-border rounded-xl cursor-pointer hover:border-petal/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={consentTerms}
                        onChange={e => setConsentTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border accent-petal flex-shrink-0"
                      />
                      <p className="text-xs font-body text-onyx/80 leading-relaxed">
                        Li e aceito os{' '}
                        <a href="/termos" target="_blank" className="text-petal underline hover:text-petal-dark">
                          Termos de Uso
                        </a>{' '}
                        (v2.0)
                      </p>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 bg-blush border border-petal/30 rounded-xl cursor-pointer hover:border-petal/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={consentHealth}
                        onChange={e => setConsentHealth(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-petal accent-petal flex-shrink-0"
                      />
                      <p className="text-xs font-body text-petal-dark leading-relaxed">
                        <strong>Consinto com o tratamento dos meus dados de saúde</strong> conforme a{' '}
                        <a href="/privacidade" target="_blank" className="underline hover:opacity-80">
                          Política de Privacidade
                        </a>{' '}
                        (v2.0). Entendo que laudos e biomarcadores são processados por IA.
                      </p>
                    </label>
                  </div>

                  {/* Preferences */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-body text-mauve uppercase tracking-wider">Notificações</p>
                    {[
                      { key: 'daily' as const, label: 'Lembretes diários de registro' },
                      { key: 'phase' as const, label: 'Alertas de transição de fase' },
                      { key: 'email' as const, label: 'Insights semanais por e-mail' },
                    ].map(pref => (
                      <label key={pref.key}
                        className="flex items-center justify-between p-3.5 bg-white border border-border rounded-xl cursor-pointer hover:border-petal/30 transition-colors"
                      >
                        <span className="text-sm font-body text-onyx/80">{pref.label}</span>
                        <div
                          onClick={() => setPrefs(p => ({ ...p, [pref.key]: !p[pref.key] }))}
                          className={`w-10 h-5.5 rounded-full relative transition-all duration-300 cursor-pointer flex-shrink-0 ${prefs[pref.key] ? 'gradient-sintera' : 'bg-warm'}`}
                          style={{ height: '22px', width: '40px' }}
                        >
                          <motion.div
                            className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm"
                            animate={{ left: prefs[pref.key] ? '20px' : '2px' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-8 lg:px-12 pb-8 pt-4 flex items-center justify-between border-t border-border/50">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-body text-mauve hover:text-onyx disabled:opacity-0 disabled:pointer-events-none transition-all duration-200"
          >
            <ArrowLeft size={15}/>
            Voltar
          </button>

          <div className="flex flex-col items-end gap-1">
            {step < TOTAL_STEPS - 1 ? (
              <motion.button
                onClick={next}
                disabled={!canContinue}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 gradient-sintera text-white font-body font-medium px-7 py-3 rounded-full text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-petal/20"
              >
                Continuar
                <ArrowRight size={15}/>
              </motion.button>
            ) : (
              <motion.button
                onClick={finish}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 gradient-sintera text-white font-body font-medium px-8 py-3.5 rounded-full text-sm hover:opacity-90 transition-opacity shadow-lg shadow-petal/25"
                animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
                    Preparando sua SINTERA…
                  </>
                ) : (
                  <>
                    <Sparkles size={15}/>
                    Começar minha jornada
                  </>
                )}
              </motion.button>
            )}
            {!canContinue && step !== TOTAL_STEPS - 1 && (
              <p className="text-[10px] font-body text-mauve/50">
                {step === 0 ? 'Digite seu nome para continuar' : 'Selecione ao menos um objetivo'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
