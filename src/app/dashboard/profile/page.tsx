'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import { Edit3, Check, X, Loader2, FileText, FlaskConical, CalendarDays } from 'lucide-react'

interface Stats {
  totalExams: number
  totalBiomarkers: number
  memberSince: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default function ProfilePage() {
  const { user, profile, updateProfile } = useUser()
  const supabase = useRef(createClient()).current

  const [stats, setStats]         = useState<Stats | null>(null)
  const [editingName, setEditName] = useState(false)
  const [nameValue, setNameValue]  = useState('')
  const [savingName, setSaving]    = useState(false)
  const [nameError, setNameError]  = useState<string | null>(null)

  const [editingHeight, setEditHeight] = useState(false)
  const [heightValue, setHeightValue]  = useState('')
  const [savingHeight, setSavingHeight] = useState(false)

  const displayName = profile?.name ?? 'Usuária'
  const initials    = displayName.charAt(0).toUpperCase()

  useEffect(() => {
    if (!user) return
    loadStats()
  }, [user])

  async function loadStats() {
    const [examsRes, bioRes] = await Promise.all([
      supabase.from('exams').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('current_biomarkers').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('synthetic', false),
    ])
    setStats({
      totalExams:     examsRes.count ?? 0,
      totalBiomarkers: bioRes.count ?? 0,
      memberSince:    user?.created_at ?? null,
    })
  }

  function startEdit() {
    setNameValue(profile?.name ?? '')
    setNameError(null)
    setEditName(true)
  }

  function startEditHeight() {
    const h = (profile as { height_cm?: number | null } | null)?.height_cm
    setHeightValue(h != null ? String(h) : '')
    setEditHeight(true)
  }

  async function saveHeight() {
    setSavingHeight(true)
    const raw = heightValue.replace(',', '.').trim()
    const num = raw === '' ? null : Number(raw)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height_cm: num != null && isFinite(num) ? num : null }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      const saved = await res.json()
      updateProfile(saved)
      setEditHeight(false)
    } catch {
      /* silencioso */
    } finally {
      setSavingHeight(false)
    }
  }

  async function saveName() {
    if (!nameValue.trim()) return
    setSaving(true)
    setNameError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue.trim() }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      const saved = await res.json()
      updateProfile(saved)
      setEditName(false)
    } catch {
      setNameError('Não foi possível salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Meu Perfil</h1>
        <p className="font-body text-sm text-mauve">Seus dados na SINTERA</p>
      </motion.div>

      {/* Avatar + info principal */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="card-premium p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full gradient-sintera flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-display text-2xl font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false) }}
                  className="font-display text-xl font-semibold text-onyx bg-ivory border border-petal/40 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-petal/40 min-w-0 flex-1"
                />
                <button onClick={saveName} disabled={savingName}
                  className="text-sage hover:text-sage/70 transition-colors flex-shrink-0">
                  {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button onClick={() => setEditName(false)}
                  className="text-mauve hover:text-onyx transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className="font-display text-xl font-semibold text-onyx truncate">{displayName}</p>
                <button onClick={startEdit}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-mauve/50 hover:text-petal flex-shrink-0">
                  <Edit3 size={14} />
                </button>
              </div>
            )}
            {nameError && <p className="font-body text-xs text-red-500 mt-1">{nameError}</p>}
            <p className="font-body text-sm text-mauve mt-0.5">{user?.email}</p>
            {stats?.memberSince && (
              <p className="font-body text-xs text-mauve/50 mt-1">
                Membro desde {formatDate(stats.memberSince)}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Estatísticas */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3">
          {[
            { icon: FileText,      value: stats.totalExams,      label: 'Exames',       color: 'text-petal',   bg: 'bg-blush' },
            { icon: FlaskConical,  value: stats.totalBiomarkers, label: 'Biomarcadores', color: 'text-lavender', bg: 'bg-lavender-light' },
            { icon: CalendarDays,  value: stats.memberSince ? Math.max(1, Math.floor((Date.now() - new Date(stats.memberSince).getTime()) / (1000 * 60 * 60 * 24))) : 0,
              label: 'Dias na SINTERA', color: 'text-sage', bg: 'bg-sage-light' },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className="card-premium p-4 text-center">
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={15} className={color} />
              </div>
              <p className="font-display text-xl font-bold text-onyx">{value}</p>
              <p className="font-body text-[11px] text-mauve mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Informações da conta */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="card-premium p-6 space-y-4">
        <h2 className="font-body text-xs font-semibold text-onyx/50 uppercase tracking-wider">Informações da conta</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[10px] text-mauve uppercase tracking-wider mb-1">Nome</p>
            <p className="font-body text-sm font-medium text-onyx">{profile?.name ?? '—'}</p>
          </div>
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[10px] text-mauve uppercase tracking-wider mb-1">E-mail</p>
            <p className="font-body text-sm font-medium text-onyx truncate">{user?.email ?? '—'}</p>
          </div>
          <div className="p-3 bg-ivory rounded-xl">
            <div className="flex items-center justify-between gap-2">
              <p className="font-body text-[10px] text-mauve uppercase tracking-wider mb-1">Altura</p>
              {!editingHeight && (
                <button onClick={startEditHeight} className="text-mauve/50 hover:text-petal transition-colors -mt-1">
                  <Edit3 size={12} />
                </button>
              )}
            </div>
            {editingHeight ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus type="number" inputMode="decimal" value={heightValue}
                  onChange={e => setHeightValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveHeight(); if (e.key === 'Escape') setEditHeight(false) }}
                  placeholder="Ex.: 165"
                  className="w-20 font-body text-sm font-medium text-onyx bg-white border border-petal/40 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-petal/40"
                />
                <span className="font-body text-xs text-mauve">cm</span>
                <button onClick={saveHeight} disabled={savingHeight} className="text-sage hover:text-sage/70 flex-shrink-0">
                  {savingHeight ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button onClick={() => setEditHeight(false)} className="text-mauve hover:text-onyx flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="font-body text-sm font-medium text-onyx">
                {(profile as { height_cm?: number | null } | null)?.height_cm != null
                  ? `${(profile as { height_cm?: number | null }).height_cm} cm` : '—'}
              </p>
            )}
          </div>
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[10px] text-mauve uppercase tracking-wider mb-1">Plano</p>
            <p className="font-body text-sm font-medium text-onyx">
              Gratuito
            </p>
          </div>
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[10px] text-mauve uppercase tracking-wider mb-1">Conta criada</p>
            <p className="font-body text-sm font-medium text-onyx">
              {stats?.memberSince ? formatDate(stats.memberSince) : '—'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Link para configurações */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <a href="/dashboard/configuracoes"
          className="block card-premium p-4 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="font-body text-sm font-semibold text-onyx">Configurações da conta</p>
            <p className="font-body text-xs text-mauve mt-0.5">Alterar senha, privacidade, excluir conta</p>
          </div>
          <span className="font-body text-sm text-petal">→</span>
        </a>
      </motion.div>

    </div>
  )
}
