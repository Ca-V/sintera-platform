'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@/context/UserContext'
import { createClient } from '@/lib/supabase/client'
import { Edit3, Check, X, Loader2, FileText, FlaskConical, CalendarDays } from 'lucide-react'
import { Card } from '@/lib/ui/ds'
import MotionCard from '@/components/ui/MotionCard'
import ActionCard from '@/components/ui/ActionCard'

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

  const displayName = profile?.name ?? 'Usuária'
  const initials    = displayName.charAt(0).toUpperCase()

  useEffect(() => {
    if (!user) return
    // eslint-disable-next-line react-hooks/immutability -- loadStats é declarada abaixo (função hoisted); chamada intencional
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda quando user muda; loadStats intencionalmente fora das deps
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
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        padding="none" className="p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full gradient-sintera flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-display text-2xl font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  aria-label="Editar nome"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false) }}
                  className="font-display text-xl font-semibold text-onyx bg-ivory border border-petal/40 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-petal/40 min-w-0 flex-1"
                />
                <button onClick={saveName} disabled={savingName}
                  className="text-petal hover:text-petal/70 transition-colors flex-shrink-0">
                  {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button onClick={() => setEditName(false)}
                  className="text-mauve hover:text-onyx transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className="font-display text-xl font-semibold text-onyx break-words min-w-0">{displayName}</p>
                <button onClick={startEdit}
                  className="text-mauve hover:text-petal transition-colors flex-shrink-0">
                  <Edit3 size={14} />
                </button>
              </div>
            )}
            {nameError && <p className="font-body text-xs text-red-500 mt-1">{nameError}</p>}
            <p className="font-body text-sm text-mauve mt-0.5">{user?.email}</p>
            {stats?.memberSince && (
              <p className="font-body text-xs text-mauve mt-1">
                Membro desde {formatDate(stats.memberSince)}
              </p>
            )}
          </div>
        </div>
      </MotionCard>

      {/* Estatísticas */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3">
          {[
            { icon: FileText,      value: stats.totalExams,      label: 'Exames',       color: 'text-petal',   bg: 'bg-blush' },
            { icon: FlaskConical,  value: stats.totalBiomarkers, label: 'Biomarcadores', color: 'text-lavender', bg: 'bg-lavender-light' },
            // eslint-disable-next-line react-hooks/purity -- cálculo de exibição (dias desde o cadastro)
            { icon: CalendarDays,  value: stats.memberSince ? Math.max(1, Math.floor((Date.now() - new Date(stats.memberSince).getTime()) / (1000 * 60 * 60 * 24))) : 0,
              label: 'Dias na SINTERA', color: 'text-petal', bg: 'bg-blush' },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <Card key={label} padding="none" className="p-4 text-center">
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={15} className={color} />
              </div>
              <p className="font-display text-xl font-bold text-onyx">{value}</p>
              <p className="font-body text-[11px] text-mauve mt-0.5 leading-tight">{label}</p>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Informações da conta */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        padding="none" className="p-6 space-y-4">
        <h2 className="font-body text-xs font-semibold text-onyx/50 uppercase tracking-wider">Informações da conta</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1">Nome</p>
            <p className="font-body text-sm font-medium text-onyx">{profile?.name ?? '—'}</p>
          </div>
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1">E-mail</p>
            <p className="font-body text-sm font-medium text-onyx truncate">{user?.email ?? '—'}</p>
          </div>
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1">Plano</p>
            <p className="font-body text-sm font-medium text-onyx">
              Gratuito
            </p>
          </div>
          <div className="p-3 bg-ivory rounded-xl">
            <p className="font-body text-[11px] text-mauve uppercase tracking-wider mb-1">Conta criada</p>
            <p className="font-body text-sm font-medium text-onyx">
              {stats?.memberSince ? formatDate(stats.memberSince) : '—'}
            </p>
          </div>
        </div>
      </MotionCard>

      {/* Link para configurações */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <ActionCard href="/dashboard/configuracoes"
          padding="default" className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm font-semibold text-onyx">Configurações da conta</p>
            <p className="font-body text-xs text-mauve mt-0.5">Alterar senha, privacidade, excluir conta</p>
          </div>
          <span className="font-body text-sm text-petal">→</span>
        </ActionCard>
      </motion.div>

    </div>
  )
}
