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

import { useCallback, useEffect, useState } from 'react'
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
import AnexoDocumento from '@/components/ui/AnexoDocumento'
import Disclaimer from '@/components/ui/Disclaimer'
import { Card } from '@/lib/ui/ds'
// Helper do repositório: o cliente tipado resolve Insert como `never`, então TODA escrita da Web passa por
// `row()`. Não é gambiarra minha — é o padrão já usado por Recursos, Hábitos e demais páginas.
import { row } from '@/lib/supabase/db'
// A Web reusa a MESMA consulta do Mobile (SSOT), como já faz em getProfileStats.
import { targetNamesByDocument } from '@sintera/api-client'
import {
  DOCUMENT_SUBTYPES, documentSubtypeLabel, buildPatientDocumentInsert, documentSubtitle, isReadyToSave,
  autofillFrom, deriveDocumentTitle,
  type PatientDocumentSubtype, type AttachedFile, uuid,} from '@sintera/core'

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

export default function DocumentosPage() {
  const { user } = useUser()
  const supabase = createClient()

  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(FILTER_ALL)

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const [subtype, setSubtype] = useState<PatientDocumentSubtype>('receita')
  // ANEXO-001: o formulário guarda um CONJUNTO de páginas, não um arquivo.
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [issuer, setIssuer] = useState('')
  const [docDate, setDocDate] = useState('')
  const [notes, setNotes] = useState('')
  /** document_id → nomes dos registros vinculados. Vazio é normal: nem todo documento tem vínculo. */
  const [alvos, setAlvos] = useState<Record<string, string[]>>({})

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('patient_documents').select(COLUMNS)
      .eq('user_id', user.id).order('created_at', { ascending: false })
    const lista = (data as DocRow[] | null) ?? []
    setRows(lista)
    // Nomes dos alvos vinculados, para o card dizer "Receita de paracetamol" em vez de só "Receita".
    // Mesma consulta que o Mobile usa (SSOT). Degrada para vazio; o título cai para o rótulo puro.
    setAlvos(await targetNamesByDocument(supabase, lista.map(r => r.id)))
    setLoading(false)
  }, [supabase, user])

  useEffect(() => { void load() }, [load])

  function resetForm() {
    setSubtype('receita'); setFiles([])
    setIssuer(''); setDocDate(''); setNotes(''); setErro(null)
  }

  /** Sobe UMA página. O componente cuida da política, da lista, da ordem e do progresso. */
  const uploadPagina = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null
    const ext = file.name.split('.').pop() ?? 'pdf'
    const path = `${user.id}/${uuid()}.${ext}`
    const { error: upErr } = await supabase.storage.from('exams')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) return null
    const { data: signed } = await supabase.storage.from('exams')
      .createSignedUrl(path, 60 * 60 * 24 * 365)
    return signed?.signedUrl ?? null
  }, [supabase, user])

  async function onSave() {
    if (!user) return
    if (!isReadyToSave(files)) { setErro('Anexe o documento.'); return }
    setSaving(true)
    try {
      // A LINHA é montada pelo domínio (core), não aqui: os defaults de `source`/`status` e a forma da
      // inserção têm um dono só, compartilhado com o Mobile. A página só coleta o que a pessoa digitou.
      const docRow = buildPatientDocumentInsert(user.id, {
        file_url: files[0].url!,
        subtype,
        issuer: issuer.trim() || null,
        doc_date: docDate || null,
        notes: notes.trim() || null,
      })
      const { data: criado, error } = await supabase.from('patient_documents').insert(row(docRow)).select('id')
      if (error) { setErro('Não foi possível salvar o documento.'); return }
      // PÁGINAS (ANEXO-001) — a ordem do array é a ordem de leitura.
      const docId = (criado as { id: string }[] | null)?.[0]?.id
      if (docId && files.length > 0) {
        const paginas = files.map((f, i) => ({
          document_id: docId, user_id: user.id, file_url: f.url!,
          file_name: f.name, mime_type: f.mime, size_bytes: f.sizeBytes, position: i,
        }))
        const { error: pe } = await supabase.from('patient_document_files').insert(row(paginas))
        if (pe) { setErro('O documento foi salvo, mas as páginas extras não. Tente editar e anexar de novo.'); return }
      }
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
        title="Receitas e atestados"
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
            return (
              <ListCard
                key={r.id}
                leading={<Icon size={18} />}
                title={deriveDocumentTitle(r.subtype, alvos[r.id])}
                meta={documentSubtitle(r)}
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
                {/* NÃO anunciar aqui a que este documento "pode ser associado": este formulário não associa
                    nada. O vínculo da receita ao medicamento nasce do outro lado, na tela de Medicamentos.
                    Prometer uma capacidade que a tela não tem é pior do que ficar calado. Quando houver
                    seletor de vínculo aqui, o texto volta — junto com o campo. */}
              </div>

              {/* LEITURA ASSISTIDA (ANEXO-001 · item D). Declara o subtipo escolhido para que o componente
                  avise se o documento anexado parece outra coisa, e devolva emissor e data para REVISÃO.
                  `autofillFrom` não sobrescreve o que já foi digitado: a pessoa é a autoridade sobre o
                  próprio registro. */}
              <AnexoDocumento
                files={files} onChange={setFiles} upload={uploadPagina}
                leituraAssistida={{
                  declarado: subtype,
                  onLeitura: (leitura) => {
                    const preenchido = autofillFrom(leitura, { issuer, docDate })
                    setIssuer(preenchido.issuer)
                    setDocDate(preenchido.docDate)
                  },
                }}
              />

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
                disabled={saving || !isReadyToSave(files)}
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
