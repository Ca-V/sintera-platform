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
  Loader2, Plus, X, ArrowLeft, Trash2, Pencil, Paperclip,
  Dumbbell, Moon, Cigarette, Wine, Apple, Droplets, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import ListCard from '@/components/ListCard'
import { Card } from "@/lib/ui/ds"
import PageHeader from '@/components/PageHeader'
import Disclaimer from '@/components/ui/Disclaimer'
import ConfirmDialog from '@/components/ConfirmDialog'
import { type AgendaEventInput, type RecurrenceFreq } from '@/components/AgendarModal'
import { useEventForm } from '@/components/eventForm'
import { eventServicesFor, isFinancial, type HealthEvent } from '@/lib/agenda'
import { parseRule } from '@/lib/recurrence'
import { todayISO } from '@/lib/date'

// Lembrete de hábito = evento planejado no canônico health_events, vinculado ao hábito (EventLink 'habit').
// Mesma infra recorrente de Medicamentos/Recursos — sem tabela nem worker próprios.
function isHabitReminder(e: HealthEvent, habitId: string): boolean {
  return e.type === 'outro' && e.status === 'planejado' && !isFinancial(e)
    && e.links.some(l => l.type === 'habit' && l.id === habitId)
}

const LEMBRETE_FREQ_OPTS: { v: RecurrenceFreq; l: string }[] = [
  { v: 'daily', l: 'Diário' }, { v: 'weekly', l: 'Semanal' }, { v: 'biweekly', l: 'Quinzenal' }, { v: 'monthly', l: 'Mensal' },
]

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
  goalAmount: number | null
  goalUnit: string | null
  goalDivisions: number | null
  planUrl: string | null
  planName: string | null
}

/** Resumo textual da meta divisível (ex.: "2000 ml · 8 partes de 250 ml"). Puro. */
function goalSummary(h: Pick<Habit, 'goalAmount' | 'goalUnit' | 'goalDivisions'>): string | null {
  if (h.goalAmount == null) return null
  const unit = h.goalUnit?.trim() ? ` ${h.goalUnit.trim()}` : ''
  const total = `${h.goalAmount}${unit}`
  if (h.goalDivisions && h.goalDivisions > 1) {
    const per = Math.round((h.goalAmount / h.goalDivisions) * 100) / 100
    return `Meta: ${total} · ${h.goalDivisions} partes de ${per}${unit}`
  }
  return `Meta: ${total}`
}

export default function HabitosPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [category, setCategory] = useState<Category>('atividade_fisica')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [lembrete, setLembrete] = useState(false)
  const [lembreteFreq, setLembreteFreq] = useState<RecurrenceFreq>('daily')
  const [reminderEvents, setReminderEvents] = useState<HealthEvent[]>([])
  const { saveEvent } = useEventForm()
  // Meta divisível + anexo de plano/dieta (migration 134).
  const [goalAmount, setGoalAmount] = useState('')
  const [goalUnit, setGoalUnit] = useState('')
  const [goalDivisions, setGoalDivisions] = useState('')
  const [planUrl, setPlanUrl] = useState('')
  const [planName, setPlanName] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('life_habits')
      .select('id, category, description, frequency, notes, goal_amount, goal_unit, goal_divisions, plan_url, plan_name')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(h => ({
      id: h.id as string, category: (h.category as Category) ?? 'outro',
      description: (h.description as string) ?? '',
      frequency: (h.frequency as string) ?? null, notes: (h.notes as string) ?? null,
      goalAmount: (h.goal_amount as number) ?? null, goalUnit: (h.goal_unit as string) ?? null,
      goalDivisions: (h.goal_divisions as number) ?? null,
      planUrl: (h.plan_url as string) ?? null, planName: (h.plan_name as string) ?? null,
    })))
    // Lembretes de hábito (health_events) — para o campo inline saber o estado atual.
    const evs = await eventServicesFor(supabase as never).query.listAll(user.id)
    setReminderEvents(evs.filter(e => e.links.some(l => l.type === 'habit')))
    setLoading(false)
  }, [user, supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega dados na montagem (data fetching)
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  // Hub "Adicionar Registro": ?novo=1 abre direto o formulário de novo hábito (conclui o registro; não só a lista).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('novo') !== '1') return
    reset(); setShowForm(true)
    window.history.replaceState(null, '', window.location.pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function reset() {
    setEditingId(null); setCategory('atividade_fisica'); setDescription(''); setFrequency(''); setNotes(''); setErr(null)
    setLembrete(false); setLembreteFreq('daily')
    setGoalAmount(''); setGoalUnit(''); setGoalDivisions(''); setPlanUrl(''); setPlanName('')
  }

  function startEdit(h: Habit) {
    setEditingId(h.id); setCategory(h.category); setDescription(h.description)
    setFrequency(h.frequency ?? ''); setNotes(h.notes ?? ''); setErr(null); setShowForm(true)
    setGoalAmount(h.goalAmount != null ? String(h.goalAmount) : ''); setGoalUnit(h.goalUnit ?? '')
    setGoalDivisions(h.goalDivisions != null ? String(h.goalDivisions) : '')
    setPlanUrl(h.planUrl ?? ''); setPlanName(h.planName ?? '')
    const rev = reminderEvents.find(e => isHabitReminder(e, h.id))
    setLembrete(!!rev)
    const fr = rev ? parseRule(rev.recurrenceRule).frequency : 'none'
    setLembreteFreq(fr && fr !== 'none' ? (fr as RecurrenceFreq) : 'daily')
  }

  async function uploadPlan(file: File) {
    if (!user || uploading) return
    setUploading(true)
    try {
      const path = `${user.id}/habit-plans/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('exams').upload(path, file, { contentType: file.type, upsert: false })
      if (error) { setErr('Falha ao anexar o arquivo.'); return }
      const { data: signed } = await supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
      if (signed?.signedUrl) { setPlanUrl(signed.signedUrl); setPlanName(file.name) }
    } finally { setUploading(false) }
  }

  async function save() {
    if (!user || saving || !description.trim()) return
    setSaving(true); setErr(null)
    const amt = goalAmount.trim() ? Number(goalAmount.replace(',', '.')) : null
    const div = goalDivisions.trim() ? Math.trunc(Number(goalDivisions)) : null
    const payload = {
      user_id: user.id, category, description: description.trim(),
      frequency: frequency.trim() || null, notes: notes.trim() || null,
      goal_amount: amt != null && Number.isFinite(amt) ? amt : null,
      goal_unit: goalUnit.trim() || null,
      goal_divisions: div != null && Number.isFinite(div) && div > 0 ? div : null,
      plan_url: planUrl || null, plan_name: planName || null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (supabase as any).from('life_habits')
    const res = editingId
      ? await db.update(payload).eq('id', editingId).select('id').single()
      : await db.insert(payload).select('id').single()
    if (res.error) { setSaving(false); setErr(res.error.message); return }
    const habitId = (res.data?.id as string) ?? editingId

    // Lembrete recorrente vinculado ao hábito (EventLink 'habit') — mesma infra saveEvent. Falha não bloqueia o hábito.
    if (habitId) {
      const existing = reminderEvents.find(e => isHabitReminder(e, habitId)) ?? null
      try {
        if (lembrete) {
          const input: AgendaEventInput = {
            eventType: 'outro', isReturn: false, isSurgery: false, status: 'planejado',
            // Preserva a âncora do lembrete existente ao editar (não reancorar a recorrência); novo = hoje.
            title: `Hábito: ${description.trim()}`, date: existing?.date || todayISO(), time: '', durationMin: 30,
            notes: `Lembrete do hábito: ${description.trim()}`, reminderEnabled: true,
            modality: '', professionalKind: '', professionalName: '', establishment: '', location: '', preparation: '',
            amount: '', expenseDocType: '', recurrenceFrequency: lembreteFreq, recurrenceUntil: '',
            priority: '', directExpense: false, outcome: '', operadora: '', carteirinha: '',
          }
          await saveEvent(user.id, input, existing, [{ type: 'habit', id: habitId }])
        } else if (existing) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('health_events').delete().eq('id', existing.id)
        }
      } catch { /* lembrete opcional — não impede o registro do hábito */ }
    }

    setSaving(false)
    reset(); setShowForm(false); await load()
  }

  function remove(h: Habit) {
    if (busyId) return
    setConfirm({ message: `Remover "${h.description}"?`, confirmLabel: 'Remover', onYes: async () => {
      setBusyId(h.id)
      // Remove também o lembrete recorrente vinculado (não deixar evento órfão na Agenda).
      const rev = reminderEvents.find(e => isHabitReminder(e, h.id))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (rev) await (supabase as any).from('health_events').delete().eq('id', rev.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('life_habits').delete().eq('id', h.id)
      await load(); setBusyId(null)
    } })
  }

  function card(h: Habit) {
    const meta = catMeta(h.category)
    const Icon = meta.icon
    const hasReminder = reminderEvents.some(e => isHabitReminder(e, h.id))
    return (
      <ListCard
        key={h.id}
        leading={
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="text-petal" />
          </div>
        }
        title={h.description}
        meta={[h.frequency, h.notes, goalSummary(h), h.planUrl ? '📎 plano' : '', hasReminder ? '🔔 lembrete' : ''].filter(Boolean).join(' · ')}
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

      <PageHeader icon={<Sparkles size={16} />} eyebrow="Hábitos" title="Hábitos de Vida"
        subtitle={<>Registre os fatores do seu dia a dia — a SINTERA organiza e acompanha sua evolução.</>}
        action={
          <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
            className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar'}
          </button>
        } />

      {showForm && (
        <Card padding="relaxed" className="space-y-3">
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

          {/* Lembrete recorrente — mesma infra da Agenda (Medicamentos/Recursos). Vinculado ao hábito. */}
          <label className="flex items-center gap-2 font-body text-sm text-onyx cursor-pointer">
            <input type="checkbox" checked={lembrete} onChange={e => setLembrete(e.target.checked)} className="accent-petal w-4 h-4" />
            Criar lembrete recorrente
          </label>
          {lembrete && (
            <div className="space-y-2 rounded-lg bg-blush/20 border border-petal/15 p-2.5">
              <div>
                <label htmlFor="habito-lembrete-freq" className="font-body text-[11px] text-mauve block mb-1">Frequência do lembrete</label>
                <select id="habito-lembrete-freq" value={lembreteFreq} onChange={e => setLembreteFreq(e.target.value as RecurrenceFreq)}
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30">
                  {LEMBRETE_FREQ_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
              <p className="font-body text-[11px] text-mauve leading-relaxed">
                Cria um lembrete recorrente na sua Agenda a partir de hoje. Você é avisada pelo canal definido nas suas preferências de notificação.
              </p>
            </div>
          )}
          {/* Meta divisível (opcional) — ex.: hidratação 2000 ml em 8 partes. A SINTERA só guarda a meta informada. */}
          <div>
            <label className="font-body text-xs text-mauve block mb-1">Meta (opcional)</label>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" inputMode="decimal" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder="Total (2000)" aria-label="Meta total"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <input type="text" value={goalUnit} onChange={e => setGoalUnit(e.target.value)} placeholder="Unidade (ml)" aria-label="Unidade da meta"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <input type="number" inputMode="numeric" value={goalDivisions} onChange={e => setGoalDivisions(e.target.value)} placeholder="Partes (8)" aria-label="Divisões da meta"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            {goalAmount.trim() && Number.isFinite(Number(goalAmount.replace(',', '.'))) && (
              <p className="font-body text-[11px] text-mauve mt-1">
                {goalSummary({ goalAmount: Number(goalAmount.replace(',', '.')), goalUnit, goalDivisions: goalDivisions.trim() ? Number(goalDivisions) : null })}
              </p>
            )}
          </div>

          {/* Anexo de plano/dieta (opcional) — arquivo no bucket privado. */}
          <div>
            <label className="font-body text-xs text-mauve block mb-1">Plano / dieta (opcional)</label>
            {planUrl ? (
              <div className="flex items-center gap-2 font-body text-sm">
                <a href={planUrl} target="_blank" rel="noreferrer" className="text-petal hover:underline inline-flex items-center gap-1"><Paperclip size={13} /> {planName || 'Anexo'}</a>
                <button type="button" onClick={() => { setPlanUrl(''); setPlanName('') }} aria-label="Remover anexo"
                  className="text-mauve/50 hover:text-red-400 transition-colors"><X size={13} /></button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-ivory cursor-pointer font-body text-sm text-mauve hover:border-petal/40 transition-colors">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />} {uploading ? 'Enviando…' : 'Anexar arquivo'}
                <input type="file" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPlan(f) }} />
              </label>
            )}
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
        <Card padding="none" className="p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length > 0 ? (
        // Gestor: agrupado por categoria (na ordem de CATEGORIES), com cabeçalho + contagem.
        <div className="space-y-5">
          {CATEGORIES.filter(c => items.some(h => h.category === c.value)).map(c => {
            const CatIcon = c.icon
            const list = items.filter(h => h.category === c.value)
            return (
              <div key={c.value} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <CatIcon size={13} className="text-petal" />
                  <p className="font-body text-[11px] font-semibold text-mauve uppercase tracking-wider">{c.label}</p>
                  <span className="font-body text-[11px] text-mauve/50">{list.length}</span>
                </div>
                <div className="space-y-2">{list.map(card)}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card padding="none" className="p-10 text-center space-y-1">
          <p className="font-body text-sm text-mauve">Nenhum hábito registrado ainda.</p>
          <p className="font-body text-xs text-mauve">Use “Adicionar” para registrar atividade física, sono, alimentação e outros.</p>
        </Card>
      )}

      <Disclaimer variant="geral" className="text-center" />

      <ConfirmDialog
        open={!!confirm}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirmar'}
        onConfirm={() => { const c = confirm; setConfirm(null); c?.onYes() }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
