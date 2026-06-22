'use client'

// ============================================================
// Receitas de óculos — dentro de Condições de Saúde
// ============================================================
// Registro factual da receita oftalmológica: grau por olho (OD/OE), DNP, data
// e prescritor, com a foto da receita. Pode escanear/fotografar para pré-
// preencher via IA (transcrição factual) — a pessoa revisa e confirma. A
// SINTERA NÃO interpreta nem prescreve.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Plus, X, Glasses, Trash2, Pencil, Camera, Paperclip } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

interface Rx {
  id: string
  kind: string
  prescribedOn: string | null
  prescriber: string | null
  odSph: string | null; odCyl: string | null; odAxis: string | null; odAdd: string | null
  oeSph: string | null; oeCyl: string | null; oeAxis: string | null; oeAdd: string | null
  dnp: string | null
  bc: string | null; dia: string | null
  notes: string | null
  fileUrl: string | null
}

const EMPTY = {
  kind: 'oculos',
  prescribedOn: '', prescriber: '',
  odSph: '', odCyl: '', odAxis: '', odAdd: '',
  oeSph: '', oeCyl: '', oeAxis: '', oeAdd: '',
  dnp: '', bc: '', dia: '', notes: '', fileUrl: '' as string | null,
}

const KIND_LABEL: Record<string, string> = { oculos: 'Óculos', lentes_contato: 'Lentes de contato' }

function fmt(date: string | null): string {
  if (!date) return ''
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const inputCls = 'w-full px-2 py-1.5 border border-border rounded-lg font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30'

export default function EyeglassPrescriptions() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Rx[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [f, setF] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof typeof EMPTY, v: string) => setF(s => ({ ...s, [k]: v }))

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('eyeglass_prescriptions')
      .select('id, kind, prescribed_on, prescriber, od_sph, od_cyl, od_axis, od_add, oe_sph, oe_cyl, oe_axis, oe_add, dnp, bc, dia, notes, file_url')
      .eq('user_id', user.id).order('prescribed_on', { ascending: false, nullsFirst: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(r => ({
      id: r.id as string, kind: (r.kind as string) ?? 'oculos', prescribedOn: (r.prescribed_on as string) ?? null, prescriber: (r.prescriber as string) ?? null,
      odSph: (r.od_sph as string) ?? null, odCyl: (r.od_cyl as string) ?? null, odAxis: (r.od_axis as string) ?? null, odAdd: (r.od_add as string) ?? null,
      oeSph: (r.oe_sph as string) ?? null, oeCyl: (r.oe_cyl as string) ?? null, oeAxis: (r.oe_axis as string) ?? null, oeAdd: (r.oe_add as string) ?? null,
      dnp: (r.dnp as string) ?? null, bc: (r.bc as string) ?? null, dia: (r.dia as string) ?? null,
      notes: (r.notes as string) ?? null, fileUrl: (r.file_url as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function reset() { setEditingId(null); setF({ ...EMPTY }); setErr(null) }

  function startEdit(r: Rx) {
    setEditingId(r.id)
    setF({
      kind: r.kind ?? 'oculos',
      prescribedOn: r.prescribedOn ?? '', prescriber: r.prescriber ?? '',
      odSph: r.odSph ?? '', odCyl: r.odCyl ?? '', odAxis: r.odAxis ?? '', odAdd: r.odAdd ?? '',
      oeSph: r.oeSph ?? '', oeCyl: r.oeCyl ?? '', oeAxis: r.oeAxis ?? '', oeAdd: r.oeAdd ?? '',
      dnp: r.dnp ?? '', bc: r.bc ?? '', dia: r.dia ?? '', notes: r.notes ?? '', fileUrl: r.fileUrl ?? '',
    })
    setErr(null); setShowForm(true)
  }

  // Escanear/fotografar: faz upload da foto (armazena) e extrai o grau via IA.
  async function onScanFile(file: File) {
    if (!user) return
    if (!file.type.startsWith('image/')) { setErr('Envie uma imagem (foto da receita).'); return }
    if (file.size > 10 * 1024 * 1024) { setErr('Imagem muito grande (máx. 10 MB).'); return }
    setScanning(true); setErr(null); setShowForm(true)
    try {
      // 1) Armazena a foto no bucket privado (mesma pasta dos exames → RLS/LGPD).
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('exams').upload(path, file, { contentType: file.type, upsert: false })
      if (!upErr) {
        const { data: signed } = await supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
        if (signed?.signedUrl) setF(s => ({ ...s, fileUrl: signed.signedUrl }))
      }
      // 2) Extrai o grau via IA (visão).
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(String(reader.result).split(',')[1] ?? '')
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const resp = await fetch('/api/vision/eyeglasses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
      })
      const json = await resp.json()
      const r = json?.result
      if (r) {
        setF(s => ({
          ...s,
          prescribedOn: r.prescribed_on ?? s.prescribedOn, prescriber: r.prescriber ?? s.prescriber,
          odSph: r.od?.sph ?? s.odSph, odCyl: r.od?.cyl ?? s.odCyl, odAxis: r.od?.axis ?? s.odAxis, odAdd: r.od?.add ?? s.odAdd,
          oeSph: r.oe?.sph ?? s.oeSph, oeCyl: r.oe?.cyl ?? s.oeCyl, oeAxis: r.oe?.axis ?? s.oeAxis, oeAdd: r.oe?.add ?? s.oeAdd,
          dnp: r.dnp ?? s.dnp, bc: r.bc ?? s.bc, dia: r.dia ?? s.dia,
          kind: (r.bc || r.dia) ? 'lentes_contato' : s.kind,
        }))
      } else if (!resp.ok) {
        setErr('Não consegui ler a receita automaticamente. Preencha manualmente.')
      }
    } catch {
      setErr('Falha ao processar a foto. Preencha manualmente.')
    } finally {
      setScanning(false)
    }
  }

  async function save() {
    if (!user || saving) return
    const blank = (v: string) => (v.trim() ? v.trim() : null)
    const payload = {
      user_id: user.id, kind: f.kind,
      prescribed_on: f.prescribedOn || null, prescriber: blank(f.prescriber),
      od_sph: blank(f.odSph), od_cyl: blank(f.odCyl), od_axis: blank(f.odAxis), od_add: blank(f.odAdd),
      oe_sph: blank(f.oeSph), oe_cyl: blank(f.oeCyl), oe_axis: blank(f.oeAxis), oe_add: blank(f.oeAdd),
      dnp: f.kind === 'oculos' ? blank(f.dnp) : null,
      bc: f.kind === 'lentes_contato' ? blank(f.bc) : null,
      dia: f.kind === 'lentes_contato' ? blank(f.dia) : null,
      notes: blank(f.notes), file_url: f.fileUrl || null,
    }
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (supabase as any).from('eyeglass_prescriptions')
    const { error } = editingId ? await db.update(payload).eq('id', editingId) : await db.insert(payload)
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  async function remove(r: Rx) {
    if (busyId) return
    if (!window.confirm('Remover este registro?')) return
    setBusyId(r.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('eyeglass_prescriptions').delete().eq('id', r.id)
    await load(); setBusyId(null)
  }

  function grauLine(label: string, sph: string | null, cyl: string | null, axis: string | null, add: string | null) {
    const parts = [
      sph ? `Esf ${sph}` : null, cyl ? `Cil ${cyl}` : null,
      axis ? `Eixo ${axis}` : null, add ? `Adição ${add}` : null,
    ].filter(Boolean)
    if (parts.length === 0) return null
    return <p className="font-body text-[11px] text-mauve"><span className="font-semibold text-onyx">{label}:</span> {parts.join(' · ')}</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Glasses size={15} className="text-petal" />
          <p className="font-display text-base font-semibold text-onyx">Óculos e lentes de contato</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { const file = e.target.files?.[0]; if (file) { reset(); onScanFile(file) } e.target.value = '' }} />
          <button onClick={() => scanRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-petal/40 text-petal font-body text-xs font-medium hover:bg-blush transition-colors">
            <Camera size={13} /> Escanear receita
          </button>
          <button onClick={() => (showForm ? (reset(), setShowForm(false)) : (reset(), setShowForm(true)))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-sintera text-white font-body text-xs font-medium hover:opacity-90 transition-opacity">
            {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? 'Fechar' : 'Adicionar'}
          </button>
        </div>
      </div>
      <p className="font-body text-[11px] text-mauve/60 mb-3">Fotografe a receita para preencher o grau automaticamente, ou registre manualmente. A SINTERA transcreve — não interpreta nem prescreve.</p>

      {showForm && (
        <div className="card-premium p-4 space-y-3 mb-3">
          {scanning && (
            <div className="flex items-center gap-2 text-petal font-body text-xs">
              <Loader2 size={14} className="animate-spin" /> Lendo a receita…
            </div>
          )}
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Tipo</label>
            <select value={f.kind} onChange={e => set('kind', e.target.value)} className={inputCls}>
              <option value="oculos">Óculos</option>
              <option value="lentes_contato">Lentes de contato</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Data da receita</label>
              <input type="date" value={f.prescribedOn} onChange={e => set('prescribedOn', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Profissional/clínica</label>
              <input type="text" value={f.prescriber} onChange={e => set('prescriber', e.target.value)} placeholder="Opcional" className={inputCls} />
            </div>
          </div>

          {/* Grau por olho */}
          <div className="space-y-2">
            <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] items-center gap-1.5">
              <span className="font-body text-[10px] text-mauve/60" />
              <span className="font-body text-[10px] text-mauve/60 text-center">Esférico</span>
              <span className="font-body text-[10px] text-mauve/60 text-center">Cilíndrico</span>
              <span className="font-body text-[10px] text-mauve/60 text-center">Eixo</span>
              <span className="font-body text-[10px] text-mauve/60 text-center">Adição</span>
            </div>
            <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] items-center gap-1.5">
              <span className="font-body text-xs font-semibold text-onyx">OD</span>
              <input value={f.odSph} onChange={e => set('odSph', e.target.value)} placeholder="-2,00" className={inputCls} />
              <input value={f.odCyl} onChange={e => set('odCyl', e.target.value)} placeholder="-0,75" className={inputCls} />
              <input value={f.odAxis} onChange={e => set('odAxis', e.target.value)} placeholder="180" className={inputCls} />
              <input value={f.odAdd} onChange={e => set('odAdd', e.target.value)} placeholder="+2,00" className={inputCls} />
            </div>
            <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] items-center gap-1.5">
              <span className="font-body text-xs font-semibold text-onyx">OE</span>
              <input value={f.oeSph} onChange={e => set('oeSph', e.target.value)} placeholder="-2,00" className={inputCls} />
              <input value={f.oeCyl} onChange={e => set('oeCyl', e.target.value)} placeholder="-0,75" className={inputCls} />
              <input value={f.oeAxis} onChange={e => set('oeAxis', e.target.value)} placeholder="180" className={inputCls} />
              <input value={f.oeAdd} onChange={e => set('oeAdd', e.target.value)} placeholder="+2,00" className={inputCls} />
            </div>
            <p className="font-body text-[10px] text-mauve/50">OD = olho direito · OE = olho esquerdo</p>
          </div>

          {f.kind === 'oculos' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs text-mauve/70 block mb-1">DNP / DP</label>
                <input type="text" value={f.dnp} onChange={e => set('dnp', e.target.value)} placeholder="Ex.: 62" className={inputCls} />
              </div>
              <div className="flex items-end">
                {f.fileUrl ? (
                  <a href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-body text-xs text-petal hover:underline pb-1.5">
                    <Paperclip size={13} /> Foto anexada
                  </a>
                ) : (
                  <button onClick={() => scanRef.current?.click()}
                    className="inline-flex items-center gap-1.5 font-body text-xs text-mauve hover:text-petal pb-1.5">
                    <Camera size={13} /> Anexar foto
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-body text-xs text-mauve/70 block mb-1">Curva base (BC)</label>
                  <input type="text" value={f.bc} onChange={e => set('bc', e.target.value)} placeholder="Ex.: 8.6" className={inputCls} />
                </div>
                <div>
                  <label className="font-body text-xs text-mauve/70 block mb-1">Diâmetro (DIA)</label>
                  <input type="text" value={f.dia} onChange={e => set('dia', e.target.value)} placeholder="Ex.: 14.2" className={inputCls} />
                </div>
              </div>
              {f.fileUrl ? (
                <a href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-body text-xs text-petal hover:underline">
                  <Paperclip size={13} /> Foto anexada
                </a>
              ) : (
                <button onClick={() => scanRef.current?.click()}
                  className="inline-flex items-center gap-1.5 font-body text-xs text-mauve hover:text-petal">
                  <Camera size={13} /> Anexar foto
                </button>
              )}
            </>
          )}
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Observações (opcional)</label>
            <textarea value={f.notes} onChange={e => set('notes', e.target.value)} rows={2} className={inputCls} />
          </div>

          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end">
            <button onClick={save} disabled={saving}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {!showForm && err && <p className="font-body text-xs text-red-500 mb-2">{err}</p>}

      {loading ? (
        <div className="card-premium p-6 text-center"><Loader2 size={20} className="animate-spin text-petal mx-auto" /></div>
      ) : items.length === 0 ? (
        <p className="font-body text-sm text-mauve/60">Nenhuma receita registrada.</p>
      ) : (
        <div className="space-y-2">
          {items.map(r => (
            <div key={r.id} className="card-premium p-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-onyx">
                  {KIND_LABEL[r.kind] ?? 'Óculos'}{r.prescribedOn ? ` · ${fmt(r.prescribedOn)}` : ''}
                </p>
                <div className="mt-1 space-y-0.5">
                  {grauLine('OD', r.odSph, r.odCyl, r.odAxis, r.odAdd)}
                  {grauLine('OE', r.oeSph, r.oeCyl, r.oeAxis, r.oeAdd)}
                </div>
                <p className="font-body text-[11px] text-mauve/70 mt-1">
                  {[
                    r.dnp ? `DNP ${r.dnp}` : null,
                    r.bc ? `BC ${r.bc}` : null,
                    r.dia ? `DIA ${r.dia}` : null,
                    r.prescriber,
                  ].filter(Boolean).join(' · ')}
                </p>
                {r.notes && <p className="font-body text-[11px] text-mauve/60 mt-1">{r.notes}</p>}
                {r.fileUrl && (
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline mt-1">
                    <Paperclip size={11} /> Ver foto da receita
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => startEdit(r)} title="Editar"
                  className="w-7 h-7 rounded-lg hover:bg-blush flex items-center justify-center text-mauve/60 hover:text-petal">
                  <Pencil size={13} />
                </button>
                <button onClick={() => remove(r)} disabled={busyId === r.id} title="Remover"
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/60 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
