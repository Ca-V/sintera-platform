'use client'

// ============================================================
// Sinais vitais — série temporal autorrelatada (dentro de Histórico)
// ============================================================
// Pressão arterial, frequência cardíaca, glicemia, saturação, temperatura.
// Registro factual da própria pessoa para acompanhar no tempo e levar ao
// profissional. Sem juízo clínico. Reaproveita a tabela body_metrics.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, X, HeartPulse, ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import Sparkline, { parseNum } from '@/components/Sparkline'
import ListCard from '@/components/ListCard'

type Vital = 'pressao_arterial' | 'frequencia_cardiaca' | 'glicemia' | 'saturacao' | 'temperatura' | 'outro_sinal'

const VITAL_LABEL: Record<Vital, string> = {
  pressao_arterial: 'Pressão arterial', frequencia_cardiaca: 'Frequência cardíaca',
  glicemia: 'Glicemia', saturacao: 'Saturação (SpO₂)', temperatura: 'Temperatura', outro_sinal: 'Outro sinal',
}
const DEFAULT_UNIT: Record<Vital, string> = {
  pressao_arterial: 'mmHg', frequencia_cardiaca: 'bpm', glicemia: 'mg/dL',
  saturacao: '%', temperatura: '°C', outro_sinal: '',
}
const PLACEHOLDER: Record<Vital, string> = {
  pressao_arterial: 'Ex.: 120/80', frequencia_cardiaca: 'Ex.: 72', glicemia: 'Ex.: 95',
  saturacao: 'Ex.: 98', temperatura: 'Ex.: 36,5', outro_sinal: 'Valor',
}

interface Entry {
  id: string
  metric: Vital
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

export default function SinaisVitaisPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [metric, setMetric] = useState<Vital>('pressao_arterial')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('mmHg')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const VITALS: Vital[] = ['pressao_arterial', 'frequencia_cardiaca', 'glicemia', 'saturacao', 'temperatura', 'outro_sinal']

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('body_metrics')
      .select('id, metric, label, value_text, unit, measured_on, notes')
      .eq('user_id', user.id).in('metric', VITALS).order('measured_on', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string, metric: (m.metric as Vital) ?? 'outro_sinal', label: (m.label as string) ?? null,
      valueText: (m.value_text as string) ?? '', unit: (m.unit as string) ?? null,
      measuredOn: m.measured_on as string, notes: (m.notes as string) ?? null,
    })))
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- VITALS é constante do módulo; não precisa nas deps
  }, [user, supabase])

  // Carrega na montagem (e após mutações); o setLoading(true) síncrono — o spinner —
  // é intencional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function chooseMetric(m: Vital) { setMetric(m); setUnit(DEFAULT_UNIT[m]) }
  function reset() { setMetric('pressao_arterial'); setLabel(''); setValue(''); setUnit('mmHg'); setDate(''); setNotes(''); setErr(null) }

  async function save() {
    if (!user || saving || !value.trim() || !date) return
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('body_metrics').insert({
      user_id: user.id, metric, label: metric === 'outro_sinal' ? (label.trim() || 'Sinal') : null,
      value_text: value.trim(), unit: unit.trim() || null, measured_on: date, notes: notes.trim() || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  async function remove(id: string) {
    if (busyId) return
    if (!window.confirm('Remover este registro?')) return
    setBusyId(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('body_metrics').delete().eq('id', id)
    await load(); setBusyId(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard/saude" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Histórico
      </Link>

      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/saude" className="px-3.5 py-1.5 rounded-full bg-ivory border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors">Atual</Link>
        <Link href="/dashboard/medidas" className="px-3.5 py-1.5 rounded-full bg-ivory border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors">Medidas</Link>
        <span className="px-3.5 py-1.5 rounded-full gradient-sintera text-white font-body text-sm font-medium">Sinais vitais</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-petal mb-2">
            <HeartPulse size={16} />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Histórico</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Sinais vitais</h1>
          <p className="font-body text-sm text-mauve mt-1">Acompanhe pressão arterial, frequência cardíaca, glicemia e outros ao longo do tempo. Registro seu — sem juízo clínico.</p>
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
              <label className="font-body text-xs text-mauve/70 block mb-1">Sinal vital</label>
              <select value={metric} onChange={e => chooseMetric(e.target.value as Vital)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="pressao_arterial">Pressão arterial</option>
                <option value="frequencia_cardiaca">Frequência cardíaca</option>
                <option value="glicemia">Glicemia</option>
                <option value="saturacao">Saturação (SpO₂)</option>
                <option value="temperatura">Temperatura</option>
                <option value="outro_sinal">Outro sinal</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Data</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {metric === 'outro_sinal' && (
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Nome do sinal</label>
              <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex.: Saturação em exercício"
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
              <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="mmHg, bpm, mg/dL…"
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
        <div className="card-premium p-8 text-center"><p className="font-body text-sm text-mauve">Nenhum sinal vital registrado. Use <strong>Adicionar</strong>.</p></div>
      ) : (
        <div className="space-y-6">
          {VITALS.map(g => {
            const list = items.filter(i => i.metric === g)
            if (list.length === 0) return null
            // Série cronológica (lista vem do mais recente; invertemos para o gráfico).
            // Em pressão arterial, parseNum usa o primeiro número (sistólica).
            const serie = [...list].reverse().map(it => parseNum(it.valueText)).filter((v): v is number => v !== null)
            return (
              <div key={g}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-display text-base font-semibold text-onyx">{VITAL_LABEL[g]}</p>
                  {serie.length >= 2 && (
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[10px] text-mauve/50">{list.length} registros</span>
                      <Sparkline values={serie} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {list.map(it => (
                    <ListCard key={it.id}
                      title={`${it.metric === 'outro_sinal' && it.label ? `${it.label}: ` : ''}${it.valueText}${it.unit ? ` ${it.unit}` : ''}`}
                      meta={`${fmt(it.measuredOn)}${it.notes ? ` · ${it.notes}` : ''}`}
                      actions={
                        <button onClick={() => remove(it.id)} disabled={busyId === it.id} title="Remover"
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40">
                          <Trash2 size={12} />
                        </button>
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Registro factual dos seus sinais vitais. Não interpreta nem diagnostica — leve os dados ao seu profissional de saúde.
      </p>
    </div>
  )
}
