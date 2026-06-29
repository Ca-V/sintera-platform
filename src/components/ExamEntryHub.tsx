'use client'

// ════════ Centro de Entrada de Exames (ExamEntryHub) ════════
// Componente REUTILIZÁVEL e autocontido (dono do próprio upload). Reusável em
// Exames, Dashboard, Linha do Tempo, estado vazio, onboarding e fluxos futuros.
//
// Separa CATEGORIA do exame (Convencional/Ômico — define o FLUXO) do MÉTODO de
// entrada (PDF/Foto/Galeria — independe do fluxo). Ômico NÃO funde pipelines.
//
// NÃO decide navegação: emite INTENÇÕES (onUploaded, onChooseOmics) — quem roteia é
// a página. O ciclo do upload vive num ÚNICO estado (idle/uploading/error), sem
// variáveis paralelas.
//
// VOCAÇÃO DE CRESCER (não implementado agora): futura seção "Importar exame"
// (integrações: laboratório, hospital, Apple/Google Health, Garmin, Oura, HL7/FHIR,
// WhatsApp…) e "Solicitar exame" entram como irmãs deste card. Variações de
// apresentação (mode compact/full/wizard) e máquina de estados completa = só quando
// existir um segundo consumidor real (evitar abstração especulativa).

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Plus, X, Camera, Dna, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 50 * 1024 * 1024

// Ciclo de vida do UPLOAD como estado ÚNICO (sem booleano + string paralelos).
type UploadState = { status: 'idle' } | { status: 'uploading' } | { status: 'error'; message: string }

interface Props {
  className?: string
  /** Exame criado com sucesso — a PÁGINA decide para onde ir. */
  onUploaded?: (examId: string) => void
  /** Usuária escolheu a categoria Ômico — a PÁGINA decide a navegação. */
  onChooseOmics?: () => void
  /** A lista de exames pode ter mudado (ex.: upload marcado como erro). */
  onChanged?: () => void
}

export default function ExamEntryHub({ className, onUploaded, onChooseOmics, onChanged }: Props) {
  const { user } = useUser()
  const supabase = useMemo(() => createClient(), [])
  const [dragging, setDragging] = useState(false)
  const [upload, setUpload] = useState<UploadState>({ status: 'idle' })
  const [category, setCategory] = useState<'convencional' | 'omico'>('convencional')

  const uploading   = upload.status === 'uploading'
  const uploadError = upload.status === 'error' ? upload.message : null

  const processFile = useCallback(async (file: File) => {
    if (!user) return
    if (!ACCEPTED_MIME.includes(file.type)) { setUpload({ status: 'error', message: 'Formato inválido. São aceitos PDF, JPG e PNG.' }); return }
    if (file.size > MAX_BYTES) { setUpload({ status: 'error', message: 'Arquivo muito grande. O limite é 50 MB.' }); return }
    setUpload({ status: 'uploading' })
    let examId: string | null = null
    try {
      const ext         = file.name.split('.').pop() ?? 'bin'
      const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: storageErr } = await supabase.storage.from('exams').upload(storagePath, file, { contentType: file.type, upsert: false })
      if (storageErr) throw new Error(`[storage] ${storageErr.message}`)
      const { data: signedData, error: signedErr } = await supabase.storage.from('exams').createSignedUrl(storagePath, 60 * 60 * 24 * 365)
      if (signedErr) throw new Error(`[signed-url] ${signedErr.message}`)
      examId = crypto.randomUUID()
      const examName = file.name.replace(/\.[^.]+$/, '')
      // exam_date fica nulo no upload — preenchido pela extração (data do laudo).
      const { error: insertErr } = await supabase.from('exams').insert({ id: examId, user_id: user.id, type: examName, exam_date: null, file_url: signedData.signedUrl, status: 'pending' } as unknown as never)
      if (insertErr) throw new Error(`[insert] ${insertErr.code}: ${insertErr.message}`)
      setUpload({ status: 'idle' })
      onUploaded?.(examId) // intenção: a página navega para o exame
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setUpload({ status: 'error', message: msg })
      if (examId) { await supabase.from('exams').update({ status: 'error' } as unknown as never).eq('id', examId); onChanged?.() }
    }
  }, [user, supabase, onUploaded, onChanged])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = '' }
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }
  const onDragLeave = (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className={`card-premium p-5 space-y-4 ${className ?? ''}`}>
      <p className="font-display text-base font-semibold text-onyx">Adicionar exame</p>

      {/* Categoria do exame (define o FLUXO) — com contexto p/ não confundir com método. */}
      <div>
        <p className="font-body text-sm font-medium text-onyx">Categoria do exame</p>
        <p className="font-body text-xs text-mauve mb-2">Escolha o tipo de exame que deseja adicionar.</p>
        <div className="flex gap-2">
          {([['convencional', 'Convencional'], ['omico', 'Ômico']] as const).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setCategory(id)}
              className={`px-3.5 py-1.5 rounded-full font-body text-sm font-medium border transition-colors ${
                category === id ? 'gradient-sintera text-white border-transparent' : 'bg-ivory text-mauve border-border hover:border-petal/40'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {category === 'convencional' ? (
        <div className="space-y-3">
          {/* MÉTODO de entrada — todos reusam o MESMO upload (independe da categoria). */}
          <p className="font-body text-sm font-medium text-onyx">Como deseja enviar este exame?</p>
          <motion.label
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={onDragLeave} onDrop={onDrop}
            className={['block border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer',
              dragging ? 'border-petal bg-blush' : 'border-border hover:border-petal/50 hover:bg-blush/30',
              uploading ? 'opacity-60 pointer-events-none select-none' : ''].join(' ')}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={uploading} onChange={onInputChange} />
            <div className="w-12 h-12 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-3">
              <Upload size={22} className={`text-petal ${uploading ? 'animate-bounce' : ''}`} />
            </div>
            {uploading ? (
              <>
                <p className="font-display text-base font-semibold text-onyx">Enviando exame…</p>
                <p className="font-body text-xs text-mauve">Não feche esta aba até concluir</p>
              </>
            ) : (
              <>
                <p className="font-display text-base font-semibold text-onyx mb-1">Arraste o PDF aqui</p>
                <p className="font-body text-sm text-mauve mb-3">ou clique para selecionar um arquivo</p>
                <span className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-5 py-2 rounded-full hover:opacity-90 transition-opacity shadow-sm">
                  <Plus size={15} /> PDF
                </span>
                <p className="text-[11px] font-body text-mauve/60 mt-3">PDF ou foto do laudo (JPG/PNG) · Até 50 MB</p>
              </>
            )}
          </motion.label>
          <div className="flex flex-wrap gap-2">
            <label className={['inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-petal/40 text-petal font-body text-sm font-medium cursor-pointer hover:bg-blush transition-colors',
              uploading ? 'opacity-60 pointer-events-none' : ''].join(' ')}>
              <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={uploading} onChange={onInputChange} />
              <Camera size={15} /> Foto
            </label>
            <label className={['inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-petal/40 text-petal font-body text-sm font-medium cursor-pointer hover:bg-blush transition-colors',
              uploading ? 'opacity-60 pointer-events-none' : ''].join(' ')}>
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={onInputChange} />
              <ImageIcon size={15} /> Galeria
            </label>
          </div>
        </div>
      ) : (
        /* Ômico: a área NÃO some — vira uma chamada ao fluxo próprio. O componente
           só EMITE a intenção (onChooseOmics); a página decide navegar. */
        <div className="rounded-2xl border border-lavender/30 bg-lavender-light/40 px-4 py-4 flex items-start gap-3">
          <Dna size={18} className="text-lavender flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-body text-sm text-onyx leading-relaxed">
              Os exames <strong>ômicos</strong> (metabolômica, proteômica, microbioma, genética…) possuem um
              <strong> fluxo específico de organização e interpretação</strong>, com catálogo e versionamento.
            </p>
            <button type="button" onClick={() => onChooseOmics?.()}
              className="mt-2.5 inline-flex items-center gap-1.5 font-body text-sm font-medium text-lavender hover:underline">
              Ir para Exames Ômicos →
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-red-700 flex-1">{uploadError}</p>
          <button type="button" onClick={() => setUpload({ status: 'idle' })} className="text-red-300 hover:text-red-500"><X size={15} /></button>
        </div>
      )}
    </motion.div>
  )
}
