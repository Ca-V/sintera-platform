'use client'

// ============================================================
// Ciclo menstrual e Contracepção
// ============================================================
// Registro factual autorrelatado. Contracepção: dispositivo/método (DIU,
// Mirena, implante…) com vida útil e data de troca + lembrete. Ciclo menstrual:
// datas de início da menstruação, com duração média e previsão calculadas dos
// próprios dados. A SINTERA NÃO prescreve nem interpreta — só organiza e lembra.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, X, ArrowLeft, Trash2, Pencil, Droplet, ShieldCheck, Bell } from 'lucide-react'
import { useUser } from '@/context/UserContext'
import ListCard from '@/components/ListCard'
import Card from '@/components/ui/Card'
// Taxonomia de métodos contraceptivos = SSOT em @/lib/cycle (compartilhada com o Relatório).
import { CONTRACEPTIVE_KINDS as KINDS, contraceptiveLabel as kindLabel } from '@/lib/cycle'
import Disclaimer from '@/components/ui/Disclaimer'
import type { ContraceptiveMethod as Method, Period } from '@/lib/ciclo/service'

function fmt(d: string | null): string {
  if (!d) return '—'
  return new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function addMonths(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10)
}
function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10)
}
const todayISO = () => new Date().toISOString().slice(0, 10)
function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000)
}

export default function CicloPage() {
  const { user, loading: authLoading } = useUser()
  const [methods, setMethods] = useState<Method[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  // Formulário de contracepção
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [kind, setKind] = useState('diu_hormonal')
  const [brand, setBrand] = useState('')
  const [startedOn, setStartedOn] = useState('')
  const [duration, setDuration] = useState<string>('60')
  const [reminder, setReminder] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Ciclo menstrual
  const [periodDate, setPeriodDate] = useState('')
  const [savingPeriod, setSavingPeriod] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const res = await fetch('/api/ciclo')
    const data = res.ok ? await res.json() : { methods: [], periods: [] }
    setMethods((data.methods ?? []) as Method[])
    setPeriods(((data.periods ?? []) as Period[]).slice(0, 24))
    setLoading(false)
  }, [user])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega dados na montagem (data fetching)
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function chooseKind(k: string) {
    setKind(k)
    const def = KINDS.find(x => x.value === k)?.months
    setDuration(def != null ? String(def) : '')
  }
  function reset() { setEditingId(null); setKind('diu_hormonal'); setBrand(''); setStartedOn(''); setDuration('60'); setReminder(true); setNotes(''); setErr(null) }

  function startEdit(m: Method) {
    setEditingId(m.id); setKind(m.kind); setBrand(m.brand ?? ''); setStartedOn(m.startedOn ?? '')
    setDuration(m.durationMonths != null ? String(m.durationMonths) : ''); setReminder(m.reminderEnabled); setNotes(m.notes ?? '')
    setErr(null); setShowForm(true)
  }

  const replacePreview = (startedOn && duration && kind !== 'pilula' && kind !== 'outro')
    ? addMonths(startedOn, Number(duration)) : null

  async function saveMethod() {
    if (!user || saving) return
    setSaving(true); setErr(null)
    const res = await fetch('/api/ciclo/methods', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId, kind, brand, startedOn,
        durationMonths: duration.trim() ? Number(duration) : null, reminder, notes,
      }),
    })
    setSaving(false)
    if (!res.ok) { const e = await res.json().catch(() => ({})); setErr((e.error as string) ?? 'Falha ao salvar.'); return }
    reset(); setShowForm(false); await load()
  }

  async function toggleStatus(m: Method) {
    if (busyId) return
    setBusyId(m.id)
    const next: Method['status'] = m.status === 'ativo' ? 'encerrado' : 'ativo'
    await fetch('/api/ciclo/methods', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, status: next }) })
    await load(); setBusyId(null)
  }

  async function removeMethod(m: Method) {
    if (busyId) return
    if (!window.confirm(`Remover "${kindLabel(m.kind)}"?`)) return
    setBusyId(m.id)
    await fetch(`/api/ciclo/methods?id=${encodeURIComponent(m.id)}`, { method: 'DELETE' })
    await load(); setBusyId(null)
  }

  async function addPeriod() {
    if (!user || savingPeriod) return
    setSavingPeriod(true)
    await fetch('/api/ciclo/periods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startedOn: periodDate }) })
    setPeriodDate(''); setSavingPeriod(false); await load()
  }
  async function removePeriod(id: string) {
    if (busyId) return
    setBusyId(id)
    await fetch(`/api/ciclo/periods?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    await load(); setBusyId(null)
  }

  // Cálculos do ciclo (factuais) — duração média e previsão da próxima.
  const cycleStats = (() => {
    if (periods.length < 2) return { avg: null as number | null, next: null as string | null, last: periods[0]?.startedOn ?? null }
    const sorted = [...periods].map(p => p.startedOn).sort()
    const gaps: number[] = []
    for (let i = 1; i < sorted.length; i++) gaps.push(daysBetween(sorted[i - 1], sorted[i]))
    const recent = gaps.slice(-6)
    const avg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
    const last = sorted[sorted.length - 1]
    return { avg, next: addDays(last, avg), last }
  })()

  const activeMethods = methods.filter(m => m.status === 'ativo')
  const pastMethods = methods.filter(m => m.status === 'encerrado')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <div>
        <div className="inline-flex items-center gap-1.5 text-petal mb-2">
          <Droplet size={16} />
          <span className="font-body text-xs font-medium uppercase tracking-wider">Ciclo e Contracepção</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-onyx">Ciclo e Contracepção</h1>
        <p className="font-body text-sm text-mauve mt-1">Acompanhe seu ciclo menstrual e seus métodos contraceptivos. A SINTERA organiza e lembra — não prescreve nem interpreta.</p>
      </div>

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : (
        <>
          {/* ───────── Contracepção ───────── */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-petal" />
                <p className="font-display text-base font-semibold text-onyx">Contracepção</p>
              </div>
              <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-sintera text-white font-body text-xs font-medium hover:opacity-90 transition-opacity">
                {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? 'Fechar' : 'Adicionar'}
              </button>
            </div>

            {showForm && (
              <Card padding="sm" className="space-y-3 mb-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ciclo-metodo" className="font-body text-xs text-mauve block mb-1">Método</label>
                    <select id="ciclo-metodo" value={kind} onChange={e => chooseKind(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                      {KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ciclo-marca" className="font-body text-xs text-mauve block mb-1">Marca (opcional)</label>
                    <input id="ciclo-marca" type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex.: Mirena"
                      className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                  </div>
                </div>
                {kind === 'pilula' ? (
                  <p className="font-body text-[11px] text-mauve">Para pílula, registre dose, frequência e recompra em <Link href="/dashboard/medicamentos" className="text-petal hover:underline">Medicamentos e Suplementos</Link>.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ciclo-inicio" className="font-body text-xs text-mauve block mb-1">Início / colocação</label>
                      <input id="ciclo-inicio" type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                    </div>
                    <div>
                      <label htmlFor="ciclo-vida-util" className="font-body text-xs text-mauve block mb-1">Vida útil (meses)</label>
                      <input id="ciclo-vida-util" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ex.: 60"
                        className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                    </div>
                  </div>
                )}
                {replacePreview && (
                  <p className="font-body text-[11px] text-petal">Troca prevista: <strong>{fmt(replacePreview)}</strong> (segundo a vida útil informada).</p>
                )}
                {kind !== 'pilula' && (
                  <label className="flex items-center gap-2 font-body text-sm text-onyx cursor-pointer">
                    <input type="checkbox" checked={reminder} onChange={e => setReminder(e.target.checked)} className="accent-petal w-4 h-4" />
                    <Bell size={13} className="text-petal" /> Lembrar da troca (~30 dias antes)
                  </label>
                )}
                <div>
                  <label htmlFor="ciclo-notas" className="font-body text-xs text-mauve block mb-1">Observações (opcional)</label>
                  <textarea id="ciclo-notas" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                </div>
                {err && <p className="font-body text-xs text-red-500">{err}</p>}
                <div className="flex justify-end">
                  <button onClick={saveMethod} disabled={saving}
                    className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
                    {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Salvar'}
                  </button>
                </div>
              </Card>
            )}

            {activeMethods.length === 0 && pastMethods.length === 0 ? (
              <p className="font-body text-sm text-mauve">Nenhum método registrado.</p>
            ) : (
              <div className="space-y-2">
                {[...activeMethods, ...pastMethods].map(m => {
                  const meta = [m.startedOn ? `desde ${fmt(m.startedOn)}` : null,
                    m.replaceOn && m.status === 'ativo' ? `troca ~${fmt(m.replaceOn)}` : null,
                    m.reminderEnabled && m.status === 'ativo' ? 'lembrete ✓' : null,
                    m.notes || null].filter(Boolean).join(' · ')
                  return (
                    <ListCard key={m.id}
                      dim={m.status === 'encerrado'}
                      title={`${kindLabel(m.kind)}${m.brand ? ` · ${m.brand}` : ''}${m.status === 'encerrado' ? ' · encerrado' : ''}`}
                      meta={meta || undefined}
                      chips={
                        <button onClick={() => toggleStatus(m)} disabled={busyId === m.id}
                          className="font-body text-[11px] text-petal hover:underline disabled:opacity-40">
                          {m.status === 'ativo' ? 'Marcar como encerrado' : 'Reativar'}
                        </button>
                      }
                      actions={
                        <>
                          <button onClick={() => startEdit(m)} title="Editar"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-petal hover:bg-blush transition-colors"><Pencil size={12} /></button>
                          <button onClick={() => removeMethod(m)} disabled={busyId === m.id} title="Remover"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"><Trash2 size={12} /></button>
                        </>
                      }
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* ───────── Ciclo menstrual ───────── */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Droplet size={16} className="text-petal" />
              <p className="font-display text-base font-semibold text-onyx">Ciclo menstrual</p>
            </div>

            {periods.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Card padding="sm" className="text-center">
                  <p className="font-display text-lg font-bold text-onyx leading-none">{cycleStats.last ? fmt(cycleStats.last) : '—'}</p>
                  <p className="font-body text-[11px] text-mauve mt-1">Última menstruação</p>
                </Card>
                <Card padding="sm" className="text-center">
                  <p className="font-display text-lg font-bold text-onyx leading-none">{cycleStats.avg != null ? `${cycleStats.avg} d` : '—'}</p>
                  <p className="font-body text-[11px] text-mauve mt-1">Ciclo médio</p>
                </Card>
                <Card padding="sm" className="text-center">
                  <p className="font-display text-lg font-bold text-onyx leading-none">{cycleStats.next ? fmt(cycleStats.next) : '—'}</p>
                  <p className="font-body text-[11px] text-mauve mt-1">Próxima (estimada)</p>
                </Card>
              </div>
            )}

            <div className="flex items-end gap-2 mb-3">
              <div className="flex-1">
                <label htmlFor="ciclo-menstruacao" className="font-body text-xs text-mauve block mb-1">Início da menstruação</label>
                <input id="ciclo-menstruacao" type="date" value={periodDate} onChange={e => setPeriodDate(e.target.value)} max={todayISO()}
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              </div>
              <button onClick={addPeriod} disabled={savingPeriod}
                className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
                {savingPeriod ? '…' : 'Registrar'}
              </button>
            </div>

            {periods.length === 0 ? (
              <p className="font-body text-sm text-mauve">Nenhuma menstruação registrada. Registre o início para acompanhar o ciclo.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {periods.map(p => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-blush/40 border border-petal/20 pl-3 pr-1.5 py-1 font-body text-xs text-onyx">
                    {fmt(p.startedOn)}
                    <button onClick={() => removePeriod(p.id)} disabled={busyId === p.id} className="text-mauve hover:text-red-500"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
            <Disclaimer variant="ciclo" className="mt-3" />
          </div>
        </>
      )}
    </div>
  )
}
