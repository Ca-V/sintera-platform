'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import type { Database } from '@/lib/supabase/types'

type Exam = Database['public']['Tables']['exams']['Row']

const STATUS_CONFIG: Record<string, {
  label: string
  color: string
  bg: string
  icon: React.ComponentType<{ size: number }>
}> = {
  processed: { label: 'Analisado',   color: 'text-sage',    bg: 'bg-sage-light', icon: CheckCircle },
  pending:   { label: 'Processando', color: 'text-gold',    bg: 'bg-warm',       icon: Clock       },
  error:     { label: 'Erro',        color: 'text-red-400', bg: 'bg-red-50',     icon: AlertCircle },
}

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export default function ExamsPage() {
  const { user } = useUser()
  // Singleton browser client — avoids re-creating on every render
  const supabase = useRef(createClient()).current

  const [dragging, setDragging]       = useState(false)
  const [exams, setExams]             = useState<Exam[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // The hidden <input type="file"> — triggered programmatically
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadExams = useCallback(async () => {
    if (!user) return
    setLoadingExams(true)
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) console.error('[Sintera] exams fetch:', error.message)
    else setExams((data ?? []) as Exam[])
    setLoadingExams(false)
  }, [user, supabase])

  useEffect(() => { loadExams() }, [loadExams])

  const processFile = useCallback(async (file: File) => {
    if (!user) return

    if (!ACCEPTED_MIME.includes(file.type)) {
      setUploadError('Formato inválido. São aceitos PDF, JPG e PNG.')
      return
    }
    if (file.size > MAX_BYTES) {
      setUploadError('Arquivo muito grande. O limite é 10 MB.')
      return
    }

    setUploadError(null)
    setUploading(true)

    try {
      // 1. Upload to Supabase Storage: bucket "exams", path "{userId}/{uuid}.ext"
      const ext = file.name.split('.').pop() ?? 'bin'
      const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('exams')
        .upload(storagePath, file, { contentType: file.type, upsert: false })

      if (storageErr) throw new Error(storageErr.message)

      // 2. Build the signed URL (private bucket → signed URL for access)
      const { data: signedData, error: signedErr } = await supabase.storage
        .from('exams')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365) // 1-year expiry

      if (signedErr) throw new Error(signedErr.message)

      // 3. Insert exam record
      const examName = file.name.replace(/\.[^.]+$/, '')
      // @supabase/ssr 0.10.x resolves insert() param to 'never' in strict TS — double-cast required
      const { error: dbErr } = await supabase.from('exams').insert({
        user_id: user.id,
        type: examName,
        file_url: signedData.signedUrl,
        status: 'pending',
      } as unknown as never)

      if (dbErr) throw new Error(dbErr.message)

      await loadExams()
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar arquivo.')
    } finally {
      setUploading(false)
    }
  }, [user, supabase, loadExams])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset so the same file can be selected again
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const onDragLeave = (e: React.DragEvent) => {
    // Only clear dragging state when leaving the drop zone itself, not its children
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Exames</h1>
        <p className="font-body text-sm text-mauve">
          Faça upload dos seus exames e a IA irá interpretar automaticamente
        </p>
      </motion.div>

      {/* Hidden native file picker — opened programmatically */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={onInputChange}
        aria-hidden="true"
      />

      {/* Drop zone — also acts as a click target for the whole area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer',
          dragging  ? 'border-petal bg-blush'                          : 'border-border hover:border-petal/50 hover:bg-blush/30',
          uploading ? 'opacity-60 pointer-events-none select-none'     : '',
        ].join(' ')}
      >
        <div className="w-14 h-14 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-4">
          <Upload size={24} className={`text-petal ${uploading ? 'animate-bounce' : ''}`} />
        </div>

        {uploading ? (
          <p className="font-display text-lg font-semibold text-onyx">Enviando…</p>
        ) : (
          <>
            <p className="font-display text-lg font-semibold text-onyx mb-1">
              Arraste seu exame aqui
            </p>
            <p className="font-body text-sm text-mauve mb-4">ou clique para selecionar um arquivo</p>
            <p className="text-xs font-body text-mauve/60 mb-5">PDF, JPG ou PNG · Até 10 MB</p>

            {/* Button stops propagation so the div's onClick doesn't fire twice */}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
              className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus size={15} /> Selecionar arquivo
            </button>
          </>
        )}
      </motion.div>

      {/* Upload error banner */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl"
        >
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="font-body text-sm text-red-600 flex-1">{uploadError}</p>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-300 hover:text-red-400 transition-colors"
            aria-label="Fechar"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}

      {/* Exam history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest">
            Histórico
          </h2>
          <span className="text-xs font-body text-mauve">
            {exams.length} exame{exams.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingExams ? (
          /* Skeleton rows while fetching */
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="card-premium h-[72px] rounded-2xl animate-pulse"
                style={{ background: '#F2EDE8' }}
              />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <FileText size={36} className="text-border mx-auto mb-3" />
            <p className="font-body text-sm text-mauve">Nenhum exame ainda</p>
            <p className="font-body text-xs text-mauve/60 mt-1">
              Faça upload do primeiro exame acima
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {exams.map((exam, i) => {
              const cfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.pending
              const Icon = cfg.icon
              return (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="card-premium p-5 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-petal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-onyx group-hover:text-petal transition-colors truncate">
                      {exam.type ?? 'Exame'}
                    </p>
                    <p className="font-body text-xs text-mauve">{formatDate(exam.created_at)}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}
                  >
                    <Icon size={11} /> {cfg.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="card-dark p-5 flex items-start gap-4"
      >
        <div className="w-8 h-8 rounded-lg bg-petal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">🧬</span>
        </div>
        <div>
          <p className="font-body text-sm font-semibold text-white mb-1">
            IA de Interpretação — Em breve
          </p>
          <p className="font-body text-xs text-white/50 leading-relaxed">
            Nossa IA irá extrair automaticamente os biomarcadores dos seus exames via OCR, interpretar os
            valores com base em faixas de referência e gerar insights preventivos personalizados.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
