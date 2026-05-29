'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@/context/UserContext'
import { Edit3 } from 'lucide-react'
import ProfileEditor from '@/components/profile/ProfileEditor'

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

export default function ProfilePage() {
  const { user, profile } = useUser()
  const [editing, setEditing] = useState(false)

  const displayName = profile?.name ?? 'Usuária'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Meu Perfil</h1>
          <p className="font-body text-sm text-mauve">
            {editing ? 'Edite seus dados e salve ao terminar' : 'Gerencie seus dados pessoais e preferências'}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-sm font-body font-medium text-petal-dark bg-blush border border-petal-light px-4 py-2 rounded-full hover:shadow-sm transition-all flex-shrink-0"
          >
            <Edit3 size={14} /> Editar
          </button>
        )}
      </div>

      {/* Avatar card — always visible */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6 flex items-center gap-5"
      >
        <div className="w-16 h-16 rounded-full gradient-sintera flex items-center justify-center shadow-lg flex-shrink-0">
          <span className="text-white font-display text-2xl font-semibold">{initials}</span>
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-onyx">{displayName}</p>
          <p className="font-body text-sm text-mauve">{user?.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-body font-medium text-petal-dark bg-blush border border-petal-light px-3 py-0.5 rounded-full">
            Fase Folicular · Dia 8
          </span>
        </div>
      </motion.div>

      {/* Edit mode */}
      {editing && profile && (
        <ProfileEditor
          profile={profile}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}

      {/* Edit mode but profile hasn't loaded yet */}
      {editing && !profile && (
        <p className="font-body text-sm text-mauve text-center py-8">
          Carregando perfil…
        </p>
      )}

      {/* View mode */}
      {!editing && (
        <>
          {/* Info grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-6 space-y-5"
          >
            <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest">
              Dados pessoais
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Nome',         value: profile?.name ?? '—' },
                { label: 'Faixa etária', value: profile?.age_range ?? '—' },
                { label: 'Ciclo médio',  value: profile?.cycle_length ? `${profile.cycle_length} dias` : '—' },
                { label: 'Regularidade', value: profile?.cycle_regularity ?? '—' },
              ].map(f => (
                <div key={f.label} className="flex flex-col gap-1 p-3 bg-ivory rounded-xl">
                  <span className="text-[10px] font-body text-mauve uppercase tracking-wider">{f.label}</span>
                  <span className="text-sm font-body font-medium text-onyx">{f.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Goals */}
          {(profile?.goals?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-premium p-6"
            >
              <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest mb-4">
                Meus objetivos
              </h2>
              <div className="flex flex-wrap gap-2">
                {(profile!.goals ?? []).map(id => {
                  const g = GOALS.find(x => x.id === id)
                  if (!g) return null
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium bg-blush text-petal-dark border border-petal-light"
                    >
                      {g.emoji} {g.label}
                    </span>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Notifications (read-only view) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-premium p-6"
          >
            <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest mb-4">
              Notificações
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Lembretes diários de registro', active: profile?.pref_daily_reminder ?? true },
                { label: 'Alertas de transição de fase',  active: profile?.pref_phase_alerts ?? true },
                { label: 'Insights semanais por e-mail',  active: profile?.pref_email_insights ?? false },
              ].map(p => (
                <div
                  key={p.label}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm font-body text-onyx/80">{p.label}</span>
                  <span
                    className={`text-xs font-body font-medium px-2.5 py-1 rounded-full ${
                      p.active ? 'bg-sage-light text-sage' : 'bg-ivory text-mauve'
                    }`}
                  >
                    {p.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
