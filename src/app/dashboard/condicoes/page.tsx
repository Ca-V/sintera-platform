'use client'

// ============================================================
// Condições de Saúde — próprias + histórico familiar
// ============================================================
// Registro factual e autorrelatado. A SINTERA NUNCA identifica nem infere
// condições — apenas organiza o que a usuária informa OU o que está ESCRITO num
// documento (laudo/exame/atestado) que ela carrega. Captura documental (CAP-001):
// upload/foto/scan → IA transcreve → pré-preenche → usuária revisa e salva.
// Quando o documento é um EXAME/laudo com resultado, ele é salvo em PARALELO na
// página de Exames (salvamento duplo). Ver [[principio_rastreabilidade_documental]].
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Stethoscope, ArrowLeft, Trash2, Users, Pencil, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import ListCard from '@/components/ListCard'
import PageHeader from '@/components/PageHeader'
import { downscaleImageToPayload } from '@/lib/capture/downscaleImage'
import { Card } from "@/lib/ui/ds"
import Disclaimer from '@/components/ui/Disclaimer'
import CreateRecordMenu from '@/components/ui/CreateRecordMenu'
import { decideCaptureRouting } from '@/lib/capture/capture-routing'
import ProvenanceLine from '@/components/ui/ProvenanceLine'
import { examProvenance } from '@/lib/provenance'
import ConfirmDialog from '@/components/ConfirmDialog'

type Scope = 'propria' | 'familiar'

interface Condition {
  id: string
  scope: Scope
  name: string
  relative: string | null
  sinceLabel: string | null
  notes: string | null
  fileUrl: string | null
}

export default function CondicoesPage() {
  const { user, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Condition[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>('propria')
  const [name, setName] = useState('')
  const [relative, setRelative] = useState('')
  const [since, setSince] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Captura documental
  const [scanning, setScanning] = useState(false)
  const [scanErr, setScanErr] = useState<string | null>(null)
  // Nota informativa (não é erro): ex. documento é exame sem condição afirmada.
  const [scanInfo, setScanInfo] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [kind, setKind] = useState<string | null>(null)
  const [sourceHint, setSourceHint] = useState<'manual' | 'voice'>('manual')
  const [docMeta, setDocMeta] = useState<{ isExam: boolean; examType: string | null; examDate: string | null } | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from('health_conditions')
      .select('id, scope, name, relative, since_label, notes, file_url')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(c => ({
      id: c.id as string, scope: (c.scope as Scope) ?? 'propria', name: (c.name as string) ?? '',
      relative: (c.relative as string) ?? null, sinceLabel: (c.since_label as string) ?? null,
      notes: (c.notes as string) ?? null, fileUrl: (c.file_url as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function reset() {
    setEditingId(null); setScope('propria'); setName(''); setRelative(''); setSince(''); setNotes('')
    setErr(null); setPendingFile(null); setKind(null); setDocMeta(null); setScanErr(null); setScanInfo(null); setSourceHint('manual')
  }

  function startEdit(c: Condition) {
    reset()
    setEditingId(c.id); setScope(c.scope); setName(c.name)
    setRelative(c.relative ?? ''); setSince(c.sinceLabel ?? ''); setNotes(c.notes ?? '')
    setShowForm(true)
  }

  // Método escolhido no CreateRecordMenu: 'manual' abre form vazio; 'file'/'camera'
  // lê o documento com a IA e pré-preenche.
  async function onSelectMethod(method: string, file?: File) {
    if (method === 'manual') { reset(); setShowForm(true); return }
    if (!file) return
    if (file.size > 15 * 1024 * 1024) { setScanErr('Arquivo muito grande (máx. 15 MB).'); setShowForm(false); return }
    reset(); setScanning(true); setScanErr(null); setScanInfo(null); setShowForm(false)
    try {
      const { base64, mediaType } = await downscaleImageToPayload(file)
      const resp = await fetch('/api/vision/condition', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, mediaType }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || 'Falha ao ler o documento.')
      const r = json?.result as { name: string | null; kind: string; since: string | null; notes: string | null; isExam: boolean; examType: string | null; examDate: string | null } | null
      // Anexa o documento (será enviado ao salvar) e pré-preenche o que a IA leu.
      setPendingFile(file)
      setScope('propria')
      setName(r?.name ?? '')
      setSince(r?.since ?? '')
      setNotes(r?.notes ?? '')
      setKind(r?.kind ?? null)
      setDocMeta(r ? { isExam: r.isExam, examType: r.examType, examDate: r.examDate } : { isExam: false, examType: null, examDate: null })
      // Sem name pode ser: (a) documento é exame sem condição afirmada (NORMAL, não é
      // erro) — RDC 657: não inferir; ou (b) o documento realmente não traz condição.
      if (!r?.name) {
        if (r?.isExam) {
          setScanInfo('Este documento refere-se a exames — será salvo em Exames. Ele não afirma uma condição de saúde; se quiser registrar uma, preencha o nome abaixo (opcional).')
        } else {
          setScanInfo('Não identifiquei uma condição afirmada no documento. Preencha o nome abaixo se quiser registrar uma.')
        }
      }
      setShowForm(true)
    } catch (e) {
      setScanErr(e instanceof Error ? e.message : 'Falha ao processar o documento.')
    } finally {
      setScanning(false)
    }
  }

  // Sobe o documento anexado ao storage e devolve a URL assinada (1 ano), como em Exames.
  async function uploadDoc(file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${user!.id}/${crypto.randomUUID()}.${ext}`
    const { error: upErr } = await supabase.storage.from('exams').upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) throw new Error(`[storage] ${upErr.message}`)
    const { data: signed, error: sErr } = await supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365)
    if (sErr || !signed) throw new Error('[signed-url] falha ao gerar link do documento')
    return signed.signedUrl
  }

  async function save() {
    const hasCondition = !!name.trim()
    // Decisão de roteamento (função pura, testada): o que persistir (exame/condição/vínculo).
    const routing = decideCaptureRouting({ hasCondition, isExam: !!docMeta?.isExam, hasFile: !!pendingFile })
    if (!user || saving || !routing.canSave) return
    setSaving(true); setErr(null)
    try {
      let fileUrl: string | null = null
      if (pendingFile) fileUrl = await uploadDoc(pendingFile)

      // EXAME: se o documento é laudo laboratorial/imagem, cria o Exame SEMPRE —
      // independentemente do resultado (normal/negativo/positivo) ou de haver condição.
      // A existência do exame não depende da conclusão clínica. Criado antes para
      // vincular a condição (o vínculo pode existir ou não).
      let examId: string | null = null
      if (routing.createExam && fileUrl) {
        examId = crypto.randomUUID()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('exams').insert({
          id: examId, user_id: user.id,
          // Placeholder neutro — a captura NÃO nomeia o documento. A análise aplica o
          // nome DETERMINÍSTICO (Content Classifier), fonte única de nomenclatura.
          type: 'Exame',
          exam_date: docMeta?.examDate ?? null, file_url: fileUrl, status: 'pending',
        })
        // Dispara a extração no servidor: nomeia por categoria+escopo (display_title/
        // document_type/document_scope) e extrai biomarcadores. Fire-and-forget —
        // não bloqueia o salvamento da condição.
        fetch(`/api/exams/${examId}/analyze`, { method: 'POST' }).catch(() => {})
      }

      // CONDIÇÃO: só quando o documento afirma um diagnóstico/condição (ou digitada).
      if (routing.createCondition) {
        const payload: Record<string, unknown> = {
          user_id: user.id, scope, name: name.trim(),
          relative: scope === 'familiar' ? (relative.trim() || null) : null,
          since_label: since.trim() || null, notes: notes.trim() || null,
          kind: kind || null,
        }
        if (fileUrl) payload.file_url = fileUrl
        if (examId) payload.source_exam_id = examId
        // source só na criação (não sobrescreve na edição manual)
        if (!editingId) payload.source = pendingFile ? (docMeta?.isExam ? 'exam_report' : 'uploaded_document') : sourceHint
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = (supabase as any).from('health_conditions')
        const { error } = editingId ? await db.update(payload).eq('id', editingId) : await db.insert(payload)
        if (error) throw new Error(error.message)
      }
      reset(); setShowForm(false); await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  function remove(c: Condition) {
    if (busyId) return
    setConfirm({ message: `Remover "${c.name}"?`, confirmLabel: 'Remover', onYes: async () => {
      setBusyId(c.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('health_conditions').delete().eq('id', c.id)
      await load(); setBusyId(null)
    } })
  }

  const proprias = items.filter(i => i.scope === 'propria')
  const familiares = items.filter(i => i.scope === 'familiar')

  function card(c: Condition) {
    const meta = [c.relative, c.sinceLabel ? `desde ${c.sinceLabel}` : null].filter(Boolean).join(' • ')
    return (
      <ListCard key={c.id}
        title={c.name}
        onTitleClick={() => startEdit(c)}
        meta={
          (meta || c.notes || c.fileUrl) ? (
            <>
              {meta}
              {c.notes && <span className={meta ? 'block mt-0.5 text-mauve' : 'text-mauve'}>{c.notes}</span>}
              {c.fileUrl && (
                <span className="block mt-0.5">
                  <ProvenanceLine provenance={examProvenance({ fileUrl: c.fileUrl })} showOrigin={false} />
                </span>
              )}
            </>
          ) : undefined
        }
        actions={
          <>
            <button onClick={() => startEdit(c)} title="Editar"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-petal transition-colors"><Pencil size={12} /></button>
            <button onClick={() => remove(c)} disabled={busyId === c.id} title="Remover"
              className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"><Trash2 size={12} /></button>
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

      <PageHeader
        icon={<Stethoscope size={16} />}
        eyebrow="Condições"
        title="Condições de Saúde"
        subtitle={<>Carregue um laudo/exame (foto, arquivo ou scan) ou digite — a SINTERA lê e organiza. Se o documento for um exame, ele também é salvo em Exames.</>}
        action={
          <CreateRecordMenu
            label="Nova condição"
            methods={['file', 'camera', 'manual']}
            busy={scanning}
            busyLabel="Lendo documento…"
            voice={<VoiceInput onResult={t => { reset(); setSourceHint('voice'); setName(t); setShowForm(true) }} />}
            onSelect={onSelectMethod}
          />
        }
      />

      {scanErr && !showForm && <p className="font-body text-xs text-red-500">{scanErr}</p>}
      {scanInfo && !showForm && <p className="font-body text-xs text-onyx/60">{scanInfo}</p>}

      {showForm && (
        <Card padding="relaxed" className="space-y-3">
          {pendingFile && (
            <div className="flex items-start gap-2.5 rounded-xl border border-petal/30 bg-blush px-3 py-2.5">
              <FileText size={16} className="text-petal flex-shrink-0 mt-0.5" />
              <p className="font-body text-xs text-onyx leading-relaxed">
                {docMeta?.isExam ? (
                  <>Documento anexado. Como é um exame, será salvo em <strong>Exames</strong> — independentemente do resultado; o nome do documento é definido automaticamente pela plataforma. {name.trim() ? 'A condição abaixo é registrada e vinculada a ele.' : 'Se o documento afirmar uma condição, preencha o nome abaixo (opcional); senão, salvo só o exame.'}</>
                ) : (
                  <>Documento anexado — será salvo com a condição.</>
                )}
              </p>
            </div>
          )}
          {scanErr && <p className="font-body text-xs text-red-500">{scanErr}</p>}
          {scanInfo && <p className="font-body text-xs text-onyx/60">{scanInfo}</p>}
          <div>
            <label htmlFor="cond-tipo" className="font-body text-xs text-mauve block mb-1">Tipo</label>
            <select id="cond-tipo" value={scope} onChange={e => setScope(e.target.value as Scope)}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
              <option value="propria">Minha condição</option>
              <option value="familiar">Histórico familiar</option>
            </select>
          </div>
          <div>
            <label htmlFor="cond-nome" className="font-body text-xs text-mauve block mb-1">Condição</label>
            <div className="flex items-center gap-2">
              <input id="cond-nome" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Hipertensão"
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setName(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {scope === 'familiar' && (
            <div>
              <label htmlFor="cond-parente" className="font-body text-xs text-mauve block mb-1">Parente</label>
              <input id="cond-parente" type="text" value={relative} onChange={e => setRelative(e.target.value)} placeholder="Ex.: Mãe, avô paterno"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          <div>
            <label htmlFor="cond-desde" className="font-body text-xs text-mauve block mb-1">Desde quando (opcional)</label>
            <input id="cond-desde" type="text" value={since} onChange={e => setSince(e.target.value)} placeholder="Ex.: 2020, infância"
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          <div>
            <label htmlFor="cond-notas" className="font-body text-xs text-mauve block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea id="cond-notas" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setNotes(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { reset(); setShowForm(false) }}
              className="px-4 py-2 rounded-full border border-border text-mauve font-body text-sm hover:bg-ivory transition-colors">Cancelar</button>
            <button onClick={save} disabled={saving || !(name.trim() || (pendingFile && docMeta?.isExam))}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : editingId ? 'Salvar alterações' : (!name.trim() && pendingFile && docMeta?.isExam ? 'Salvar exame' : 'Salvar')}
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card padding="none" className="p-10 text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope size={15} className="text-petal" />
              <p className="font-display text-base font-semibold text-onyx">Minhas condições</p>
            </div>
            {proprias.length > 0 ? <div className="space-y-2">{proprias.map(card)}</div>
              : <p className="font-body text-sm text-mauve">Nenhuma registrada.</p>}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users size={15} className="text-petal" />
              <p className="font-display text-base font-semibold text-onyx">Histórico familiar</p>
            </div>
            {familiares.length > 0 ? <div className="space-y-2">{familiares.map(card)}</div>
              : <p className="font-body text-sm text-mauve">Nenhum registrado.</p>}
          </div>
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
