'use client'

// ============================================================
// Documentos — DOC-001 / DOC-002
// ============================================================
// Receita · Atestado · Relatório · Encaminhamento · Outros documentos clínicos.
// Domínio PRÓPRIO, separado de Exames: um atestado não é de um exame, e criar um
// documento NUNCA cria exame nem muta o registro-alvo (invariante testada no core).
//
// É o "local correto" que faltava: antes, a categoria escolhida em Adicionar
// registro não tinha para onde ir, e sumia na etapa de classificação.
//
// A SINTERA organiza o que a pessoa informa — transcreve fatos documentais
// (emissor, data, tipo) e NÃO interpreta conteúdo clínico (ADR-000 · RDC 657).
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Loader2, Plus, X, Trash2, Paperclip, FileHeart, FileText, FileCheck2, Share2, File,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import ListCard from '@/components/ListCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import Select from '@/components/ui/Select'
import AttachmentLink from '@/components/ui/AttachmentLink'
import Disclaimer from '@/components/ui/Disclaimer'
import { Card } from '@/lib/ui/ds'
// Helper do repositório: o cliente tipado resolve Insert como `never`, então TODA escrita da Web passa por
// `row()`. Não é gambiarra minha — é o padrão já usado por Recursos, Hábitos e demais páginas.
import { row } from '@/lib/supabase/db'
import {
  DOCUMENT_SUBTYPES, documentSubtypeLabel, allowedTargets, buildPatientDocumentInsert,
  supportedNowAcceptAttr, withinAttachmentLimit, MAX_ATTACHMENT_MB,
  type PatientDocumentSubtype,
} from '@sintera/core'

// Ícone por subtipo. Mapa EXAUSTIVO por construção: o TypeScript exige uma entrada para cada
// subtipo declarado no core, então acrescentar um subtipo lá quebra a compilação aqui em vez
// de cair silenciosamente num ícone genérico.
const SUBTYPE_ICON: Record<PatientDocumentSubtype, typeof FileText> = {
  receita: FileText,
  atestado: FileCheck2,
  relatorio: FileHeart,
  encaminhamento: Share2,
  outro: File,
}

type DocRow = {
  id: string
  subtype: PatientDocumentSubtype
  file_url: string
  issuer: string | null
  doc_date: string | null
  notes: string | null
  created_at: string
}

const COLUMNS = 'id, subtype, file_url, issuer, doc_date, notes, created_at'
const FILTER_ALL = 'todos'

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return d && m && y ? `${d}/${m}/${y}` : ''
}

export default function DocumentosPage() {
  const { user } = useUser()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(FILTER_ALL)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const [subtype, setSubtype] = useState<PatientDocumentSubtype>('receita')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [issuer, setIssuer] = useState('')
  const [docDate, setDocDate] = useState('')
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('patient_documents').select(COLUMNS)
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setRows((data as DocRow[] | null) ?? [])
    setLoading(false)
  }, [supabase, user])

  useEffect(() => { void load() }, [load])

  function resetForm() {
    setSubtype('receita'); setFileUrl(null); setFileName(null)
    setIssuer(''); setDocDate(''); setNotes(''); setErro(null)
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setErro(null)
    // Limite ÚNICO da plataforma (ANEXO-001) — nunca um número local.
    if (!withinAttachmentLimit(file.size)) {
      setErro(`O arquivo passa de ${MAX_ATTACHMENT_MB} MB.`)
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'pdf'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: upErr } = await supabase.storage.from('exams')
        .upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) { setErro('Não foi possível enviar o arquivo.'); return }
      const { data: signed } = await supabase.storage.from('exams')
        .createSignedUrl(path, 60 * 60 * 24 * 365)
      if (!signed?.signedUrl) { setErro('Não foi possível gerar o link do arquivo.'); return }
      setFileUrl(signed.signedUrl)
      setFileName(file.name)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function onSave() {
    if (!user) return
    if (!fileUrl) { setErro('Anexe o documento.'); return }
    setSaving(true)
    try {
      // A LINHA é montada pelo domínio (core), não aqui: os defaults de `source`/`status` e a forma da
      // inserção têm um dono só, compartilhado com o Mobile. A página só coleta o que a pessoa digitou.
      const docRow = buildPatientDocumentInsert(user.id, {
        file_url: fileUrl,
        subtype,
        issuer: issuer.trim() || null,
        doc_date: docDate || null,
        notes: notes.trim() || null,
      })
      const { error } = await supabase.from('patient_documents').insert(row(docRow))
      if (error) { setErro('Não foi possível salvar o documento.'); return }
      setOpen(false); resetForm(); await load()
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    setConfirmId(null)
    if (!user) return
    await supabase.from('patient_documents').delete().eq('id', id).eq('user_id', user.id)
    await load()
  }

  const visible = filter === FILTER_ALL ? rows : rows.filter(r => r.subtype === filter)

  // Contagem por subtipo, para o seletor dizer quantos há de cada — sem uma segunda consulta.
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.subtype] = (acc[r.subtype] ?? 0) + 1
    return acc
  }, {})

  const filterOptions = [
    { value: FILTER_ALL, label: `Todos (${rows.length})` },
    ...DOCUMENT_SUBTYPES.map(s => ({ value: s.value, label: `${s.label} (${counts[s.value] ?? 0})` })),
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<FileHeart size={22} />}
        title="Documentos"
        subtitle="Receitas, atestados, relatórios e encaminhamentos — guardados com emissor e data."
        action={
          <button
            onClick={() => { resetForm(); setOpen(true) }}
            className="inline-flex items-center gap-2 rounded-full bg-petal px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={16} /> Adicionar
          </button>
        }
      />

      <Disclaimer />

      {rows.length > 0 && (
        <Select
          value={filter}
          onChange={setFilter}
          options={filterOptions}
          title="Filtrar por tipo"
          className="max-w-xs"
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-mauve" /></div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<FileHeart size={28} />}
          title={rows.length === 0 ? 'Nenhum documento ainda' : 'Nenhum documento deste tipo'}
          message={
            rows.length === 0
              ? 'Guarde aqui receitas, atestados, relatórios e encaminhamentos. O documento original fica sempre acessível.'
              : 'Troque o filtro para ver os outros tipos.'
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map(r => {
            const Icon = SUBTYPE_ICON[r.subtype]
            const when = formatDate(r.doc_date)
            return (
              <ListCard
                key={r.id}
                leading={<Icon size={18} />}
                title={documentSubtypeLabel(r.subtype)}
                meta={[r.issuer, when].filter(Boolean).join(' · ') || 'Sem emissor informado'}
                chips={<AttachmentLink url={r.file_url} label="Ver documento" icon={<Paperclip size={14} />} />}
                actions={
                  <button
                    onClick={() => setConfirmId(r.id)}
                    aria-label="Excluir documento"
                    className="rounded-full p-2 text-mauve hover:bg-black/[0.04]"
                  >
                    <Trash2 size={16} />
                  </button>
                }
              />
            )
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Adicionar documento</h2>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-full p-2 hover:bg-black/[0.04]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-mauve">Tipo de documento</label>
                <Select
                  value={subtype}
                  onChange={v => setSubtype(v as PatientDocumentSubtype)}
                  options={DOCUMENT_SUBTYPES.map(s => ({ value: s.value, label: s.label }))}
                  title="Tipo de documento"
                />
                {/* Os alvos válidos vêm do domínio: a Receita alimenta 7 contextos; atestado/relatório/
                    encaminhamento se ligam ao encontro. Mostrar aqui evita promessa que a regra não cumpre. */}
                {allowedTargets(subtype).length > 0 && (
                  <p className="mt-1.5 text-xs text-mauve">
                    Pode ser associado a: {allowedTargets(subtype).join(' · ')}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-mauve">Documento</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept={supportedNowAcceptAttr()}
                  onChange={onPickFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-mauve"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                  {fileName ?? 'Anexar arquivo (PDF ou imagem)'}
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-mauve">Emitido por</label>
                <input
                  value={issuer}
                  onChange={e => setIssuer(e.target.value)}
                  placeholder="Profissional ou instituição"
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-mauve">Data do documento</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={e => setDocDate(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-mauve">Observação</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm"
                />
              </div>

              {erro && <p className="text-sm text-red-600">{erro}</p>}

              <button
                onClick={onSave}
                disabled={saving || uploading || !fileUrl}
                className="w-full rounded-full bg-petal px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Salvar documento'}
              </button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="Excluir documento"
        message="O documento será removido da sua conta. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => confirmId && onDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
