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
import { Loader2, Plus, X, Trash2, ArrowLeft, HeartPulse, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import Sparkline, { parseNum } from '@/components/Sparkline'
import ListCard from '@/components/ListCard'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import Card from '@/components/ui/Card'
import Disclaimer from '@/components/ui/Disclaimer'
import ConfirmDialog from '@/components/ConfirmDialog'

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
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

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

  function remove(id: string) {
    if (busyId) return
    setConfirm({ message: 'Remover este registro?', confirmLabel: 'Remover', onYes: async () => {
      setBusyId(id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('body_metrics').delete().eq('id', id)
      await load(); setBusyId(null)
    } })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <PageHeader
        icon={<HeartPulse size={16} />}
        eyebrow="Monitoramento"
        title="Monitoramento"
        subtitle={<>Acompanhe sinais vitais, atividade, sono e outros indicadores — manuais e, em breve, de dispositivos — ao longo do tempo.</>}
        action={
          <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
            className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar'}
          </button>
        }
      />

      <Link href="/dashboard/conexoes"
        className="flex items-center justify-between gap-3 rounded-2xl border border-petal-light bg-blush/50 px-4 py-3 hover:bg-blush transition-colors group">
        <span className="inline-flex items-center gap-2.5 min-w-0">
          <Link2 size={16} className="text-petal flex-shrink-0" />
          <span className="font-body text-sm text-onyx">Conecte um dispositivo e deixe os dados entrarem sozinhos</span>
        </span>
        <span className="font-body text-xs text-petal font-medium flex-shrink-0 group-hover:underline">Conexões →</span>
      </Link>

      {showForm && (
        <Card padding="md" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vital-metric" className="font-body text-xs text-mauve block mb-1">Sinal vital</label>
              <select id="vital-metric" value={metric} onChange={e => chooseMetric(e.target.value as Vital)}
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
              <label htmlFor="vital-date" className="font-body text-xs text-mauve block mb-1">Data</label>
              <input id="vital-date" type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {metric === 'outro_sinal' && (
            <div>
              <label htmlFor="vital-label" className="font-body text-xs text-mauve block mb-1">Nome do sinal</label>
              <input id="vital-label" type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex.: Saturação em exercício"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vital-value" className="font-body text-xs text-mauve block mb-1">Valor</label>
              <input id="vital-value" type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[metric]}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label htmlFor="vital-unit" className="font-body text-xs text-mauve block mb-1">Unidade</label>
              <input id="vital-unit" type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="mmHg, bpm, mg/dL…"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div>
            <label htmlFor="vital-notes" className="font-body text-xs text-mauve block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea id="vital-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
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
        </Card>
      )}

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length === 0 ? (
        <EmptyState icon={<HeartPulse size={28} className="text-petal" />} title="Nenhum sinal vital ainda"
          message={<>Registre um sinal vital. Use <strong>Adicionar</strong>.</>} />
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
                      <span className="font-body text-[11px] text-mauve">{list.length} registros</span>
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
