'use client'

// ============================================================
// Medicamentos em uso — lista contínua (em uso / suspenso)
// ============================================================
// A usuária registra os próprios medicamentos. Organização factual e
// autorrelatada — a plataforma NÃO prescreve nem orienta dose; quem indica
// é o médico. Cada medicamento tem estado (em uso / suspenso), dose,
// frequência e desde quando.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, X, Pill, ArrowLeft, Pencil, Trash2, PauseCircle, PlayCircle, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

type Status = 'em_uso' | 'suspenso'
type Kind = 'medicamento' | 'suplemento'

interface Med {
  id: string
  name: string
  kind: Kind
  dose: string | null
  frequency: string | null
  startedOn: string | null
  untilOn: string | null
  status: Status
  notes: string | null
}

function fmtDate(date: string | null): string | null {
  if (!date) return null
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export default function MedicamentosPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [meds, setMeds] = useState<Med[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Kind>('medicamento')
  const [dose, setDose] = useState('')
  const [freq, setFreq] = useState('')
  const [startedOn, setStartedOn] = useState('')
  const [untilOn, setUntilOn] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState<{ name: string; dose: string | null; frequency: string | null }[]>([])

  async function handleScan(file: File) {
    setErr(null); setScanning(true); setScanResults([])
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader()
        r.onload = () => res((r.result as string).split(',')[1] ?? '')
        r.onerror = rej
        r.readAsDataURL(file)
      })
      const resp = await fetch('/api/medications/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type || 'image/jpeg' }),
      })
      const j = await resp.json()
      if (!resp.ok) { setErr(j.error ?? 'Falha ao ler a imagem.'); return }
      if (!j.items?.length) { setErr('Não consegui ler os dados. Tente uma foto mais nítida e bem iluminada.'); return }
      setScanResults(j.items)
      setShowForm(false)
    } finally { setScanning(false) }
  }

  function useScanned(it: { name: string; dose: string | null; frequency: string | null }) {
    setEditingId(null); setKind('medicamento'); setName(it.name); setDose(it.dose ?? ''); setFreq(it.frequency ?? '')
    setStartedOn(''); setUntilOn(''); setNotes(''); setErr(null)
    setScanResults(prev => prev.filter(x => x !== it))
    setShowForm(true)
  }

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('medications')
      .select('id, name, kind, dose, frequency, started_on, until_date, status, notes')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMeds(((data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string,
      name: (m.name as string) ?? '',
      kind: ((m.kind as string) === 'suplemento' ? 'suplemento' : 'medicamento') as Kind,
      dose: (m.dose as string) ?? null,
      frequency: (m.frequency as string) ?? null,
      startedOn: (m.started_on as string) ?? null,
      untilOn: (m.until_date as string) ?? null,
      status: (m.status as Status) ?? 'em_uso',
      notes: (m.notes as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function reset() {
    setEditingId(null); setName(''); setKind('medicamento'); setDose(''); setFreq(''); setStartedOn(''); setUntilOn(''); setNotes(''); setErr(null)
  }
  function openEdit(m: Med) {
    setEditingId(m.id); setName(m.name); setKind(m.kind); setDose(m.dose ?? ''); setFreq(m.frequency ?? '')
    setStartedOn(m.startedOn ?? ''); setUntilOn(m.untilOn ?? ''); setNotes(m.notes ?? ''); setErr(null); setShowForm(true)
  }

  async function save() {
    if (!user || saving || !name.trim()) return
    setSaving(true); setErr(null)
    const payload = {
      name: name.trim(), kind, dose: dose.trim() || null, frequency: freq.trim() || null,
      started_on: startedOn || null, until_date: untilOn || null, notes: notes.trim() || null,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { error } = editingId
      ? await db.from('medications').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId)
      : await db.from('medications').insert({ ...payload, user_id: user.id, status: 'em_uso' })
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  async function setStatus(id: string, status: Status) {
    setBusyId(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('medications').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    await load(); setBusyId(null)
  }

  async function remove(id: string, label: string) {
    if (busyId) return
    if (!window.confirm(`Remover "${label}" da sua lista?`)) return
    setBusyId(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('medications').delete().eq('id', id)
    await load(); setBusyId(null)
  }

  const KIND_LABEL: Record<Kind, string> = { medicamento: 'Medicamentos', suplemento: 'Suplementos' }

  function kindSection(k: Kind) {
    const list = meds.filter(m => m.kind === k)
    if (list.length === 0) return null
    const emUso = list.filter(m => m.status === 'em_uso')
    const suspensos = list.filter(m => m.status === 'suspenso')
    return (
      <div key={k}>
        <p className="font-display text-base font-semibold text-onyx mb-2">{KIND_LABEL[k]}</p>
        <div className="space-y-4">
          <div>
            <p className="font-body text-[11px] font-semibold text-mauve/70 uppercase tracking-wider mb-2">Em uso ({emUso.length})</p>
            {emUso.length > 0 ? <div className="space-y-3">{emUso.map(card)}</div>
              : <p className="font-body text-sm text-mauve/60">Nenhum em uso.</p>}
          </div>
          {suspensos.length > 0 && (
            <div>
              <p className="font-body text-[11px] font-semibold text-mauve/50 uppercase tracking-wider mb-2">Suspensos ({suspensos.length})</p>
              <div className="space-y-3 opacity-75">{suspensos.map(card)}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  function card(m: Med) {
    return (
      <div key={m.id} className="card-premium p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-onyx">{m.name}</p>
          <p className="font-body text-[11px] text-mauve/70 mt-0.5">
            {[m.dose, m.frequency].filter(Boolean).join(' · ') || 'Sem detalhes'}
            {m.startedOn && m.untilOn ? ` · de ${fmtDate(m.startedOn)} até ${fmtDate(m.untilOn)}`
              : m.startedOn ? ` · desde ${fmtDate(m.startedOn)}`
              : m.untilOn ? ` · até ${fmtDate(m.untilOn)}` : ''}
          </p>
          {m.notes && <p className="font-body text-[11px] text-mauve/60 mt-1">{m.notes}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {m.status === 'em_uso' ? (
            <button title="Marcar como suspenso" disabled={busyId === m.id} onClick={() => setStatus(m.id, 'suspenso')}
              className="w-7 h-7 rounded-lg hover:bg-blush flex items-center justify-center text-mauve/60 hover:text-petal">
              <PauseCircle size={14} />
            </button>
          ) : (
            <button title="Voltar a usar" disabled={busyId === m.id} onClick={() => setStatus(m.id, 'em_uso')}
              className="w-7 h-7 rounded-lg hover:bg-sage-light flex items-center justify-center text-mauve/60 hover:text-sage">
              <PlayCircle size={14} />
            </button>
          )}
          <button title="Editar" onClick={() => openEdit(m)}
            className="w-7 h-7 rounded-lg hover:bg-blush flex items-center justify-center text-mauve/60 hover:text-petal">
            <Pencil size={13} />
          </button>
          <button title="Remover" disabled={busyId === m.id} onClick={() => remove(m.id, m.name)}
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/60 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard/timeline" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Minha Jornada
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-petal mb-2">
            <Pill size={16} />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Medicamentos e suplementos</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Medicamentos e suplementos</h1>
          <p className="font-body text-sm text-mauve mt-1">Registre o que você usa. A SINTERA organiza — quem prescreve é o seu médico.</p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
            className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? 'Fechar' : 'Adicionar'}
          </button>
          <label className={['flex items-center gap-2 px-4 py-2 rounded-full border border-petal/40 text-petal font-body text-sm font-medium cursor-pointer hover:bg-blush transition-colors',
            scanning ? 'opacity-60 pointer-events-none' : ''].join(' ')}>
            <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={scanning}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleScan(f); e.target.value = '' }} />
            {scanning ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
            {scanning ? 'Lendo…' : 'Escanear foto'}
          </label>
        </div>
      </div>

      {/* Resultados do escaneamento — conferir antes de adicionar */}
      {scanResults.length > 0 && (
        <div className="card-premium p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm font-semibold text-onyx">Detectado na foto — confira e adicione</p>
            <button onClick={() => setScanResults([])} className="text-mauve/50 hover:text-onyx"><X size={15} /></button>
          </div>
          <p className="font-body text-[11px] text-mauve/60">Transcrição automática da imagem. Revise antes de salvar — a plataforma só organiza, não prescreve.</p>
          {scanResults.map((it, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-ivory px-3 py-2">
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-onyx truncate">{it.name}</p>
                <p className="font-body text-[11px] text-mauve/70">{[it.dose, it.frequency].filter(Boolean).join(' · ') || 'Sem dose/frequência detectada'}</p>
              </div>
              <button onClick={() => useScanned(it)}
                className="px-3 py-1.5 rounded-full gradient-sintera text-white font-body text-xs font-medium flex-shrink-0 hover:opacity-90">Usar</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="card-premium p-5 space-y-3">
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Tipo</label>
            <select value={kind} onChange={e => setKind(e.target.value as Kind)}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
              <option value="medicamento">Medicamento</option>
              <option value="suplemento">Suplemento</option>
            </select>
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Nome do {kind === 'suplemento' ? 'suplemento' : 'medicamento'}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={kind === 'suplemento' ? 'Ex.: Vitamina D' : 'Ex.: Losartana'}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Dose (opcional)</label>
              <input type="text" value={dose} onChange={e => setDose(e.target.value)} placeholder="Ex.: 50 mg"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Frequência (opcional)</label>
              <input type="text" value={freq} onChange={e => setFreq(e.target.value)} placeholder="Ex.: 1x ao dia"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Início (opcional)</label>
              <input type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Até quando (opcional)</label>
              <input type="date" value={untilOn} onChange={e => setUntilOn(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <p className="font-body text-[10px] text-mauve/50 mt-1">Em branco = sem previsão.</p>
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Observações (opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : editingId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-premium p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></div>
      ) : meds.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <p className="font-body text-sm text-mauve">Nenhum medicamento ou suplemento registrado ainda. Use o botão <strong>Adicionar</strong>.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {kindSection('medicamento')}
          {kindSection('suplemento')}
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Organização da sua lista de medicamentos e suplementos. Não é prescrição nem orientação de dose — siga sempre a orientação do seu médico.
      </p>
    </div>
  )
}
