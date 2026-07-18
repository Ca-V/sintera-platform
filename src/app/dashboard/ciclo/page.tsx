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
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import ListCard from '@/components/ListCard'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/PageHeader'
// Taxonomia de métodos contraceptivos = SSOT em @/lib/cycle (compartilhada com o Relatório).
// CTC-001 (Opção A): contracepção hormonal é registrada/editada AQUI (SSOT); Medicamentos apenas projeta.
import {
  CONTRACEPTIVE_KINDS as KINDS, contraceptiveLabel as kindLabel,
  contraceptiveNature, defaultCadenceFor, CONTRACEPTIVE_CADENCES, cadenceUsageLabel, cadenceDays,
} from '@/lib/cycle'
// SSOT dos cálculos de data (fundadora 18/07): reutilizar sempre, nunca reimplementar.
import { addDays, addMonths, todayISO, daysBetween, nextOccurrenceByDays } from '@/lib/date'
import Disclaimer from '@/components/ui/Disclaimer'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Method {
  id: string; kind: string; brand: string | null; startedOn: string | null
  durationMonths: number | null; replaceOn: string | null; status: string
  reminderEnabled: boolean; reminderEventId: string | null; notes: string | null
  usageCadence: string | null   // CTC-001: cadência de recompra/reaplicação (hormonais)
}
interface Period { id: string; startedOn: string; notes: string | null }

// Cálculo de datas = SSOT `@/lib/date` (addDays/addMonths/todayISO/nextOccurrenceByDays). `fmt` é só EXIBIÇÃO.
function fmt(d: string | null): string {
  if (!d) return '—'
  return new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CicloPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [methods, setMethods] = useState<Method[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

  // Formulário de contracepção
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [kind, setKind] = useState('diu_hormonal')
  const [brand, setBrand] = useState('')
  const [startedOn, setStartedOn] = useState('')
  const [duration, setDuration] = useState<string>('60')
  const [cadence, setCadence] = useState<string>('')   // CTC-001: cadência de recompra/reaplicação (hormonais)
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
    const [mRes, pRes] = await Promise.all([
      db.from('contraceptive_methods').select('id, kind, brand, started_on, duration_months, replace_on, status, reminder_enabled, reminder_event_id, notes, usage_cadence').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('menstrual_periods').select('id, started_on, notes').eq('user_id', user.id).order('started_on', { ascending: false }).limit(24),
    ])
    setMethods(((mRes.data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string, kind: (m.kind as string) ?? 'outro', brand: (m.brand as string) ?? null,
      startedOn: (m.started_on as string) ?? null, durationMonths: (m.duration_months as number) ?? null,
      replaceOn: (m.replace_on as string) ?? null, status: (m.status as string) ?? 'ativo',
      reminderEnabled: m.reminder_enabled === true, reminderEventId: (m.reminder_event_id as string) ?? null, notes: (m.notes as string) ?? null,
      usageCadence: (m.usage_cadence as string) ?? null,
    })))
    setPeriods(((pRes.data ?? []) as Array<Record<string, unknown>>).map(p => ({
      id: p.id as string, startedOn: p.started_on as string, notes: (p.notes as string) ?? null,
    })))
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega dados na montagem (data fetching)
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function chooseKind(k: string) {
    setKind(k)
    // Hormonal → cadência de recompra/reaplicação (uso contínuo); dispositivo → vida útil (meses).
    if (contraceptiveNature(k) === 'hormonal') {
      setCadence(defaultCadenceFor(k) ?? 'mensal'); setDuration('')
    } else if (contraceptiveNature(k) === 'dispositivo') {
      const def = KINDS.find(x => x.value === k)?.months; setDuration(def != null ? String(def) : ''); setCadence('')
    } else {
      setDuration(''); setCadence('')
    }
  }
  function reset() { setEditingId(null); setKind('diu_hormonal'); setBrand(''); setStartedOn(''); setDuration('60'); setCadence(''); setReminder(true); setNotes(''); setErr(null) }

  function startEdit(m: Method) {
    setEditingId(m.id); setKind(m.kind); setBrand(m.brand ?? ''); setStartedOn(m.startedOn ?? '')
    setDuration(m.durationMonths != null ? String(m.durationMonths) : ''); setCadence(m.usageCadence ?? '')
    setReminder(m.reminderEnabled); setNotes(m.notes ?? '')
    setErr(null); setShowForm(true)
  }

  const formNature = contraceptiveNature(kind)
  // Dispositivo: troca prevista (início + vida útil). Hormonal: próxima recompra (início + cadência).
  const replacePreview = (formNature === 'dispositivo' && startedOn && duration)
    ? addMonths(startedOn, Number(duration)) : null
  const recompraPreview = (formNature === 'hormonal' && startedOn && cadence)
    ? nextOccurrenceByDays(startedOn, cadenceDays(cadence) ?? 30)
    : null

  async function saveMethod() {
    if (!user || saving) return
    setSaving(true); setErr(null)
    const nature = contraceptiveNature(kind)
    const isHormonal = nature === 'hormonal'
    // Dispositivo → vida útil em meses + próxima TROCA. Hormonal → cadência + próxima RECOMPRA/APLICAÇÃO.
    const months = !isHormonal && duration.trim() ? Math.round(Number(duration)) : null
    const cadValue = isHormonal ? (cadence || defaultCadenceFor(kind) || 'mensal') : null
    const cadDays = isHormonal ? (cadenceDays(cadValue) ?? 30) : null
    // Próxima data de ação: dispositivo = início + vida útil; hormonal = próxima recompra a partir do início
    // (ou de hoje, se sem início) — menor múltiplo da cadência estritamente após hoje.
    const replaceOn = isHormonal
      ? (cadDays ? nextOccurrenceByDays(startedOn || todayISO(), cadDays) : null)
      : (startedOn && months ? addMonths(startedOn, months) : null)
    const payload = {
      user_id: user.id, kind, brand: brand.trim() || null, started_on: startedOn || null,
      duration_months: months, replace_on: replaceOn, notes: notes.trim() || null,
      usage_cadence: cadValue, reminder_enabled: reminder && !!replaceOn,
    }
    const existing = editingId ? methods.find(m => m.id === editingId) : null
    const { data, error } = editingId
      ? await db.from('contraceptive_methods').update(payload).eq('id', editingId).select('id').single()
      : await db.from('contraceptive_methods').insert({ ...payload, status: 'ativo' }).select('id').single()
    if (error || !data) { setSaving(false); setErr(error?.message ?? 'Falha ao salvar.'); return }
    const methodId = data.id as string

    // Lembrete (nunca no passado). Reaproveita agenda_events. Dispositivo: ~30 dias antes da troca.
    // Hormonal: ~3 dias antes da próxima recompra/aplicação (uso contínuo). Recorrência plena = evolução futura.
    const leadDays = isHormonal ? 3 : 30
    const wantReminder = reminder && !!replaceOn
    const reminderDate = replaceOn ? (() => { const d = addDays(replaceOn, -leadDays); return d < todayISO() ? todayISO() : d })() : null
    const existingEvent = existing?.reminderEventId ?? null
    if (wantReminder && reminderDate) {
      const title = isHormonal ? `Recomprar/aplicar ${kindLabel(kind)}` : `Trocar ${kindLabel(kind)}`
      if (existingEvent) {
        await db.from('agenda_events').update({ title, event_date: reminderDate, status: 'pending', reminder_enabled: true, reminder_sent_at: null }).eq('id', existingEvent)
      } else {
        const { data: ev } = await db.from('agenda_events').insert({ user_id: user.id, event_type: 'medicacao', title, event_date: reminderDate, status: 'pending', reminder_enabled: true }).select('id').single()
        if (ev?.id) await db.from('contraceptive_methods').update({ reminder_event_id: ev.id }).eq('id', methodId)
      }
    } else if (existingEvent) {
      await db.from('agenda_events').delete().eq('id', existingEvent)
      await db.from('contraceptive_methods').update({ reminder_event_id: null }).eq('id', methodId)
    }
    setSaving(false); reset(); setShowForm(false); await load()
  }

  async function toggleStatus(m: Method) {
    if (busyId) return
    setBusyId(m.id)
    const next = m.status === 'ativo' ? 'encerrado' : 'ativo'
    await db.from('contraceptive_methods').update({ status: next }).eq('id', m.id)
    if (next === 'encerrado' && m.reminderEventId) {
      await db.from('agenda_events').delete().eq('id', m.reminderEventId)
      await db.from('contraceptive_methods').update({ reminder_event_id: null }).eq('id', m.id)
    }
    await load(); setBusyId(null)
  }

  function removeMethod(m: Method) {
    if (busyId) return
    setConfirm({ message: `Remover "${kindLabel(m.kind)}"?`, confirmLabel: 'Remover', onYes: async () => {
      setBusyId(m.id)
      if (m.reminderEventId) await db.from('agenda_events').delete().eq('id', m.reminderEventId)
      await db.from('contraceptive_methods').delete().eq('id', m.id)
      await load(); setBusyId(null)
    } })
  }

  async function addPeriod() {
    if (!user || savingPeriod) return
    const d = periodDate || todayISO()
    setSavingPeriod(true)
    await db.from('menstrual_periods').upsert({ user_id: user.id, started_on: d }, { onConflict: 'user_id,started_on' })
    setPeriodDate(''); setSavingPeriod(false); await load()
  }
  async function removePeriod(id: string) {
    if (busyId) return
    setBusyId(id)
    await db.from('menstrual_periods').delete().eq('id', id)
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

      <PageHeader icon={<Droplet size={16} />} eyebrow="Ciclo e Contracepção" title="Ciclo e Contracepção"
        subtitle={<>Acompanhe seu ciclo menstrual e seus métodos contraceptivos. A SINTERA organiza e lembra — não prescreve nem interpreta.</>} />

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
                {formNature === 'hormonal' ? (
                  // CTC-001 (Opção A): pílula/injeção/adesivo/anel são registrados AQUI (uso contínuo:
                  // início + cadência de recompra/reaplicação). Sem redirecionar para Medicamentos.
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="ciclo-inicio" className="font-body text-xs text-mauve block mb-1">Início do uso</label>
                      <input id="ciclo-inicio" type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                    </div>
                    <div>
                      <label htmlFor="ciclo-cadencia" className="font-body text-xs text-mauve block mb-1">Recompra / reaplicação</label>
                      <select id="ciclo-cadencia" value={cadence} onChange={e => setCadence(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                        {CONTRACEPTIVE_CADENCES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                ) : formNature === 'dispositivo' ? (
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
                ) : (
                  <div>
                    <label htmlFor="ciclo-inicio" className="font-body text-xs text-mauve block mb-1">Início (opcional)</label>
                    <input id="ciclo-inicio" type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                  </div>
                )}
                {formNature === 'hormonal' && (
                  <p className="font-body text-[11px] text-mauve">Aparece também em <Link href="/dashboard/medicamentos" className="text-petal hover:underline">Medicamentos</Link> como &quot;em uso&quot; (só leitura) — este é o local de edição.</p>
                )}
                {replacePreview && (
                  <p className="font-body text-[11px] text-petal">Troca prevista: <strong>{fmt(replacePreview)}</strong> (segundo a vida útil informada).</p>
                )}
                {recompraPreview && (
                  <p className="font-body text-[11px] text-petal">Próxima recompra/aplicação: <strong>{fmt(recompraPreview)}</strong>.</p>
                )}
                {formNature !== 'outro' && (
                  <label className="flex items-center gap-2 font-body text-sm text-onyx cursor-pointer">
                    <input type="checkbox" checked={reminder} onChange={e => setReminder(e.target.checked)} className="accent-petal w-4 h-4" />
                    <Bell size={13} className="text-petal" /> {formNature === 'hormonal' ? 'Lembrar da recompra/aplicação (~3 dias antes)' : 'Lembrar da troca (~30 dias antes)'}
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
                  const hormonal = contraceptiveNature(m.kind) === 'hormonal'
                  const meta = [m.startedOn ? `desde ${fmt(m.startedOn)}` : null,
                    hormonal ? (cadenceUsageLabel(m.usageCadence) || null) : null,
                    m.replaceOn && m.status === 'ativo' ? `${hormonal ? 'recompra' : 'troca'} ~${fmt(m.replaceOn)}` : null,
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
