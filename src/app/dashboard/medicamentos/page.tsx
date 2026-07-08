'use client'

// ============================================================
// Medicamentos em uso — lista contínua (em uso / suspenso)
// ============================================================
// A usuária registra os próprios medicamentos. Organização factual e
// autorrelatada — a plataforma NÃO prescreve nem orienta dose; quem indica
// é o médico. Cada medicamento tem estado (em uso / suspenso), dose,
// frequência e desde quando.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, X, Pill, ArrowLeft, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import CreateRecordMenu from '@/components/ui/CreateRecordMenu'
import { runoutDate, nextRepurchaseDate } from '@/lib/medications/repurchase'
import { scanMedicationImage, PENDING_MED_SCAN_KEY } from '@/lib/medications/scanImage'
import { useStickyView } from '@/lib/ui/useStickyView'
import ListCard, { CardChip } from '@/components/ListCard'
import ViewModeSwitcher from '@/components/ViewModeSwitcher'
import { healthEventToRow } from '@/lib/agenda/event'

type Status = 'em_uso' | 'programado' | 'suspenso' | 'encerrado'
type Kind = 'medicamento' | 'suplemento' | 'produto' | 'dispositivo' | 'outro'

// Forma farmacêutica → SUGERE a unidade inicial do conteúdo (o campo é editável).
// A estimativa de duração NÃO depende da forma: calcula sempre que o consumo por dia
// estiver na MESMA unidade do conteúdo (ex.: 50 g de gel, 2 g/dia → 25 dias).
const FORMS: { value: string; label: string; unit: string }[] = [
  { value: 'comprimido',     label: 'Comprimido',     unit: 'comprimidos' },
  { value: 'capsula',        label: 'Cápsula',        unit: 'cápsulas' },
  { value: 'dragea',         label: 'Drágea',         unit: 'drágeas' },
  { value: 'solucao_oral',   label: 'Solução oral',   unit: 'mL' },
  { value: 'suspensao_oral', label: 'Suspensão oral', unit: 'mL' },
  { value: 'xarope',         label: 'Xarope',         unit: 'mL' },
  { value: 'gotas',          label: 'Gotas',          unit: 'mL' },
  { value: 'spray',          label: 'Spray',          unit: 'doses' },
  { value: 'gel',            label: 'Gel',            unit: 'g' },
  { value: 'creme',          label: 'Creme',          unit: 'g' },
  { value: 'pomada',         label: 'Pomada',         unit: 'g' },
  { value: 'locao',          label: 'Loção',          unit: 'mL' },
  { value: 'injetavel',      label: 'Injetável',      unit: 'mL' },
  { value: 'colirio',        label: 'Colírio',        unit: 'mL' },
  { value: 'sache',          label: 'Sachê',          unit: 'sachês' },
  { value: 'adesivo',        label: 'Adesivo',        unit: 'adesivos' },
  { value: 'outro',          label: 'Outro',          unit: '' },
]
const ROUTES = ['Oral', 'Tópica', 'Oftálmica', 'Nasal', 'Inalatória', 'Sublingual', 'Vaginal', 'Retal', 'Intramuscular', 'Endovenosa', 'Subcutânea', 'Outra']
function formMetaOf(value: string) { return FORMS.find(f => f.value === value) ?? null }

interface Med {
  id: string
  name: string
  kind: Kind
  brand: string | null
  dose: string | null
  frequency: string | null
  startedOn: string | null
  untilOn: string | null
  status: Status
  notes: string | null
  acquiredQty: number | null
  packQty: number | null
  dailyCons: number | null
  purchasedOn: string | null
  purchaseStatus: string | null
  amountCents: number | null
  repurchaseReminder: boolean
  repurchaseFreq: string | null
  repurchaseEventId: string | null
  purchaseEventId: string | null
  form: string | null
  route: string | null
  packUnit: string | null
  prescriber: string | null
}

function fmtFull(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtShort(date: string): string { return `${date.slice(8, 10)}/${date.slice(5, 7)}` }
export default function MedicamentosPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [meds, setMeds] = useState<Med[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [listView, setListView] = useStickyView<'tipo' | 'situacao'>('sintera:view:medicamentos', 'situacao')

  const [showForm, setShowForm] = useState(false)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  // O formulário abre acima das listas; ao editar um item lá embaixo (ex.: suplemento)
  // ele abria fora da tela. Rolamos até ele ao abrir/trocar de item editado.
  const formRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (showForm) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [showForm, editingId])
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Kind>('medicamento')
  const [medStatus, setMedStatus] = useState<Status>('em_uso')
  const [brand, setBrand] = useState('')
  const [dose, setDose] = useState('')
  const [freq, setFreq] = useState('')
  const [acquiredQty, setAcquiredQty] = useState('')
  const [amount, setAmount] = useState('')
  const [repurchaseFreq, setRepurchaseFreq] = useState('')
  const [startedOn, setStartedOn] = useState('')
  const [untilOn, setUntilOn] = useState('')
  const [notes, setNotes] = useState('')
  const [packQty, setPackQty] = useState('')
  const [dailyCons, setDailyCons] = useState('')
  const [purchasedOn, setPurchasedOn] = useState('')
  const [purchaseStatus, setPurchaseStatus] = useState('')
  const [form, setForm] = useState('')
  const [route, setRoute] = useState('')
  const [packUnit, setPackUnit] = useState('')
  const [prescriber, setPrescriber] = useState('')
  const [repurchase, setRepurchase] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanErr, setScanErr] = useState<string | null>(null)
  type ScanItem = { name: string; dose: string | null; frequency: string | null; startedOn?: string | null; acquiredQty?: number | null; packQty?: number | null; dailyCons?: number | null; purchasedOn?: string | null; form?: string | null; route?: string | null; packUnit?: string | null; prescriber?: string | null }
  const [scanResults, setScanResults] = useState<ScanItem[]>([])
  // Item do scan atualmente carregado no formulário — só sai da lista após salvar,
  // para permitir tratar VÁRIOS produtos da mesma receita, um a um.
  const [scanEditing, setScanEditing] = useState<ScanItem | null>(null)

  async function handleScan(file: File) {
    setScanErr(null); setScanning(true); setScanResults([])
    const r = await scanMedicationImage(file)
    setScanning(false)
    if (!r.ok) { setScanErr(r.error ?? 'Falha ao processar a imagem.'); return }
    if (!r.items.length) { setScanErr('Não consegui ler os dados do rótulo/receita. Tente um PDF legível ou uma foto nítida, aproximada e bem iluminada.'); return }
    setScanResults(r.items as ScanItem[])
    setShowForm(false)
  }

  async function handleVoiceAdd(text: string) {
    if (!text.trim()) return
    setScanErr(null); setScanning(true); setScanResults([])
    try {
      const resp = await fetch('/api/medications/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const j = await resp.json().catch(() => ({}))
      if (!resp.ok) { setScanErr(j.error ?? 'Falha ao interpretar.'); return }
      // Sem itens estruturados → usa a própria fala como nome (a usuária ajusta).
      setScanResults(j.items?.length ? j.items : [{ name: text.trim(), dose: null, frequency: null, startedOn: null, packQty: null, dailyCons: null, purchasedOn: null }])
      setShowForm(false)
    } finally { setScanning(false) }
  }

  function applyScanned(it: ScanItem) {
    setEditingId(null); setKind('medicamento'); setName(it.name); setDose(it.dose ?? ''); setFreq(it.frequency ?? '')
    setStartedOn(it.startedOn ?? ''); setUntilOn(''); setNotes('')
    setAcquiredQty(it.acquiredQty != null ? String(it.acquiredQty) : '')
    setPackQty(it.packQty != null ? String(it.packQty) : ''); setDailyCons(it.dailyCons != null ? String(it.dailyCons) : '')
    setPurchasedOn(it.purchasedOn ?? ''); setPurchaseStatus(it.purchasedOn ? 'comprado' : ''); setRepurchase(false); setErr(null)
    setForm(it.form ?? ''); setRoute(it.route ?? ''); setPackUnit(it.packUnit ?? formMetaOf(it.form ?? '')?.unit ?? ''); setPrescriber(it.prescriber ?? '')
    if (it.acquiredQty != null || it.packQty != null || it.dailyCons != null || it.purchasedOn) setShowMoreDetails(true)
    setScanEditing(it)
    setShowForm(true)
  }

  // Identidade composta p/ detectar duplicata: nome + dose/concentração + forma.
  // Evita colidir apresentações diferentes (ex.: Testogel 50 mg/g × 16,2 mg/g).
  // Futuro: um identificador sanitário canônico substitui esta identidade.
  const normStr = (s: string | null | undefined) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  // Duplicata: nome + dose obrigatórios; a FORMA só distingue quando AMBOS os lados a
  // têm e diferem — não quebra o casamento quando um está vazio (ex.: cadastro antigo
  // sem forma vs. scan que agora detecta a forma). Distingue apresentações reais.
  function findDuplicate(it: ScanItem): Med | null {
    const n = normStr(it.name), d = normStr(it.dose), f = normStr(it.form)
    return meds.find(m => {
      if (normStr(m.name) !== n || normStr(m.dose) !== d) return false
      const mf = normStr(m.form)
      return !(mf && f && mf !== f)
    }) ?? null
  }
  // "Atualizar informações": abre o medicamento existente e sobrepõe só os campos
  // que vieram do scan (mantém o resto). Não cria um segundo cadastro.
  function updateExistingFromScan(it: ScanItem, dup: Med) {
    openEdit(dup)
    if (it.dose) setDose(it.dose)
    if (it.frequency) setFreq(it.frequency)
    if (it.form) { setForm(it.form); setPackUnit(it.packUnit ?? formMetaOf(it.form)?.unit ?? '') }
    if (it.route) setRoute(it.route)
    if (it.acquiredQty != null) setAcquiredQty(String(it.acquiredQty))
    if (it.packQty != null) setPackQty(String(it.packQty))
    if (it.dailyCons != null) setDailyCons(String(it.dailyCons))
    if (it.purchasedOn) { setPurchasedOn(it.purchasedOn); setPurchaseStatus('comprado') }
    if (it.prescriber) setPrescriber(it.prescriber)
    if (it.acquiredQty != null || it.packQty != null || it.dailyCons != null || it.purchasedOn) setShowMoreDetails(true)
    setScanEditing(it); setShowForm(true)
  }

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('medications')
      .select('id, name, kind, brand, dose, frequency, started_on, until_date, status, notes, acquired_quantity, pack_quantity, daily_consumption, purchased_on, purchase_status, amount_cents, repurchase_reminder, repurchase_frequency, repurchase_event_id, purchase_event_id, pharmaceutical_form, administration_route, pack_unit, prescriber_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMeds(((data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string,
      name: (m.name as string) ?? '',
      kind: (['suplemento', 'produto', 'dispositivo', 'outro'].includes(m.kind as string) ? (m.kind as string) : 'medicamento') as Kind,
      brand: (m.brand as string) ?? null,
      dose: (m.dose as string) ?? null,
      frequency: (m.frequency as string) ?? null,
      startedOn: (m.started_on as string) ?? null,
      untilOn: (m.until_date as string) ?? null,
      status: (m.status as Status) ?? 'em_uso',
      notes: (m.notes as string) ?? null,
      acquiredQty: m.acquired_quantity != null ? Number(m.acquired_quantity) : null,
      packQty: m.pack_quantity != null ? Number(m.pack_quantity) : null,
      dailyCons: m.daily_consumption != null ? Number(m.daily_consumption) : null,
      purchasedOn: (m.purchased_on as string) ?? null,
      purchaseStatus: (m.purchase_status as string) ?? null,
      amountCents: m.amount_cents != null ? Number(m.amount_cents) : null,
      repurchaseReminder: m.repurchase_reminder === true,
      repurchaseFreq: (m.repurchase_frequency as string) ?? null,
      repurchaseEventId: (m.repurchase_event_id as string) ?? null,
      purchaseEventId: (m.purchase_event_id as string) ?? null,
      form: (m.pharmaceutical_form as string) ?? null,
      route: (m.administration_route as string) ?? null,
      packUnit: (m.pack_unit as string) ?? null,
      prescriber: (m.prescriber_name as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  // Handoff da captura da Home: se chegou uma foto já escaneada, abre a prévia "Detectado".
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_MED_SCAN_KEY)
      if (!raw) return
      sessionStorage.removeItem(PENDING_MED_SCAN_KEY)
      const items = JSON.parse(raw)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(items) && items.length) setScanResults(items as ScanItem[])
    } catch { /* ignora handoff inválido */ }
  }, [])

  // Abrir direto o medicamento indicado por ?edit=<id> (ex.: vindo do lembrete
  // "Recomprar" na Agenda — medicamentos editam-se AQUI, não no formulário de evento).
  const openedEditParam = useRef(false)
  useEffect(() => {
    if (openedEditParam.current || meds.length === 0) return
    const editId = new URLSearchParams(window.location.search).get('edit')
    if (!editId) return
    const m = meds.find(x => x.id === editId)
    if (m) { openEdit(m); openedEditParam.current = true }
  }, [meds])

  function reset() {
    setEditingId(null); setName(''); setKind('medicamento'); setBrand(''); setDose(''); setFreq(''); setStartedOn(''); setUntilOn(''); setNotes('')
    setAcquiredQty(''); setAmount(''); setPackQty(''); setDailyCons(''); setPurchasedOn(''); setPurchaseStatus(''); setRepurchase(false); setRepurchaseFreq(''); setErr(null)
    setForm(''); setRoute(''); setPackUnit(''); setPrescriber(''); setMedStatus('em_uso')
    setShowMoreDetails(false); setScanEditing(null)
  }
  function openEdit(m: Med) {
    setEditingId(m.id); setName(m.name); setKind(m.kind); setBrand(m.brand ?? ''); setDose(m.dose ?? ''); setFreq(m.frequency ?? '')
    setStartedOn(m.startedOn ?? ''); setUntilOn(m.untilOn ?? ''); setNotes(m.notes ?? '')
    setAcquiredQty(m.acquiredQty != null ? String(m.acquiredQty) : '')
    setAmount(m.amountCents != null ? (m.amountCents / 100).toFixed(2).replace('.', ',') : '')
    setPackQty(m.packQty != null ? String(m.packQty) : ''); setDailyCons(m.dailyCons != null ? String(m.dailyCons) : '')
    setPurchasedOn(m.purchasedOn ?? ''); setPurchaseStatus(m.purchaseStatus ?? ''); setRepurchase(m.repurchaseReminder); setRepurchaseFreq(m.repurchaseFreq ?? '')
    setForm(m.form ?? ''); setRoute(m.route ?? ''); setPackUnit(m.packUnit ?? ''); setPrescriber(m.prescriber ?? ''); setMedStatus(m.status)
    setShowMoreDetails(!!(m.startedOn || m.untilOn || m.notes || m.acquiredQty != null || m.amountCents != null || m.packQty != null || m.dailyCons != null || m.purchasedOn || m.purchaseStatus || m.repurchaseReminder))
    setErr(null); setShowForm(true)
  }

  async function save() {
    if (!user || saving || !name.trim()) return
    if ((kind === 'medicamento' || kind === 'suplemento') && !form) {
      setErr('Selecione a forma farmacêutica.'); return
    }
    setSaving(true); setErr(null)
    const num = (s: string) => { const v = parseFloat(s.replace(',', '.')); return isFinite(v) && v > 0 ? v : null }
    // "250,00" | "R$ 1.500,00" → centavos. Vazio/inválido → null.
    const toCents = (s: string) => {
      let t = s.trim().replace(/[R$\s]/g, ''); if (!t) return null
      if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
      const v = parseFloat(t); return isFinite(v) && v >= 0 ? Math.round(v * 100) : null
    }
    const payload = {
      name: name.trim(), kind, brand: brand.trim() || null, dose: dose.trim() || null, frequency: freq.trim() || null,
      started_on: startedOn || null, until_date: untilOn || null, notes: notes.trim() || null,
      acquired_quantity: num(acquiredQty), pack_quantity: num(packQty), daily_consumption: num(dailyCons),
      purchased_on: purchasedOn || null, purchase_status: purchaseStatus || null, amount_cents: toCents(amount),
      repurchase_reminder: repurchase, repurchase_frequency: repurchase ? (repurchaseFreq || null) : null,
      pharmaceutical_form: form || null, administration_route: route || null, pack_unit: packUnit.trim() || null,
      prescriber_name: prescriber.trim() || null, status: medStatus,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const existing = editingId ? meds.find(m => m.id === editingId) : null
    const status: Status = medStatus
    let medId: string | null = editingId
    if (editingId) {
      const { error } = await db.from('medications').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingId)
      if (error) { setErr(error.message); setSaving(false); return }
    } else {
      const { data, error } = await db.from('medications').insert({ ...payload, user_id: user.id }).select('id').single()
      if (error) { setErr(error.message); setSaving(false); return }
      medId = (data?.id as string) ?? null
    }

    // Lembrete de recompra (reaproveita o worker de lembretes via agenda_events).
    // Data pela HIERARQUIA oficial: cálculo por consumo tem prioridade; na ausência
    // dele, usa a recorrência declarada (mensal…anual) — antes só o consumo agendava,
    // então uma recorrência "trimestral" sem consumo nunca gerava evento (bug corrigido).
    if (medId) {
      const rec = nextRepurchaseDate(purchasedOn || null, num(packQty), num(dailyCons), num(acquiredQty), repurchaseFreq || null)
      const wants = repurchase && status === 'em_uso' && !!rec
      const existingEvent = existing?.repurchaseEventId ?? null
      try {
        if (wants) {
          if (existingEvent) {
            await db.from('agenda_events').update({ title: `Recomprar: ${name.trim()}`, event_date: rec, status: 'pending', reminder_enabled: true, reminder_sent_at: null }).eq('id', existingEvent)
          } else {
            const { data: ev } = await db.from('agenda_events').insert({ user_id: user.id, event_type: 'medicacao', title: `Recomprar: ${name.trim()}`, event_date: rec, status: 'pending', reminder_enabled: true }).select('id').single()
            if (ev?.id) await db.from('medications').update({ repurchase_event_id: ev.id }).eq('id', medId)
          }
        } else if (existingEvent) {
          await db.from('agenda_events').delete().eq('id', existingEvent)
          await db.from('medications').update({ repurchase_event_id: null }).eq('id', medId)
        }
      } catch { /* lembrete é best-effort, não bloqueia o salvamento */ }
    }

    // Evento canônico de COMPRA (Opção A): marcar "comprado" emite um health_events
    // que alimenta Gastos + Histórico + Dashboard por origem única. Idempotente via
    // purchase_event_id (editar atualiza o mesmo evento; despublicar remove).
    if (medId) {
      const wantsPurchase = purchaseStatus === 'comprado' && !!purchasedOn
      const existingPurchase = existing?.purchaseEventId ?? null
      // kind → event_type válido (CHECK health_events): produto/dispositivo → 'outro'
      const evType = kind === 'medicamento' ? 'medicamento' : kind === 'suplemento' ? 'suplemento' : 'outro'
      try {
        if (wantsPurchase) {
          const row = healthEventToRow(user.id, {
            ...(existingPurchase ? { id: existingPurchase } : {}),
            type: evType, title: `Compra: ${name.trim()}`, date: purchasedOn,
            status: 'realizado', source: 'system', directExpense: true,
            amountCents: toCents(amount),
          })
          const { data: pev } = await db.from('health_events').upsert(row).select('id').single()
          if (pev?.id && pev.id !== existingPurchase) {
            await db.from('medications').update({ purchase_event_id: pev.id }).eq('id', medId)
          }
        } else if (existingPurchase) {
          await db.from('health_events').delete().eq('id', existingPurchase)
          await db.from('medications').update({ purchase_event_id: null }).eq('id', medId)
        }
      } catch { /* projeção best-effort: não bloqueia o salvamento do medicamento */ }
    }
    // Só agora (salvo com sucesso) o item do scan sai da lista de detectados.
    if (scanEditing) setScanResults(prev => prev.filter(x => x !== scanEditing))
    setSaving(false)
    reset(); setShowForm(false); await load()
  }


  async function remove(m: Med) {
    if (busyId) return
    if (!window.confirm(`Remover "${m.name}" da sua lista?`)) return
    setBusyId(m.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    if (m.repurchaseEventId) await db.from('agenda_events').delete().eq('id', m.repurchaseEventId)
    if (m.purchaseEventId) await db.from('health_events').delete().eq('id', m.purchaseEventId)
    await db.from('medications').delete().eq('id', m.id)
    await load(); setBusyId(null)
  }

  const KIND_LABEL: Record<Kind, string> = { medicamento: 'Medicamentos', suplemento: 'Suplementos', produto: 'Produtos', dispositivo: 'Dispositivos', outro: 'Outros' }
  const STATUS_LABEL: Record<Status, string> = { em_uso: 'Em uso', programado: 'Programado', suspenso: 'Suspenso', encerrado: 'Encerrado' }
  const STATUS_TONE: Record<Status, string> = { em_uso: 'sage', programado: 'gold', suspenso: 'mauve', encerrado: 'neutral' }

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

  // Visão "Por situação": Em uso / Suspensos como agrupamento primário (lista corrida).
  function statusSection(s: Status) {
    const list = meds.filter(m => m.status === s)
    if (list.length === 0) return null
    return (
      <div key={s}>
        <p className="font-display text-base font-semibold text-onyx mb-2">{STATUS_LABEL[s]} ({list.length})</p>
        <div className={`space-y-3${s === 'suspenso' || s === 'encerrado' ? ' opacity-75' : ''}`}>{list.map(card)}</div>
      </div>
    )
  }

  function card(m: Med) {
    const meta = [formMetaOf(m.form ?? '')?.label, m.dose].filter(Boolean).join(' • ')
    const ro = runoutDate(m.purchasedOn, m.packQty, m.dailyCons, m.acquiredQty)
    const hasChips = m.purchaseStatus === 'a_comprar' || (m.purchaseStatus === 'comprado' && !!m.purchasedOn) || !!ro
    return (
      <ListCard key={m.id}
        title={m.name}
        onTitleClick={() => openEdit(m)}
        dim={m.status === 'suspenso' || m.status === 'encerrado'}
        trailing={<CardChip tone={STATUS_TONE[m.status]}>{STATUS_LABEL[m.status]}</CardChip>}
        meta={meta || undefined}
        chips={hasChips ? (
          <>
            {m.purchaseStatus === 'a_comprar' && <CardChip tone="gold">A comprar</CardChip>}
            {m.purchaseStatus === 'comprado' && m.purchasedOn && <CardChip tone="sage">Compra {fmtShort(m.purchasedOn)}</CardChip>}
            {ro && <CardChip tone="petal">Recompra {fmtShort(ro)}{m.repurchaseReminder ? ' ✓' : ''}</CardChip>}
          </>
        ) : undefined}
        actions={
          <>
            <button title="Editar" onClick={() => openEdit(m)}
              className="w-6 h-6 rounded-lg hover:bg-blush flex items-center justify-center text-mauve/40 hover:text-petal transition-colors"><Pencil size={12} /></button>
            <button title="Remover" disabled={busyId === m.id} onClick={() => remove(m)}
              className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve/40 hover:text-red-400 transition-colors disabled:opacity-40"><Trash2 size={12} /></button>
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-petal mb-2">
            <Pill size={16} />
            <span className="font-body text-xs font-medium uppercase tracking-wider">Medicamentos e Suplementos</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-onyx">Medicamentos e Suplementos</h1>
          <p className="font-body text-sm text-mauve mt-1">Registre o que você usa. A SINTERA organiza — quem prescreve é o seu médico.</p>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end flex-shrink-0">
          {showForm ? (
            <button onClick={() => { reset(); setShowForm(false) }}
              className="flex items-center gap-2 px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium hover:opacity-90 transition-opacity">
              <X size={15} /> Fechar
            </button>
          ) : (
            // Menu de criação de registros (padrão oficial DS-001) — MESMO em todo módulo.
            <CreateRecordMenu label="Novo medicamento ou suplemento" onFile={handleScan}
              fileAccept="application/pdf,image/*" busy={scanning} busyLabel="Lendo…"
              onManual={() => { reset(); setShowForm(true) }}>
              <VoiceInput onResult={(t) => handleVoiceAdd(t)} label="Falar" title="Adicionar por voz"
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-blush text-left font-body text-sm text-onyx transition-colors" />
            </CreateRecordMenu>
          )}
        </div>
      </div>

      {/* Erro de leitura (foto/voz) — fica visível mesmo com o formulário fechado */}
      {scanErr && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="font-body text-xs text-red-600">{scanErr}</p>
          <button onClick={() => setScanErr(null)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Resultados do escaneamento — conferir antes de adicionar */}
      {scanResults.some(x => x !== scanEditing) && (
        <div className="card-premium p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm font-semibold text-onyx">Detectado — confira e adicione{scanResults.filter(x => x !== scanEditing).length > 1 ? ' (um de cada vez)' : ''}</p>
            <button onClick={() => setScanResults([])} className="text-mauve/50 hover:text-onyx"><X size={15} /></button>
          </div>
          <p className="font-body text-[11px] text-mauve/60">Transcrição automática (arquivo, foto ou voz). Revise antes de salvar — a plataforma só organiza, não prescreve.</p>
          {scanResults.filter(x => x !== scanEditing).map((it, i) => {
            const dup = findDuplicate(it)
            return (
            <div key={i} className="rounded-xl border border-border bg-ivory px-3 py-2 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-onyx break-words">{it.name}</p>
                  <p className="font-body text-[11px] text-mauve/70">{[it.dose, formMetaOf(it.form ?? '')?.label, it.frequency, it.startedOn ? `desde ${it.startedOn}` : null].filter(Boolean).join(' · ') || 'Sem dose/frequência detectada'}</p>
                </div>
                {!dup && (
                  <button onClick={() => applyScanned(it)}
                    className="px-3 py-1.5 rounded-full gradient-sintera text-white font-body text-xs font-medium flex-shrink-0 hover:opacity-90">Usar</button>
                )}
              </div>
              {dup && (
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 font-body text-[10px] font-semibold text-gold bg-warm border border-amber-200 rounded-full px-2 py-0.5">Já está na sua lista</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => { openEdit(dup); setScanEditing(null); setScanResults(prev => prev.filter(x => x !== it)) }}
                      className="px-2.5 py-1 rounded-full border border-petal/40 text-petal font-body text-[11px] font-medium hover:bg-blush">Abrir existente</button>
                    <button onClick={() => updateExistingFromScan(it, dup)}
                      className="px-2.5 py-1 rounded-full gradient-sintera text-white font-body text-[11px] font-medium hover:opacity-90">Atualizar informações</button>
                    <button onClick={() => applyScanned(it)}
                      className="px-2.5 py-1 rounded-full border border-border text-mauve font-body text-[11px] font-medium hover:bg-white">Criar outro mesmo assim</button>
                  </div>
                </div>
              )}
            </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div ref={formRef} className="card-premium p-5 space-y-3 scroll-mt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Tipo</label>
              <select value={kind} onChange={e => setKind(e.target.value as Kind)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="medicamento">Medicamento</option>
                <option value="suplemento">Suplemento</option>
                <option value="produto">Produto</option>
                <option value="dispositivo">Dispositivo</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Situação</label>
              <select value={medStatus} onChange={e => setMedStatus(e.target.value as Status)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="em_uso">Em uso</option>
                <option value="programado">Programado</option>
                <option value="suspenso">Suspenso</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Nome do {kind === 'suplemento' ? 'suplemento' : kind === 'produto' ? 'produto' : kind === 'dispositivo' ? 'dispositivo' : 'medicamento'}</label>
            <div className="flex items-center gap-2">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={kind === 'suplemento' ? 'Ex.: Vitamina D' : kind === 'produto' ? 'Ex.: Lente de contato' : kind === 'dispositivo' ? 'Ex.: Medidor de glicose' : 'Ex.: Losartana'}
                className="flex-1 min-w-0 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setName(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {(kind === 'medicamento' || kind === 'suplemento') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Forma farmacêutica</label>
              <select value={form} onChange={e => { setForm(e.target.value); setPackUnit(formMetaOf(e.target.value)?.unit ?? '') }}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="">Selecione…</option>
                {FORMS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Via de administração <span className="font-normal text-mauve/50">(opcional)</span></label>
              <select value={route} onChange={e => setRoute(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="">Selecione…</option>
                {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Marca / Fabricante (opcional)</label>
              <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ex.: EMS, Bayer…"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            {kind !== 'produto' && (
              <div>
                <label className="font-body text-xs text-mauve/70 block mb-1">{kind === 'dispositivo' ? 'Modelo / especificação' : 'Dose ou especificação'} <span className="font-normal text-mauve/50">(opcional)</span></label>
                <input type="text" value={dose} onChange={e => setDose(e.target.value)} placeholder={kind === 'dispositivo' ? 'Ex.: modelo / grau' : 'Ex.: 50 mg'}
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              </div>
            )}
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Médico(a) que prescreveu <span className="font-normal text-mauve/50">(opcional)</span></label>
            <input type="text" value={prescriber} onChange={e => setPrescriber(e.target.value)} placeholder="Ex.: Dra. Ana Souza"
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Valor pago — R$ <span className="font-normal text-mauve/50">(opcional)</span></label>
            <input type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex.: 250,00"
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <button type="button" onClick={() => setShowMoreDetails(v => !v)}
            className="w-full flex items-center justify-between px-1 py-1.5 font-body text-sm text-petal hover:text-petal/80 transition-colors">
            <span>Mais detalhes <span className="font-normal text-mauve/50">— uso contínuo, compra e recompra</span></span>
            <ChevronDown size={16} className={`transition-transform ${showMoreDetails ? 'rotate-180' : ''}`} />
          </button>
          {showMoreDetails && (
          <div className="space-y-3 pt-1 border-t border-border/40">
          {(kind === 'medicamento' || kind === 'suplemento') && (
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Frequência de uso (opcional)</label>
              <input type="text" value={freq} onChange={e => setFreq(e.target.value)} placeholder="Ex.: 1x ao dia"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          {!repurchase && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Início de uso (opcional)</label>
              <input type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label className="font-body text-xs text-mauve/70 block mb-1">Data limite (opcional)</label>
              <input type="date" value={untilOn} onChange={e => setUntilOn(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <p className="font-body text-[10px] text-mauve/50 mt-1">Em branco = sem previsão.</p>
            </div>
          </div>
          )}
          <div>
            <label className="font-body text-xs text-mauve/70 block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="flex-1 min-w-0 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setNotes(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>

          {/* Compra e recompra (opcional) */}
          <div className="rounded-xl border border-border bg-ivory/40 p-3 space-y-3">
            <p className="font-body text-xs font-semibold text-onyx">Compra e recompra (opcional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-[11px] text-mauve/70 block mb-1">Quantidade adquirida</label>
                <input type="text" inputMode="decimal" value={acquiredQty} onChange={e => setAcquiredQty(e.target.value)} placeholder="Ex.: 2 caixas"
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30" />
              </div>
              <div>
                <label className="font-body text-[11px] text-mauve/70 block mb-1">Conteúdo da embalagem</label>
                <div className="flex items-center gap-1.5">
                  <input type="text" inputMode="decimal" value={packQty} onChange={e => setPackQty(e.target.value)} placeholder="Ex.: 30"
                    className="flex-1 min-w-0 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30" />
                  <input type="text" value={packUnit} onChange={e => setPackUnit(e.target.value)} placeholder="un." aria-label="Unidade do conteúdo" title="Unidade (definida pela forma; editável)"
                    className="w-20 flex-shrink-0 px-2 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white text-center focus:outline-none focus:ring-1 focus:ring-petal/30" />
                </div>
              </div>
            </div>
            {(kind === 'medicamento' || kind === 'suplemento') && (
              <div>
                <label className="font-body text-[11px] text-mauve/70 block mb-1">Consumo por dia{packUnit ? <span className="font-normal text-mauve/50"> (em {packUnit})</span> : null}</label>
                <input type="text" inputMode="decimal" value={dailyCons} onChange={e => setDailyCons(e.target.value)} placeholder="Ex.: 2"
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-[11px] text-mauve/70 block mb-1">Comprado em</label>
                <input type="date" value={purchasedOn} onChange={e => setPurchasedOn(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30" />
              </div>
              <div>
                <label className="font-body text-[11px] text-mauve/70 block mb-1">Situação</label>
                <select value={purchaseStatus} onChange={e => setPurchaseStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30">
                  <option value="">—</option>
                  <option value="a_comprar">A comprar</option>
                  <option value="comprado">Comprado</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 font-body text-sm text-onyx cursor-pointer">
              <input type="checkbox" checked={repurchase} onChange={e => { setRepurchase(e.target.checked); if (e.target.checked) setShowMoreDetails(true) }} className="accent-petal w-4 h-4" />
              Compra recorrente (uso contínuo)
            </label>
            {repurchase && (
              <div className="space-y-3 rounded-lg bg-blush/20 border border-petal/15 p-2.5">
                <div>
                  <label className="font-body text-[11px] text-mauve/70 block mb-1">Frequência da compra</label>
                  <select value={repurchaseFreq} onChange={e => setRepurchaseFreq(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30">
                    <option value="">Com que frequência você recompra?</option>
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-body text-[11px] text-mauve/70 block mb-1">A partir de</label>
                    <input type="date" value={startedOn} onChange={e => setStartedOn(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30" />
                  </div>
                  <div>
                    <label className="font-body text-[11px] text-mauve/70 block mb-1">Até <span className="font-normal text-mauve/50">(opcional)</span></label>
                    <input type="date" value={untilOn} onChange={e => setUntilOn(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30" />
                  </div>
                </div>
                <p className="font-body text-[10px] text-mauve/60 leading-relaxed">A previsão de recompra considera o uso conforme a orientação médica. Caso o consumo real seja diferente, a data prevista poderá variar e poderá haver sobra ou término antecipado do produto.</p>
              </div>
            )}
            {(() => {
              const num = (s: string) => { const v = parseFloat(s.replace(',', '.')); return isFinite(v) && v > 0 ? v : null }
              // Término: só quando conteúdo e consumo/dia estão na MESMA unidade.
              const ro = runoutDate(purchasedOn || null, num(packQty), num(dailyCons), num(acquiredQty))
              // Recompra: consumo tem prioridade; sem ele, usa a recorrência declarada
              // (quinzenal/mensal…) — assim prevê mesmo sem cálculo por g/mL.
              const rec = repurchase ? nextRepurchaseDate(purchasedOn || null, num(packQty), num(dailyCons), num(acquiredQty), repurchaseFreq || null) : null
              if (!ro && !rec) return <p className="font-body text-[10px] text-mauve/50">Informe o conteúdo, o consumo por dia (na mesma unidade do conteúdo) e a data de compra para estimar o término — ou marque a recompra e a frequência.</p>
              return (
                <p className="font-body text-[11px] text-petal">
                  {ro
                    ? <>Estimativa: acaba por volta de <strong>{fmtFull(ro)}</strong>{rec ? <>; recompra ~<strong>{fmtFull(rec)}</strong></> : null}.</>
                    : <>Recompra prevista para ~<strong>{fmtFull(rec!)}</strong>.</>}
                </p>
              )
            })()}
          </div>
          </div>
          )}

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
        <div className="space-y-6">
          <ViewModeSwitcher active={listView} onChange={setListView} modes={[{ value: 'situacao', label: 'Por situação' }, { value: 'tipo', label: 'Por tipo' }]} />
          <div className="space-y-8">
            {listView === 'tipo' ? (
              <>
                {kindSection('medicamento')}
                {kindSection('suplemento')}
                {kindSection('produto')}
                {kindSection('dispositivo')}
                {kindSection('outro')}
              </>
            ) : (
              <>
                {(['em_uso', 'programado', 'suspenso', 'encerrado'] as const).map(statusSection)}
              </>
            )}
          </div>
        </div>
      )}

      <p className="font-body text-[11px] text-mauve/50 text-center leading-relaxed">
        Organização da sua lista de medicamentos e suplementos. Não é prescrição nem orientação de dose — siga sempre a orientação do seu médico.
      </p>
    </div>
  )
}
