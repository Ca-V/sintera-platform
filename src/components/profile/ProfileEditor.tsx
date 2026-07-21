'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import type { Profile } from '@/lib/supabase/types'
import { Card } from "@/lib/ui/ds"

interface Props {
  profile: Profile
  onCancel: () => void
  onSaved: () => void
}

const inputClass =
  'w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-body text-onyx ' +
  'placeholder:text-mauve focus:outline-none focus:ring-2 focus:ring-petal/30 focus:border-petal ' +
  'transition-all duration-200 hover:border-petal-light'

export default function ProfileEditor({ profile, onCancel, onSaved }: Props) {
  const { updateProfile } = useUser()
  const [name, setName]       = useState(profile.name ?? '')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
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
    <Card padding="none" className="p-6 space-y-5">
      <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest">
        Editar perfil
      </h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="profile-nome" className="text-xs font-body font-medium text-mauve uppercase tracking-wider">Nome</label>
        <input
          id="profile-nome"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          placeholder="Seu nome"
          autoFocus
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm font-body text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 bg-ivory border border-border text-onyx font-body font-medium py-3 rounded-full hover:bg-warm transition-colors">
          <X size={14} /> Cancelar
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !name.trim()}
          className="flex-1 flex items-center justify-center gap-2 gradient-sintera text-white font-body font-medium py-3 rounded-full hover:opacity-90 disabled:opacity-50 transition-all shadow-md">
          {saving ? 'Salvando…' : <><Check size={14} /> Salvar</>}
        </button>
      </div>
    </Card>
  )
}
