'use client'

// ============================================================
// Condições de Saúde — próprias + histórico familiar
// ============================================================
// Registro factual e autorrelatado. A SINTERA NUNCA identifica nem infere
// condições — apenas organiza o que a usuária informa (dela ou da família).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, X, Stethoscope, ArrowLeft, Trash2, Users, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'

type Scope = 'propria' | 'familiar'

interface Condition {
  id: string
  scope: Scope
  name: string
  relative: string | null
  sinceLabel: string | null
  notes: string | null
}

export default function CondicoesPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Condition[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>('propria')
  const [name, setName] = useState('')
  const [relative, setRelative] = useState('')
  const [since, setSince] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('health_conditions')
      .select('id, scope, name, relative, since_label, notes')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(c => ({
      id: c.id as string, scope: (c.scope as Scope) ?? 'propria', name: (c.name as string) ?? '',
      relative: (c.relative as string) ?? null, sinceLabel: (c.since_label as string) ?? null, notes: (c.notes as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function reset() { setEditingId(null); setScope('propria'); setName(''); setRelative(''); setSince(''); setNotes(''); setErr(null) }

  function startEdit(c: Condition) {
    setEditingId(c.id); setScope(c.scope); setName(c.name)
    setRelative(c.relative ?? ''); setSince(c.sinceLabel ?? ''); setNotes(c.notes ?? '')
    setErr(null); setShowForm(true)
  }

  async function save() {
    if (!user || saving || !name.trim()) return
    setSaving(true); setErr(null)
    const payload = {
      user_id: user.id, scope, name: name.trim(),
      relative: scope === 'familiar' ? (relative.trim() || null) : null,
      since_label: since.trim() || null, notes: notes.trim() || null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (supabase as any).from('health_conditions')
    const { error } = editingId
      ? await db.update(payload).eq('id', editingId)
      : await db.insert(payload)
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  async function remove(c: Condition) {
    if (busyId) return
    if (!window.confirm(`Remover "${c.name}"?`)) return
    setBusyId(c.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('health_conditions').delete().eq('id', c.id)
    await load(); setBusyId(null)
  }

  const proprias = items.filter(i => i.scope === 'propria')
  const familiares = items.filter(i => i.scope === 'familiar')

  function card(c: Condition) {
    return (
      <div key={c.id} className="card-premium p-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-onyx">{c.name}</p>
          <p className="font-body text-[11px] text-mauve/70 mt-0.5">
            {[c.relative, c.sinceLabel ? `desde ${c.sinceLabel}` : null].filter(Boolean).join(' · ')}
          </p>
          {c.notes && <p className="font-body text-[11px] text-mauve/60 mt-1">{c.notes}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => startEdit(c)} title="Editar"
            className="w-7 h-7 rounded-lg hover:bg-blush flex items-center justify-center text-mauve/60 hover:text-petal">
            <Pencil size={13} />
          </button>
          <button onClick={() => remove(c)} disabled={busyId === c.id} title="Remover"
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/60 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-petal mb-2">
            <Stethoscope size={16} />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Condições de Saúde</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Condições de Saúde</h1>
          <p className="font-body text-sm text-mauve mt-1">Registre condições suas e antecedentes familiares. A SINTERA só organiza o que você informa — não identifica nem infere condições.</p>
        </div>
        <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
          className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar'}
        </button>
      </div>

      {showForm && (
        <div className="card-premium p-5 space-y-3">
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Tipo</label>
            <select value={scope} onChange={e => setScope(e.target.value as Scope)}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
              <option value="propria">Minha condição</option>
              <option value="familiar">Histórico familiar</option>
            </select>
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Condição</label>
            <div className="flex items-center gap-2">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Hipertensão"
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setName(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {scope === 'familiar' && (
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Parente</label>
              <input type="text" value={relative} onChange={e => setRelative(e.target.value)} placeholder="Ex.: Mãe, avô paterno"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Desde quando (opcional)</label>
            <input type="text" value={since} onChange={e => setSince(e.target.value)} placeholder="Ex.: 2020, infância"
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setNotes(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-premium p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope size={15} className="text-petal" />
              <p className="font-display text-base font-semibold text-onyx">Minhas condições</p>
            </div>
            {proprias.length > 0 ? <div className="space-y-2">{proprias.map(card)}</div>
              : <p className="font-body text-sm text-mauve/60">Nenhuma registrada.</p>}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={15} className="text-petal" />
              <p className="font-display text-base font-semibold text-onyx">Histórico familiar</p>
            </div>
            {familiares.length > 0 ? <div className="space-y-2">{familiares.map(card)}</div>
              : <p className="font-body text-sm text-mauve/60">Nenhum registrado.</p>}
          </div>
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Registro do que você informa. A SINTERA não identifica, não infere e não interpreta condições.
      </p>
    </div>
  )
}
