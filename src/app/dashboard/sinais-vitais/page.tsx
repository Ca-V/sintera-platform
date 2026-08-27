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
import { Loader2, Plus, X, Trash2, Pencil, ArrowLeft, HeartPulse, Link2, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import Sparkline, { parseNum } from '@/components/Sparkline'
import ListCard from '@/components/ListCard'
import PageHeader from '@/components/PageHeader'
// PARIDADE — o texto desta tela vem do core; a Web e o Mobile prometiam coisas diferentes aqui.
import {
  SCREEN_COPY, hasTimeOfDay, measurementInstant, measurementMeta, requiresTimeOfDay,
  VITAL_SIGNS, ACTIVITY_TYPES, activityTypeLabel, activitySummary,
  durationSecondsFromMinutes, distanceMetersFromKm, numberFromField, paceKindFor, bloodPressureHint,
} from '@sintera/core'
import type { ActivitySessionDTO } from '@sintera/api-client'
import { listActivitySessions, saveActivitySession, deleteActivitySession, saveBodyMetric } from '@sintera/api-client'
import EmptyState from '@/components/EmptyState'
import { Card } from "@/lib/ui/ds"
import Disclaimer from '@/components/ui/Disclaimer'
import Select from '@/components/ui/Select'
import ConfirmDialog from '@/components/ConfirmDialog'
import { useNovelty } from '@/lib/novelty/useNovelty'

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

// PARIDADE — todo texto visível vem do core, para que a Web e o Mobile digam a MESMA coisa (o Mobile já faz isso).
const C = SCREEN_COPY.monitoramento

interface Entry {
  id: string
  metric: Vital
  label: string | null
  valueText: string
  unit: string | null
  measuredOn: string
  measuredAt: string | null
  /** De onde o ponto nasceu. Sempre exibido: procedência é requisito, não enfeite (HIP-014 §4). */
  source: string | null
  notes: string | null
}

function fmt(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Data e — quando registrada — HORA da medição (HIP-014 §2). Duas leituras do mesmo dia só se distinguem pela
 * hora; é o que torna o diário de pressão legível. `hasTimeOfDay` vem do core para que o Mobile decida igual.
 */
function fmtMeasured(measuredOn: string, measuredAt: string | null): string {
  if (!hasTimeOfDay(measuredAt)) return fmt(measuredOn)
  const d = new Date(measuredAt as string)
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} · ${hora}`
}

/** Linha de contexto do ponto — a ordem e o separador vêm do core, para que o Mobile componha igual. */
function metaOf(it: Entry): string {
  return measurementMeta({ when: fmtMeasured(it.measuredOn, it.measuredAt), source: it.source, notes: it.notes })
}

/** Data + hora locais → instante UTC. Sem hora, delega ao core (âncora do dia = "hora não registrada"). */
function instantOf(date: string, time: string): string | null {
  if (!time) return measurementInstant(null, date)
  const d = new Date(`${date}T${time}:00`)   // interpretado no fuso de quem registra
  return Number.isNaN(d.getTime()) ? measurementInstant(null, date) : d.toISOString()
}

export default function SinaisVitaisPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

  const [showForm, setShowForm] = useState(false)
  /** Registro sendo corrigido. `null` = novo. */
  const [editando, setEditando] = useState<Entry | null>(null)
  const [metric, setMetric] = useState<Vital>('pressao_arterial')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('mmHg')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  // Atividade física (HIP-014 §3) — seção IRMÃ dos sinais vitais. FATO observado, com proveniência.
  const [acts, setActs] = useState<ActivitySessionDTO[]>([])
  const [showActForm, setShowActForm] = useState(false)
  const [actType, setActType] = useState<string>('caminhada')
  const [actName, setActName] = useState('')
  const [actDate, setActDate] = useState('')
  const [actTime, setActTime] = useState('')
  const [actMin, setActMin] = useState('')
  const [actKm, setActKm] = useState('')
  const [actBpm, setActBpm] = useState('')
  const [actKcal, setActKcal] = useState('')
  const [savingAct, setSavingAct] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const VITALS: Vital[] = ['pressao_arterial', 'frequencia_cardiaca', 'glicemia', 'saturacao', 'temperatura', 'outro_sinal']

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('body_metrics')
      .select('id, metric, label, value_text, unit, measured_on, measured_at, source, notes')
      .eq('user_id', user.id).in('metric', VITALS)
      .order('measured_at', { ascending: false, nullsFirst: false })
      .order('measured_on', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string, metric: (m.metric as Vital) ?? 'outro_sinal', label: (m.label as string) ?? null,
      valueText: (m.value_text as string) ?? '', unit: (m.unit as string) ?? null,
      measuredOn: m.measured_on as string, measuredAt: (m.measured_at as string) ?? null,
      source: (m.source as string) ?? null, notes: (m.notes as string) ?? null,
    })))
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- VITALS é constante do módulo; não precisa nas deps
  }, [user, supabase])

  // Carrega na montagem (e após mutações); o setLoading(true) síncrono — o spinner —
  // é intencional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  // NOV-001 — ao abrir o Monitoramento, sincroniza sozinho as fontes conectadas e recarrega os dados. O AVISO de
  // novidade fica no Painel Inicial (superfície de resumo); aqui o módulo apenas exibe seu próprio conteúdo.
  useNovelty(() => load())

  function chooseMetric(m: Vital) { setMetric(m); setUnit(DEFAULT_UNIT[m]) }
  function reset() { setEditando(null); setMetric('pressao_arterial'); setLabel(''); setValue(''); setUnit('mmHg'); setDate(''); setTime(''); setNotes(''); setErr(null) }

  /**
   * Abre o formulário com a medição já registrada, para CORRIGIR (defeito da homologação de 27/08: o cartão
   * só oferecia remover). Quem digitou um dígito errado precisaria apagar e refazer, perdendo hora, origem e
   * observação junto. MESMA capacidade e MESMO caminho do aplicativo.
   */
  function startEdit(it: Entry) {
    setEditando(it)
    setMetric(it.metric as Vital)
    setLabel(it.label ?? '')
    setValue(it.valueText ?? '')
    setUnit(it.unit ?? DEFAULT_UNIT[it.metric as Vital] ?? '')
    setDate(it.measuredOn ?? '')
    // Hora só quando REGISTRADA — a âncora de meia-noite marca "não informada", e reexibi-la como 00:00
    // faria a correção inventar um horário que ninguém digitou.
    setTime(hasTimeOfDay(it.measuredAt) ? new Date(it.measuredAt as string).toTimeString().slice(0, 5) : '')
    setNotes(it.notes ?? '')
    setErr(null)
    setShowForm(true)
  }

  async function save() {
    if (!user || saving || !value.trim() || !date) return
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('body_metrics').insert({
      user_id: user.id, metric, label: metric === 'outro_sinal' ? (label.trim() || 'Sinal') : null,
      value_text: value.trim(), unit: unit.trim() || null, measured_on: date,
      measured_at: instantOf(date, time), notes: notes.trim() || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  const loadActs = useCallback(async () => {
    if (!user) return
    // Reusa a MESMA consulta do Mobile (SSOT) — a Web não reescreve a query.
    try { setActs(await listActivitySessions(supabase)) } catch { /* seção degrada vazia; não derruba a tela */ }
  }, [user, supabase])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) loadActs() }, [authLoading, loadActs])

  function resetAct() {
    setActType('caminhada'); setActName(''); setActDate(''); setActTime(''); setActMin(''); setActKm('')
  }

  async function saveAct() {
    if (!user || savingAct || !actDate) return
    setSavingAct(true); setErr(null)
    // Conversão de unidade vem do core: campo vazio vira AUSENTE, nunca zero, e as duas telas convertem igual.
    const { error } = await saveActivitySession(supabase, {
      source: 'manual',
      activity_type: actType,
      title: actName.trim() || null,
      started_at: instantOf(actDate, actTime) ?? `${actDate}T00:00:00.000Z`,
      duration_s: durationSecondsFromMinutes(actMin),
      distance_m: distanceMetersFromKm(actKm),
    })
    setSavingAct(false)
    if (error) { setErr(error.message); return }
    resetAct(); setShowActForm(false); await loadActs()
  }

  function removeAct(id: string) {
    setConfirm({ message: 'Remover esta atividade?', confirmLabel: C.removeAction, onYes: async () => {
      await deleteActivitySession(supabase, id)
      await loadActs()
    } })
  }

  function remove(id: string) {
    if (busyId) return
    setConfirm({ message: 'Remover este registro?', confirmLabel: C.removeAction, onYes: async () => {
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
        title={C.title}
        subtitle={C.subtitle}
        action={
          <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
            className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? C.close : C.add}
          </button>
        }
      />

      <Link href="/dashboard/conexoes"
        className="flex items-center justify-between gap-3 rounded-2xl border border-petal-light bg-blush/50 px-4 py-3 hover:bg-blush transition-colors group">
        <span className="inline-flex items-center gap-2.5 min-w-0">
          <Link2 size={16} className="text-petal flex-shrink-0" />
          <span className="font-body text-sm text-onyx">{C.connectInvite}</span>
        </span>
        <span className="font-body text-xs text-petal font-medium flex-shrink-0 group-hover:underline">{C.connectAction} →</span>
      </Link>

      {showForm && (
        <Card padding="relaxed" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve block mb-1">{C.fieldVital}</label>
              <Select
                aria-label={C.fieldVital}
                value={metric}
                onChange={(v) => chooseMetric(v as Vital)}
                // Catálogo do core (VITAL_SIGNS) — estava duplicado aqui, e uma lista repetida é uma lista que
                // um dia diverge. O Mobile já lia do core.
                options={VITAL_SIGNS.map(v => ({ value: v.value, label: v.label }))}
              />
            </div>
            <div>
              <label htmlFor="vital-date" className="font-body text-xs text-mauve block mb-1">{C.fieldDate}</label>
              <input id="vital-date" type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {/* HIP-014 §2 — a hora distingue duas medições do mesmo dia. Sem ela o diário de pressão que o médico
              pede ("de manhã e à noite") vira duas linhas iguais. Opcional: quem não informa não é obstruído. */}
          {requiresTimeOfDay(metric) && (
            <div className="sm:w-1/2">
              <label htmlFor="vital-time" className="font-body text-xs text-mauve block mb-1">{C.fieldTime}</label>
              <input id="vital-time" type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <p className="font-body text-xs text-mauve/70 mt-1">{C.fieldTimeHint}</p>
            </div>
          )}
          {metric === 'outro_sinal' && (
            <div>
              <label htmlFor="vital-label" className="font-body text-xs text-mauve block mb-1">Nome do sinal</label>
              <input id="vital-label" type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex.: Saturação em exercício"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vital-value" className="font-body text-xs text-mauve block mb-1">{C.fieldValue}</label>
              <input id="vital-value" type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[metric]}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              {/* "12/8" é como se fala. A dica NOTA e PERGUNTA — não converte nem impede salvar. */}
              {metric === 'pressao_arterial' && bloodPressureHint(value) && (
                <p className="mt-1 font-body text-xs text-amber-700">{bloodPressureHint(value)}</p>
              )}
            </div>
            <div>
              <label htmlFor="vital-unit" className="font-body text-xs text-mauve block mb-1">{C.fieldUnit}</label>
              <input id="vital-unit" type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="mmHg, bpm, mg/dL…"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div>
            <label htmlFor="vital-notes" className="font-body text-xs text-mauve block mb-1">{C.fieldNotes}</label>
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
              {saving ? 'Salvando…' : C.save}
            </button>
          </div>
        </Card>
      )}

      <p className="font-display text-lg font-semibold text-onyx pt-2">{C.vitalsSection}</p>

      {loading ? (
        <Card padding="none" className="p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length === 0 ? (
        <EmptyState icon={<HeartPulse size={28} className="text-petal" />} title={C.emptyTitle}
          message={C.emptyMessage} />
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
                      meta={metaOf(it)}
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

      {/* ATIVIDADE FÍSICA (HIP-014 §3) — seção irmã. FATO observado: registra o que aconteceu, sem avaliar
          desempenho (RDC 657). Origem sempre visível, como nos sinais vitais. */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <p className="font-display text-lg font-semibold text-onyx">{C.activitySection}</p>
        <button onClick={() => (showActForm ? (resetAct(), setShowActForm(false)) : (resetAct(), setShowActForm(true)))}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-petal text-petal font-body text-sm font-medium hover:bg-blush transition-colors flex-shrink-0">
          {showActForm ? <X size={15} /> : <Plus size={15} />} {showActForm ? C.close : C.activityAdd}
        </button>
      </div>

      {showActForm && (
        <Card padding="relaxed" className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve block mb-1">{C.fieldActivityType}</label>
              <Select value={actType} onChange={setActType} aria-label={C.fieldActivityType}
                options={ACTIVITY_TYPES.map(a => ({ value: a.value, label: a.label }))} />
            </div>
            <div>
              <label htmlFor="act-name" className="font-body text-xs text-mauve block mb-1">{C.fieldActivityName}</label>
              <input id="act-name" type="text" value={actName} onChange={e => setActName(e.target.value)} placeholder="Ex.: Corrida no parque"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="act-date" className="font-body text-xs text-mauve block mb-1">{C.fieldStartDate}</label>
              <input id="act-date" type="date" value={actDate} onChange={e => setActDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label htmlFor="act-time" className="font-body text-xs text-mauve block mb-1">{C.fieldStartTime}</label>
              <input id="act-time" type="time" value={actTime} onChange={e => setActTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="act-min" className="font-body text-xs text-mauve block mb-1">{C.fieldDurationMin}</label>
              <input id="act-min" type="text" inputMode="decimal" value={actMin} onChange={e => setActMin(e.target.value)} placeholder="Ex.: 45"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label htmlFor="act-km" className="font-body text-xs text-mauve block mb-1">{C.fieldDistanceKm}</label>
              <input id="act-km" type="text" inputMode="decimal" value={actKm} onChange={e => setActKm(e.target.value)} placeholder="Ex.: 5,2"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>

          {/* O ritmo NÃO é campo: sai da duração e da distância. Pedi-lo seria pedir a mesma informação duas
              vezes, com risco de as duas se contradizerem. */}
          {paceKindFor(actType) && <p className="font-body text-xs text-mauve/70">{C.paceHint}</p>}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="act-bpm" className="font-body text-xs text-mauve block mb-1">{C.fieldHeartRate}</label>
              <input id="act-bpm" type="text" inputMode="numeric" value={actBpm} onChange={e => setActBpm(e.target.value)} placeholder="Ex.: 142"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label htmlFor="act-kcal" className="font-body text-xs text-mauve block mb-1">{C.fieldEnergy}</label>
              <input id="act-kcal" type="text" inputMode="numeric" value={actKcal} onChange={e => setActKcal(e.target.value)} placeholder="Ex.: 310"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={saveAct} disabled={savingAct || !actDate}
              className="px-5 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40">
              {savingAct ? 'Salvando…' : C.save}
            </button>
          </div>
        </Card>
      )}

      {acts.length === 0 ? (
        <EmptyState icon={<Activity size={28} className="text-petal" />} title={C.activityEmptyTitle}
          message={C.activityEmptyMsg} />
      ) : (
        <div className="space-y-2">
          {acts.map(a => (
            <ListCard key={a.id}
              title={a.title?.trim() || activityTypeLabel(a.activity_type)}
              meta={measurementMeta({
                when: [fmtMeasured(a.started_at.slice(0, 10), a.started_at), activitySummary(a)].filter(Boolean).join(' · '),
                source: a.source,
                notes: a.notes,
              })}
              actions={
                <button onClick={() => removeAct(a.id)} title={C.removeAction}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors">
                  <Trash2 size={12} />
                </button>
              }
            />
          ))}
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
