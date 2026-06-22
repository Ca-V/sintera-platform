'use client'

// ============================================================
// Medidas corporais — série temporal autorrelatada
// ============================================================
// Peso, pressão arterial, circunferência, etc. Registro factual da própria
// pessoa para acompanhar no tempo e levar ao profissional. Sem juízo clínico.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, X, Activity, ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'

type Metric = 'peso' | 'altura' | 'pressao_arterial' | 'circunferencia_cintura' | 'gordura_corporal' | 'massa_muscular' | 'outro'

const METRIC_LABEL: Record<Metric, string> = {
  peso: 'Peso', altura: 'Altura', pressao_arterial: 'Pressão arterial',
  circunferencia_cintura: 'Circunferência (cintura)',
  gordura_corporal: 'Gordura corporal', massa_muscular: 'Massa muscular', outro: 'Outra medida',
}
const DEFAULT_UNIT: Record<Metric, string> = {
  peso: 'kg', altura: 'cm', pressao_arterial: 'mmHg', circunferencia_cintura: 'cm',
  gordura_corporal: '%', massa_muscular: 'kg', outro: '',
}
const PLACEHOLDER: Record<Metric, string> = {
  peso: 'Ex.: 72,5', altura: 'Ex.: 165', pressao_arterial: 'Ex.: 120/80', circunferencia_cintura: 'Ex.: 84',
  gordura_corporal: 'Ex.: 28', massa_muscular: 'Ex.: 24', outro: 'Valor',
}

interface Entry {
  id: string
  metric: Metric
  label: string | null
  valueText: string
  unit: string | null
  measuredOn: string
  notes: string | null
}

function fmt(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MedidasPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [metric, setMetric] = useState<Metric>('peso')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('kg')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('body_metrics')
      .select('id, metric, label, value_text, unit, measured_on, notes')
      .eq('user_id', user.id).order('measured_on', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string, metric: (m.metric as Metric) ?? 'outro', label: (m.label as string) ?? null,
      valueText: (m.value_text as string) ?? '', unit: (m.unit as string) ?? null,
      measuredOn: m.measured_on as string, notes: (m.notes as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function chooseMetric(m: Metric) { setMetric(m); setUnit(DEFAULT_UNIT[m]) }
  function reset() { setMetric('peso'); setLabel(''); setValue(''); setUnit('kg'); setDate(''); setNotes(''); setErr(null) }

  async function save() {
    if (!user || saving || !value.trim() || !date) return
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('body_metrics').insert({
      user_id: user.id, metric, label: metric === 'outro' ? (label.trim() || 'Medida') : null,
      value_text: value.trim(), unit: unit.trim() || null, measured_on: date, notes: notes.trim() || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  async function remove(id: string) {
    if (busyId) return
    if (!window.confirm('Remover esta medida?')) return
    setBusyId(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('body_metrics').delete().eq('id', id)
    await load(); setBusyId(null)
  }

  const groups: Metric[] = ['peso', 'altura', 'pressao_arterial', 'circunferencia_cintura', 'gordura_corporal', 'massa_muscular', 'outro']

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard/saude" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Indicadores de Saúde
      </Link>

      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/saude" className="px-3.5 py-1.5 rounded-full bg-ivory border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors">Atual</Link>
        <span className="px-3.5 py-1.5 rounded-full gradient-sintera text-white font-body text-sm font-medium">Medidas</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-petal mb-2">
            <Activity size={16} />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Indicadores de Saúde</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Medidas</h1>
          <p className="font-body text-sm text-mauve mt-1">Acompanhe peso, altura, pressão e outras medidas ao longo do tempo. Registro seu — sem juízo clínico.</p>
        </div>
        <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
          className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar'}
        </button>
      </div>

      {showForm && (
        <div className="card-premium p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Medida</label>
              <select value={metric} onChange={e => chooseMetric(e.target.value as Metric)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="peso">Peso</option>
                <option value="altura">Altura</option>
                <option value="pressao_arterial">Pressão arterial</option>
                <option value="circunferencia_cintura">Circunferência (cintura)</option>
                <option value="gordura_corporal">Gordura corporal (bioimpedância)</option>
                <option value="massa_muscular">Massa muscular (bioimpedância)</option>
                <option value="outro">Outra medida</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {metric === 'outro' && (
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Nome da medida</label>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex.: Glicemia capilar"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Valor</label>
              <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[metric]}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Unidade</label>
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="kg, mmHg, cm…"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
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
            <button onClick={save} disabled={saving || !value.trim() || !date}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-premium p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="card-premium p-8 text-center"><p className="font-body text-sm text-mauve">Nenhuma medida registrada. Use <strong>Adicionar</strong>.</p></div>
      ) : (
        <div className="space-y-6">
          {groups.map(g => {
            const list = items.filter(i => i.metric === g)
            if (list.length === 0) return null
            return (
              <div key={g}>
                <p className="font-display text-base font-semibold text-onyx mb-2">{METRIC_LABEL[g]}</p>
                <div className="space-y-2">
                  {list.map(it => (
                    <div key={it.id} className="card-premium p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-body text-sm text-onyx">
                          {it.metric === 'outro' && it.label ? <span className="text-mauve/70">{it.label}: </span> : null}
                          <strong>{it.valueText}</strong>{it.unit ? ` ${it.unit}` : ''}
                        </p>
                        <p className="font-body text-[11px] text-mauve/60">{fmt(it.measuredOn)}{it.notes ? ` · ${it.notes}` : ''}</p>
                      </div>
                      <button onClick={() => remove(it.id)} disabled={busyId === it.id} title="Remover"
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/60 hover:text-red-500 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Registro factual das suas medidas. Não interpreta nem diagnostica — leve os dados ao seu profissional de saúde.
      </p>
    </div>
  )
}
