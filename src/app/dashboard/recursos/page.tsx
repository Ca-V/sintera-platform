'use client'

// ============================================================
// Recursos de Saúde — módulo próprio (UX-001 Anexo A)
// ============================================================
// Recursos que a pessoa USA para cuidado, compensação funcional ou monitoramento:
// correção visual, dispositivos médicos, próteses/órteses, auxílios e compressão/
// suporte. NÃO é o que ela "tem" (Condições) nem o que "toma" (Medicamentos).
// Modelo próprio (health_resources); o detalhe do sub-tipo vive em `attributes`.
// A SINTERA apenas organiza o que a pessoa informa — não interpreta nem prescreve.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Loader2, Plus, X, ArrowLeft, Pencil, Trash2, Camera, Paperclip,
  Glasses, HeartPulse, Bone, Accessibility, Shirt, Package,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import ListCard, { CardChip } from '@/components/ListCard'
import ViewModeSwitcher from '@/components/ViewModeSwitcher'
import { useStickyView } from '@/lib/ui/useStickyView'
import Card from '@/components/ui/Card'

type ResourceType = 'correcao_visual' | 'dispositivo_medico' | 'protese_ortese' | 'auxilio' | 'compressao_suporte'
type Status = 'em_uso' | 'suspenso' | 'encerrado'

const TYPES: { value: ResourceType; label: string; icon: React.ElementType; hint: string }[] = [
  { value: 'correcao_visual',    label: 'Correção visual',      icon: Glasses,       hint: 'óculos, lentes de contato, lente escleral' },
  { value: 'dispositivo_medico', label: 'Dispositivos médicos', icon: HeartPulse,    hint: 'marca-passo, CDI, bomba de insulina, sensor de glicose' },
  { value: 'protese_ortese',     label: 'Próteses e órteses',   icon: Bone,          hint: 'prótese, órtese, palmilha, aparelho ortodôntico' },
  { value: 'auxilio',            label: 'Auxílios',             icon: Accessibility, hint: 'aparelho auditivo, bengala, muletas, andador, cadeira de rodas' },
  { value: 'compressao_suporte', label: 'Compressão e suporte', icon: Shirt,         hint: 'meia compressiva, colar cervical, faixa, colete' },
]
const TYPE_META = (v: string) => TYPES.find(t => t.value === v) ?? null

const STATUS: { value: Status; label: string; tone: string }[] = [
  { value: 'em_uso',    label: 'Em uso',    tone: 'sage' },
  { value: 'suspenso',  label: 'Suspenso',  tone: 'gold' },
  { value: 'encerrado', label: 'Encerrado', tone: 'neutral' },
]
const STATUS_META = (v: string) => STATUS.find(s => s.value === v) ?? STATUS[0]

interface Resource {
  id: string
  resourceType: ResourceType
  name: string
  brand: string | null
  prescriber: string | null
  startedOn: string | null
  untilDate: string | null
  status: Status
  notes: string | null
  fileUrl: string | null
  attributes: Record<string, unknown>
}

const EMPTY = {
  resource_type: 'correcao_visual' as ResourceType,
  name: '', brand: '', prescriber: '', started_on: '', until_date: '',
  status: 'em_uso' as Status, notes: '', file_url: '' as string | null,
  // Correção visual (attributes):
  vision_kind: 'oculos' as 'oculos' | 'lentes_contato',
  od_sph: '', od_cyl: '', od_axis: '', od_add: '',
  oe_sph: '', oe_cyl: '', oe_axis: '', oe_add: '',
  dnp: '', bc: '', dia: '',
}

function fmt(date: string | null): string {
  if (!date) return ''
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Resumo compacto do grau (correção visual) para a meta do card.
function grauResumo(a: Record<string, unknown>): string {
  const eye = (side: 'od' | 'oe') => {
    const o = (a[side] ?? {}) as Record<string, string>
    const parts = [o.sph && `Esf ${o.sph}`, o.cyl && `Cil ${o.cyl}`, o.axis && `Eixo ${o.axis}`, o.add && `Ad ${o.add}`].filter(Boolean)
    return parts.length ? `${side.toUpperCase()} ${parts.join(' ')}` : ''
  }
  return [eye('od'), eye('oe')].filter(Boolean).join(' · ')
}

const inputCls = 'w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30'
const gradeCls = 'w-full px-2 py-1.5 border border-border rounded-lg font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30'

export default function RecursosPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [view, setView] = useStickyView<'tipo' | 'situacao'>('sintera:recursos-view', 'tipo')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingAttrs, setEditingAttrs] = useState<Record<string, unknown>>({})
  const [f, setF] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof typeof EMPTY, v: string) => setF(s => ({ ...s, [k]: v }))
  const isVisual = f.resource_type === 'correcao_visual'

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('health_resources')
      .select('id, resource_type, name, brand, prescriber, started_on, until_date, status, notes, file_url, attributes')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(r => ({
      id: r.id as string,
      resourceType: (r.resource_type as ResourceType) ?? 'dispositivo_medico',
      name: (r.name as string) ?? '',
      brand: (r.brand as string) ?? null,
      prescriber: (r.prescriber as string) ?? null,
      startedOn: (r.started_on as string) ?? null,
      untilDate: (r.until_date as string) ?? null,
      status: (r.status as Status) ?? 'em_uso',
      notes: (r.notes as string) ?? null,
      fileUrl: (r.file_url as string) ?? null,
      attributes: (r.attributes as Record<string, unknown>) ?? {},
    })))
    setLoading(false)
  }, [user, supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- carrega dados na montagem (data fetching)
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function reset() { setEditingId(null); setEditingAttrs({}); setF({ ...EMPTY }); setErr(null) }

  function startAdd(type?: ResourceType) {
    reset()
    if (type) setF(s => ({ ...s, resource_type: type }))
    setShowForm(true)
  }

  function startEdit(r: Resource) {
    setEditingId(r.id)
    setEditingAttrs(r.attributes ?? {})
    const a = r.attributes ?? {}
    const od = (a.od ?? {}) as Record<string, string>
    const oe = (a.oe ?? {}) as Record<string, string>
    setF({
      resource_type: r.resourceType,
      name: r.name, brand: r.brand ?? '', prescriber: r.prescriber ?? '',
      started_on: r.startedOn ?? '', until_date: r.untilDate ?? '',
      status: r.status, notes: r.notes ?? '', file_url: r.fileUrl ?? '',
      vision_kind: (a.vision_kind as 'oculos' | 'lentes_contato') ?? 'oculos',
      od_sph: od.sph ?? '', od_cyl: od.cyl ?? '', od_axis: od.axis ?? '', od_add: od.add ?? '',
      oe_sph: oe.sph ?? '', oe_cyl: oe.cyl ?? '', oe_axis: oe.axis ?? '', oe_add: oe.add ?? '',
      dnp: (a.dnp as string) ?? '', bc: (a.bc as string) ?? '', dia: (a.dia as string) ?? '',
    })
    setErr(null); setShowForm(true)
  }

  // Anexa a foto (upload no bucket privado). Para correção visual, também extrai o
  // grau via IA (transcrição factual — a pessoa revisa e confirma).
  async function onScanFile(file: File) {
    if (!user) return
    if (!file.type.startsWith('image/')) { setErr('Envie uma imagem (foto).'); return }
    if (file.size > 10 * 1024 * 1024) { setErr('Imagem muito grande (máx. 10 MB).'); return }
    setScanning(true); setErr(null); setShowForm(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('exams').upload(path, file, { contentType: file.type, upsert: false })
      if (!upErr) {
        const { data: signed } = await supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
        if (signed?.signedUrl) setF(s => ({ ...s, file_url: signed.signedUrl }))
      }
      // Extração de grau só faz sentido em correção visual.
      if (f.resource_type !== 'correcao_visual') { setScanning(false); return }
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
          prescriber: r.prescriber ?? s.prescriber,
          started_on: r.prescribed_on ?? s.started_on,
          od_sph: r.od?.sph ?? s.od_sph, od_cyl: r.od?.cyl ?? s.od_cyl, od_axis: r.od?.axis ?? s.od_axis, od_add: r.od?.add ?? s.od_add,
          oe_sph: r.oe?.sph ?? s.oe_sph, oe_cyl: r.oe?.cyl ?? s.oe_cyl, oe_axis: r.oe?.axis ?? s.oe_axis, oe_add: r.oe?.add ?? s.oe_add,
          dnp: r.dnp ?? s.dnp, bc: r.bc ?? s.bc, dia: r.dia ?? s.dia,
          vision_kind: (r.bc || r.dia) ? 'lentes_contato' : s.vision_kind,
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

  // Monta os attributes específicos do sub-tipo, preservando chaves não-editáveis
  // aqui (ex.: legacy_id da migração).
  function buildAttributes(): Record<string, unknown> {
    const blank = (v: string) => (v.trim() ? v.trim() : undefined)
    const base = { ...editingAttrs }
    if (f.resource_type === 'correcao_visual') {
      const od = { sph: blank(f.od_sph), cyl: blank(f.od_cyl), axis: blank(f.od_axis), add: blank(f.od_add) }
      const oe = { sph: blank(f.oe_sph), cyl: blank(f.oe_cyl), axis: blank(f.oe_axis), add: blank(f.oe_add) }
      const clean = (o: Record<string, string | undefined>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v != null))
      return {
        ...base,
        vision_kind: f.vision_kind,
        od: clean(od), oe: clean(oe),
        dnp: f.vision_kind === 'oculos' ? blank(f.dnp) : undefined,
        bc: f.vision_kind === 'lentes_contato' ? blank(f.bc) : undefined,
        dia: f.vision_kind === 'lentes_contato' ? blank(f.dia) : undefined,
      }
    }
    // Outros sub-tipos: preserva o que já havia (sem campos extras nesta versão).
    return base
  }

  async function save() {
    if (!user || saving || !f.name.trim()) return
    setSaving(true); setErr(null)
    const blank = (v: string) => (v.trim() ? v.trim() : null)
    const payload = {
      user_id: user.id,
      resource_type: f.resource_type,
      name: f.name.trim(),
      brand: blank(f.brand),
      prescriber: blank(f.prescriber),
      started_on: f.started_on || null,
      until_date: f.until_date || null,
      status: f.status,
      notes: blank(f.notes),
      file_url: f.file_url || null,
      attributes: buildAttributes(),
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (supabase as any).from('health_resources')
    const { error } = editingId ? await db.update(payload).eq('id', editingId) : await db.insert(payload)
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  async function remove(r: Resource) {
    if (busyId) return
    if (!window.confirm(`Remover "${r.name}"?`)) return
    setBusyId(r.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('health_resources').delete().eq('id', r.id)
    await load(); setBusyId(null)
  }

  function card(r: Resource) {
    const tm = TYPE_META(r.resourceType)
    const Icon = tm?.icon ?? Package
    const sm = STATUS_META(r.status)
    const metaParts = [
      r.brand,
      r.resourceType === 'correcao_visual' ? grauResumo(r.attributes) : null,
      r.prescriber,
      r.startedOn ? `desde ${fmt(r.startedOn)}` : null,
      r.untilDate ? `troca ${fmt(r.untilDate)}` : null,
    ].filter(Boolean)
    return (
      <ListCard key={r.id}
        leading={
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="text-petal" />
          </div>
        }
        title={r.name}
        onTitleClick={() => startEdit(r)}
        trailing={<CardChip tone={sm.tone}>{sm.label}</CardChip>}
        meta={
          (metaParts.length || r.notes || r.fileUrl) ? (
            <>
              {metaParts.length > 0 && <span>{metaParts.join(' • ')}</span>}
              {r.notes && <span className={metaParts.length ? 'block mt-0.5 text-mauve' : 'text-mauve'}>{r.notes}</span>}
              {r.fileUrl && (
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-petal hover:underline mt-0.5">
                  <Paperclip size={11} /> Ver foto
                </a>
              )}
            </>
          ) : undefined
        }
        chips={view === 'situacao' ? <CardChip tone="mauve">{tm?.label ?? 'Recurso'}</CardChip> : undefined}
        actions={
          <>
            <button onClick={() => startEdit(r)} title="Editar"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-petal transition-colors"><Pencil size={12} /></button>
            <button onClick={() => remove(r)} disabled={busyId === r.id} title="Remover"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"><Trash2 size={12} /></button>
          </>
        }
      />
    )
  }

  // Agrupamento por sub-tipo (ordem fixa) ou por situação.
  const groups: { key: string; label: string; rows: Resource[] }[] =
    view === 'tipo'
      ? TYPES.map(t => ({ key: t.value, label: t.label, rows: items.filter(i => i.resourceType === t.value) })).filter(g => g.rows.length > 0)
      : STATUS.map(s => ({ key: s.value, label: s.label, rows: items.filter(i => i.status === s.value) })).filter(g => g.rows.length > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <PageHeader
        icon={<Package size={16} />}
        eyebrow="Recursos de Saúde"
        title="Recursos de Saúde"
        subtitle="Recursos que você usa para cuidado, compensação funcional ou monitoramento — óculos e lentes, dispositivos médicos, próteses e órteses, auxílios, compressão e suporte. A SINTERA organiza o que você informa — não interpreta nem prescreve."
        action={
          <div className="flex items-center gap-2">
            <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { const file = e.target.files?.[0]; if (file) { if (!showForm) startAdd(); onScanFile(file) } e.target.value = '' }} />
            <button onClick={() => scanRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-petal/40 text-petal font-body text-sm font-medium hover:bg-blush transition-colors flex-shrink-0">
              <Camera size={15} /> Escanear
            </button>
            <button onClick={() => (showForm ? (reset(), setShowForm(false)) : startAdd())}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0">
              {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Fechar' : 'Adicionar'}
            </button>
          </div>
        }
      />

      {showForm && (
        <Card className="space-y-3">
          {scanning && (
            <div className="flex items-center gap-2 text-petal font-body text-xs">
              <Loader2 size={14} className="animate-spin" /> Lendo a foto…
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="recurso-tipo" className="font-body text-xs text-mauve block mb-1">Tipo de recurso</label>
              <select id="recurso-tipo" value={f.resource_type} onChange={e => set('resource_type', e.target.value)} className={inputCls}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="recurso-situacao" className="font-body text-xs text-mauve block mb-1">Situação</label>
              <select id="recurso-situacao" value={f.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <p className="font-body text-[11px] text-mauve -mt-1">{TYPE_META(f.resource_type)?.hint}</p>

          <div>
            <label htmlFor="recurso-nome" className="font-body text-xs text-mauve block mb-1">Nome do recurso</label>
            <div className="flex items-center gap-2">
              <input id="recurso-nome" type="text" value={f.name} onChange={e => set('name', e.target.value)}
                placeholder={isVisual ? 'Ex.: Óculos de longe' : 'Ex.: Marca-passo, aparelho auditivo'}
                className={`${inputCls} flex-1 min-w-0`} />
              <VoiceInput onResult={t => setF(s => ({ ...s, name: (s.name ? s.name + ' ' : '') + t }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="recurso-marca" className="font-body text-xs text-mauve block mb-1">Marca / modelo (opcional)</label>
              <input id="recurso-marca" type="text" value={f.brand} onChange={e => set('brand', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="recurso-prescriber" className="font-body text-xs text-mauve block mb-1">Profissional / quem indicou (opcional)</label>
              <input id="recurso-prescriber" type="text" value={f.prescriber} onChange={e => set('prescriber', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="recurso-desde" className="font-body text-xs text-mauve block mb-1">Desde quando (opcional)</label>
              <input id="recurso-desde" type="date" value={f.started_on} onChange={e => set('started_on', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="recurso-troca" className="font-body text-xs text-mauve block mb-1">Troca / validade prevista (opcional)</label>
              <input id="recurso-troca" type="date" value={f.until_date} onChange={e => set('until_date', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Correção visual — grau por olho + scan de receita */}
          {isVisual && (
            <div className="rounded-xl border border-border/70 bg-ivory/40 p-3 space-y-3">
              <div>
                <label htmlFor="recurso-formato" className="font-body text-xs text-mauve block mb-1">Formato</label>
                <select id="recurso-formato" value={f.vision_kind} onChange={e => set('vision_kind', e.target.value)} className={gradeCls}>
                  <option value="oculos">Óculos</option>
                  <option value="lentes_contato">Lentes de contato</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] items-center gap-1.5">
                  <span className="font-body text-[11px] text-mauve" />
                  <span className="font-body text-[11px] text-mauve text-center">Esférico</span>
                  <span className="font-body text-[11px] text-mauve text-center">Cilíndrico</span>
                  <span className="font-body text-[11px] text-mauve text-center">Eixo</span>
                  <span className="font-body text-[11px] text-mauve text-center">Adição</span>
                </div>
                <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] items-center gap-1.5">
                  <span className="font-body text-xs font-semibold text-onyx">OD</span>
                  <input aria-label="OD esférico" value={f.od_sph} onChange={e => set('od_sph', e.target.value)} placeholder="-2,00" className={gradeCls} />
                  <input aria-label="OD cilíndrico" value={f.od_cyl} onChange={e => set('od_cyl', e.target.value)} placeholder="-0,75" className={gradeCls} />
                  <input aria-label="OD eixo" value={f.od_axis} onChange={e => set('od_axis', e.target.value)} placeholder="180" className={gradeCls} />
                  <input aria-label="OD adição" value={f.od_add} onChange={e => set('od_add', e.target.value)} placeholder="+2,00" className={gradeCls} />
                </div>
                <div className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr] items-center gap-1.5">
                  <span className="font-body text-xs font-semibold text-onyx">OE</span>
                  <input aria-label="OE esférico" value={f.oe_sph} onChange={e => set('oe_sph', e.target.value)} placeholder="-2,00" className={gradeCls} />
                  <input aria-label="OE cilíndrico" value={f.oe_cyl} onChange={e => set('oe_cyl', e.target.value)} placeholder="-0,75" className={gradeCls} />
                  <input aria-label="OE eixo" value={f.oe_axis} onChange={e => set('oe_axis', e.target.value)} placeholder="180" className={gradeCls} />
                  <input aria-label="OE adição" value={f.oe_add} onChange={e => set('oe_add', e.target.value)} placeholder="+2,00" className={gradeCls} />
                </div>
                <p className="font-body text-[11px] text-mauve">OD = olho direito · OE = olho esquerdo</p>
              </div>
              {f.vision_kind === 'oculos' ? (
                <div>
                  <label htmlFor="recurso-dnp" className="font-body text-xs text-mauve block mb-1">DNP / DP (opcional)</label>
                  <input id="recurso-dnp" type="text" value={f.dnp} onChange={e => set('dnp', e.target.value)} placeholder="Ex.: 62" className={gradeCls} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="recurso-bc" className="font-body text-xs text-mauve block mb-1">Curva base (BC)</label>
                    <input id="recurso-bc" type="text" value={f.bc} onChange={e => set('bc', e.target.value)} placeholder="Ex.: 8.6" className={gradeCls} />
                  </div>
                  <div>
                    <label htmlFor="recurso-dia" className="font-body text-xs text-mauve block mb-1">Diâmetro (DIA)</label>
                    <input id="recurso-dia" type="text" value={f.dia} onChange={e => set('dia', e.target.value)} placeholder="Ex.: 14.2" className={gradeCls} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="recurso-notes" className="font-body text-xs text-mauve block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea id="recurso-notes" value={f.notes} onChange={e => set('notes', e.target.value)} rows={2} className={`${inputCls} flex-1 min-w-0`} />
              <VoiceInput onResult={t => setF(s => ({ ...s, notes: (s.notes ? s.notes + ' ' : '') + t }))} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {f.file_url ? (
              <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-body text-xs text-petal hover:underline">
                <Paperclip size={13} /> Foto anexada
              </a>
            ) : (
              <button onClick={() => scanRef.current?.click()}
                className="inline-flex items-center gap-1.5 font-body text-xs text-mauve hover:text-petal transition-colors">
                <Camera size={13} /> {isVisual ? 'Anexar / escanear receita' : 'Anexar foto'}
              </button>
            )}
            <button onClick={save} disabled={saving || !f.name.trim()}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
        </Card>
      )}

      {!showForm && err && <p className="font-body text-xs text-red-500">{err}</p>}

      {!loading && items.length > 0 && (
        <ViewModeSwitcher
          modes={[{ value: 'tipo', label: 'Por tipo' }, { value: 'situacao', label: 'Por situação' }]}
          active={view} onChange={setView}
        />
      )}

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Package size={26} className="text-petal" />}
          title="Nenhum recurso registrado"
          message="Registre óculos, lentes, dispositivos, próteses, auxílios ou itens de compressão que você usa. Você pode escanear a receita dos óculos para preencher o grau automaticamente."
          action={
            <button onClick={() => startAdd()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus size={15} /> Adicionar recurso
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(g => (
            <div key={g.key}>
              <p className="font-display text-base font-semibold text-onyx mb-2">{g.label}</p>
              <div className="space-y-2">{g.rows.map(card)}</div>
            </div>
          ))}
        </div>
      )}

      <p className="font-body text-[11px] text-mauve text-center leading-relaxed">
        Registro do que você informa. A SINTERA não identifica, não infere e não interpreta.
      </p>
    </div>
  )
}
