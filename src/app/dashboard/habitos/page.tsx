'use client'

// ============================================================
// Hábitos de Vida — fatores do dia a dia autorrelatados
// ============================================================
// Registro factual e autorrelatado. A SINTERA NUNCA avalia, pontua nem
// recomenda — apenas organiza o que a usuária informa (atividade física,
// sono, tabagismo, álcool, alimentação, hidratação e outros).
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Loader2, Plus, X, ArrowLeft, Trash2, Pencil,
  Dumbbell, Moon, Cigarette, Wine, Apple, Droplets, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import ListCard from '@/components/ListCard'
import Card from '@/components/ui/Card'
import Disclaimer from '@/components/ui/Disclaimer'

type Category =
  | 'atividade_fisica' | 'sono' | 'tabagismo' | 'alcool'
  | 'alimentacao' | 'hidratacao' | 'outro'

const CATEGORIES: { value: Category; label: string; icon: React.ElementType }[] = [
  { value: 'atividade_fisica', label: 'Atividade física', icon: Dumbbell },
  { value: 'sono',             label: 'Sono',             icon: Moon },
  { value: 'tabagismo',        label: 'Tabagismo',        icon: Cigarette },
  { value: 'alcool',           label: 'Álcool',           icon: Wine },
  { value: 'alimentacao',      label: 'Alimentação',      icon: Apple },
  { value: 'hidratacao',       label: 'Hidratação',       icon: Droplets },
  { value: 'outro',            label: 'Outro',            icon: Sparkles },
]

function catMeta(c: Category) {
  return CATEGORIES.find(x => x.value === c) ?? CATEGORIES[CATEGORIES.length - 1]
}

interface Habit {
  id: string
  category: Category
  description: string
  frequency: string | null
  notes: string | null
}

export default function HabitosPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [category, setCategory] = useState<Category>('atividade_fisica')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('life_habits')
      .select('id, category, description, frequency, notes')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(h => ({
      id: h.id as string, category: (h.category as Category) ?? 'outro',
      description: (h.description as string) ?? '',
      frequency: (h.frequency as string) ?? null, notes: (h.notes as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega dados na montagem (data fetching)
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function reset() { setEditingId(null); setCategory('atividade_fisica'); setDescription(''); setFrequency(''); setNotes(''); setErr(null) }

  function startEdit(h: Habit) {
    setEditingId(h.id); setCategory(h.category); setDescription(h.description)
    setFrequency(h.frequency ?? ''); setNotes(h.notes ?? ''); setErr(null); setShowForm(true)
  }

  async function save() {
    if (!user || saving || !description.trim()) return
    setSaving(true); setErr(null)
    const payload = {
      user_id: user.id, category, description: description.trim(),
      frequency: frequency.trim() || null, notes: notes.trim() || null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (supabase as any).from('life_habits')
    const { error } = editingId
      ? await db.update(payload).eq('id', editingId)
      : await db.insert(payload)
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  async function remove(h: Habit) {
    if (busyId) return
    if (!window.confirm(`Remover "${h.description}"?`)) return
    setBusyId(h.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('life_habits').delete().eq('id', h.id)
    await load(); setBusyId(null)
  }

  function card(h: Habit) {
    const meta = catMeta(h.category)
    const Icon = meta.icon
    return (
      <ListCard
        key={h.id}
        leading={
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="text-petal" />
          </div>
        }
        title={h.description}
        meta={[meta.label, h.frequency, h.notes].filter(Boolean).join(' · ')}
        actions={
          <>
            <button onClick={() => startEdit(h)} title="Editar"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-petal transition-colors">
              <Pencil size={12} />
            </button>
            <button onClick={() => remove(h)} disabled={busyId === h.id} title="Remover"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors">
              <Trash2 size={12} />
            </button>
          </>
        }
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Hábitos de Vida</h1>
          <p className="font-body text-sm text-mauve mt-1">Registre os fatores do seu dia a dia — a SINTERA organiza e acompanha sua evolução.</p>
        </div>
        <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
          className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar'}
        </button>
      </div>

      {showForm && (
        <Card padding="md" className="space-y-3">
          <div>
            <label className="font-body text-xs text-mauve block mb-1.5">Categoria</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => {
                const Icon = c.icon
                const active = category === c.value
                return (
                  <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs transition-colors ${
                      active ? 'gradient-sintera text-white' : 'bg-ivory border border-border text-mauve hover:text-onyx'
                    }`}>
                    <Icon size={13} /> {c.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label htmlFor="habito-descricao" className="font-body text-xs text-mauve block mb-1">Descrição</label>
            <div className="flex items-center gap-2">
              <input id="habito-descricao" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex.: Caminhada, musculação, 7h de sono"
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setDescription(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          <div>
            <label htmlFor="habito-frequencia" className="font-body text-xs text-mauve block mb-1">Frequência (opcional)</label>
            <input id="habito-frequencia" type="text" value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="Ex.: 3x por semana, diário"
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <div>
            <label htmlFor="habito-observacoes" className="font-body text-xs text-mauve block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea id="habito-observacoes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setNotes(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving || !description.trim()}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length > 0 ? (
        <div className="space-y-2">{items.map(card)}</div>
      ) : (
        <Card padding="2xl" className="text-center space-y-1">
          <p className="font-body text-sm text-mauve">Nenhum hábito registrado ainda.</p>
          <p className="font-body text-xs text-mauve">Use “Adicionar” para registrar atividade física, sono, alimentação e outros.</p>
        </Card>
      )}

      <Disclaimer variant="registro" className="text-center" />
    </div>
  )
}
