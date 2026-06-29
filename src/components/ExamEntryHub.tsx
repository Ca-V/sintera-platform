'use client'

// ════════ Centro de Entrada de Exames (ExamEntryHub) ════════
// Componente REUTILIZÁVEL e autocontido (dono do próprio upload). Reusável em
// Exames, Dashboard, Linha do Tempo, estado vazio ("você ainda não tem exames"),
// onboarding e fluxos futuros.
//
// Separa CATEGORIA do exame (Convencional/Ômico — define o FLUXO) do MÉTODO de
// entrada (PDF/Foto/Galeria — independe do fluxo). Ômico ROTEIA para o fluxo próprio
// (catálogo + versionamento); NÃO funde pipelines (Princípio 7). Nenhum termo técnico
// ("pipeline") aparece na interface.
//
// VOCAÇÃO DE CRESCER (não implementado agora): este card nasce como um centro de
// entrada — no futuro ganha a seção "Importar exame" (integrações: laboratório,
// hospital, Apple/Google Health, Garmin, Oura, HL7/FHIR, WhatsApp…) e "Solicitar
// exame", como irmãs, sem redesenhar a página.

import { useState, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, Plus, X, Camera, Dna, AlertCircle, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 50 * 1024 * 1024

interface Props {
  className?: string
  /** Chamado quando a lista de exames pode ter mudado (ex.: upload marcado como erro).
   *  No SUCESSO o componente navega para o exame criado. */
  onChanged?: () => void
}

export default function ExamEntryHub({ className, onChanged }: Props) {
  const { user } = useUser()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [category, setCategory] = useState<'convencional' | 'omico'>('convencional')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (!user) return
    if (!ACCEPTED_MIME.includes(file.type)) { setUploadError('Formato inválido. São aceitos PDF, JPG e PNG.'); return }
    if (file.size > MAX_BYTES) { setUploadError('Arquivo muito grande. O limite é 50 MB.'); return }
    setUploadError(null); setUploading(true)
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
      router.push(`/dashboard/exams/${examId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setUploadError(msg)
      if (examId) { await supabase.from('exams').update({ status: 'error' } as unknown as never).eq('id', examId); onChanged?.() }
    } finally { setUploading(false) }
  }, [user, supabase, router, onChanged])

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
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={uploading} onChange={onInputChange} />
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
        /* Ômico: a área NÃO some — é substituída por uma chamada ao fluxo próprio. */
        <div className="rounded-2xl border border-lavender/30 bg-lavender-light/40 px-4 py-4 flex items-start gap-3">
          <Dna size={18} className="text-lavender flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-body text-sm text-onyx leading-relaxed">
              Os exames <strong>ômicos</strong> (metabolômica, proteômica, microbioma, genética…) possuem um
              <strong> fluxo específico de organização e interpretação</strong>, com catálogo e versionamento.
            </p>
            <Link href="/dashboard/omics"
              className="mt-2.5 inline-flex items-center gap-1.5 font-body text-sm font-medium text-lavender hover:underline">
              Ir para Exames Ômicos →
            </Link>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-red-700 flex-1">{uploadError}</p>
          <button type="button" onClick={() => setUploadError(null)} className="text-red-300 hover:text-red-500"><X size={15} /></button>
        </div>
      )}
    </motion.div>
  )
}
