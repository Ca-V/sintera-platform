'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import type { Profile } from '@/lib/supabase/types'

interface Props {
  profile: Profile
  onCancel: () => void
  onSaved: () => void
}

const AGE_RANGES = ['< 20', '20–25', '26–30', '31–35', '36–40', '41–45', '46+']

const REGULARITIES = [
  { id: 'regular',   label: 'Bastante regular',      sub: 'Varia ±2 dias' },
  { id: 'somewhat',  label: 'Moderadamente regular', sub: 'Varia ±5 dias' },
  { id: 'irregular', label: 'Irregular',              sub: 'Varia muito' },
  { id: 'unknown',   label: 'Não sei',                sub: '' },
]

const GOALS = [
  { id: 'cycle',       emoji: '🌙', label: 'Entender meu ciclo' },
  { id: 'energy',      emoji: '⚡', label: 'Maximizar energia' },
  { id: 'sleep',       emoji: '✨', label: 'Dormir melhor' },
  { id: 'performance', emoji: '🔥', label: 'Alta performance' },
  { id: 'hormones',    emoji: '🧬', label: 'Equilíbrio hormonal' },
  { id: 'mood',        emoji: '🌸', label: 'Saúde emocional' },
  { id: 'fertility',   emoji: '🌱', label: 'Planejamento familiar' },
  { id: 'nutrition',   emoji: '🥗', label: 'Nutrição por fase' },
]

const inputClass =
  'w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-body text-onyx ' +
  'placeholder:text-mauve/60 focus:outline-none focus:ring-2 focus:ring-petal/30 focus:border-petal ' +
  'transition-all duration-200 hover:border-petal-light'

export default function ProfileEditor({ profile, onCancel, onSaved }: Props) {
  const { updateProfile } = useUser()

  const [name, setName]               = useState(profile.name ?? '')
  const [ageRange, setAgeRange]       = useState(profile.age_range ?? '')
  const [cycleLength, setCycleLength] = useState(profile.cycle_length ?? 28)
  const [lastPeriod, setLastPeriod]   = useState(profile.last_period ?? '')
  const [regularity, setRegularity]   = useState(profile.cycle_regularity ?? '')
  const [goals, setGoals]             = useState<string[]>(profile.goals ?? [])
  const [dailyReminder, setDailyReminder]   = useState(profile.pref_daily_reminder)
  const [phaseAlerts, setPhaseAlerts]       = useState(profile.pref_phase_alerts)
  const [emailInsights, setEmailInsights]   = useState(profile.pref_email_insights)

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const toggleGoal = (id: string) =>
    setGoals(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          age_range: ageRange || null,
          cycle_length: cycleLength,
          last_period: lastPeriod || null,
          cycle_regularity: regularity || null,
          goals,
          pref_daily_reminder: dailyReminder,
          pref_phase_alerts: phaseAlerts,
          pref_email_insights: emailInsights,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error ?? 'Erro ao salvar')
      }
      const saved = await res.json()
      updateProfile(saved)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Dados pessoais */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 space-y-5"
      >
        <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest">
          Dados pessoais
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Faixa etária</label>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setAgeRange(r)}
                className={`px-4 py-2 rounded-full text-sm font-body transition-all ${
                  ageRange === r
                    ? 'gradient-sintera text-white shadow-sm'
                    : 'bg-ivory border border-border text-mauve hover:border-petal'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">
            Ciclo médio:{' '}
            <span className="text-petal font-semibold">{cycleLength} dias</span>
          </label>
          <input
            type="range"
            min={21}
            max={40}
            value={cycleLength}
            onChange={e => setCycleLength(Number(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-mauve font-body">
            <span>21 dias</span>
            <span>40 dias</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">
            Último período
          </label>
          <input
            type="date"
            value={lastPeriod}
            onChange={e => setLastPeriod(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Regularidade</label>
          <div className="grid grid-cols-2 gap-2">
            {REGULARITIES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegularity(r.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                  regularity === r.id
                    ? 'bg-blush border border-petal-light'
                    : 'bg-ivory border border-transparent hover:border-border'
                }`}
              >
                <p className={`text-sm font-body font-medium ${regularity === r.id ? 'text-petal-dark' : 'text-onyx'}`}>
                  {r.label}
                </p>
                {r.sub && (
                  <p className="text-[10px] font-body text-mauve mt-0.5">{r.sub}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Objetivos */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="card-premium p-6"
      >
        <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest mb-4">
          Meus objetivos
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map(g => {
            const selected = goals.includes(g.id)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGoal(g.id)}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${
                  selected
                    ? 'bg-blush border border-petal-light'
                    : 'bg-ivory border border-transparent hover:border-border'
                }`}
              >
                <span className="text-lg leading-none">{g.emoji}</span>
                <span className={`text-xs font-body font-medium leading-snug ${selected ? 'text-petal-dark' : 'text-onyx/70'}`}>
                  {g.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Notificações */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="card-premium p-6"
      >
        <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest mb-4">
          Notificações
        </h2>
        <div className="flex flex-col gap-3">
          {(
            [
              { label: 'Lembretes diários de registro', value: dailyReminder,  set: setDailyReminder },
              { label: 'Alertas de transição de fase',  value: phaseAlerts,    set: setPhaseAlerts },
              { label: 'Insights semanais por e-mail',  value: emailInsights,  set: setEmailInsights },
            ] as const
          ).map(pref => (
            <div
              key={pref.label}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm font-body text-onyx/80">{pref.label}</span>
              <button
                type="button"
                onClick={() => pref.set(!pref.value)}
                className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                  pref.value ? 'bg-petal' : 'bg-border'
                }`}
                aria-label={pref.value ? 'Desativar' : 'Ativar'}
              >
                <motion.div
                  className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm"
                  animate={{ left: pref.value ? '20px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {error && (
        <p className="text-sm font-body text-center" style={{ color: '#e53e3e' }}>{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 bg-ivory border border-border text-onyx font-body font-medium py-3.5 rounded-full hover:bg-warm transition-colors"
        >
          <X size={15} /> Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 gradient-sintera text-white font-body font-medium py-3.5 rounded-full hover:opacity-90 active:scale-[0.98] transition-all shadow-md disabled:opacity-60"
        >
          {saving ? 'Salvando…' : <><Check size={15} /> Salvar</>}
        </button>
      </div>
    </div>
  )
}
