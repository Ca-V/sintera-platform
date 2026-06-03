'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Upload, FileText, Clock, CheckCircle, AlertCircle,
  Plus, X, Loader2, RefreshCw, Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import type { Database } from '@/lib/supabase/types'

type Exam = Database['public']['Tables']['exams']['Row']

// Mensagens de erro por código retornado pelo backend (Epic 1.1)
const ERROR_MESSAGES: Record<string, string> = {
  PDF_NO_TEXT_LAYER:       'Este PDF parece ser uma imagem escaneada. PDFs escaneados não são suportados nesta versão Beta.',
  PDF_PASSWORD_PROTECTED:  'O PDF está protegido por senha. Remova a proteção e envie novamente.',
  PDF_CORRUPTED:           'O arquivo parece estar corrompido. Tente enviá-lo novamente.',
  PDF_TOO_LARGE:           'O arquivo excede o limite de 10 MB.',
  STORAGE_DOWNLOAD_FAILED: 'Não foi possível acessar o arquivo. Tente novamente em alguns instantes.',
  RATE_LIMIT_EXCEEDED:     'Limite de análises atingido. Aguarde 1 minuto.',
  NO_ACTIVE_PROMPT:        'O sistema de análise está em manutenção. Tente mais tarde.',
  ALREADY_PROCESSING:      'Este exame já está sendo processado.',
}

function friendlyError(code?: string, fallback?: string): string {
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
  return fallback ?? 'Ocorreu um erro durante a análise. Tente novamente.'
}

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string
  icon: React.ComponentType<{ size: number; className?: string }>
}> = {
  processed:  { label: 'Analisado',    color: 'text-sage',        bg: 'bg-sage-light',    icon: CheckCircle },
  pending:    { label: 'Aguardando',   color: 'text-gold',        bg: 'bg-warm',          icon: Clock       },
  processing: { label: 'Processando',  color: 'text-lavender',    bg: 'bg-lavender-light', icon: Loader2    },
  error:      { label: 'Erro',         color: 'text-red-400',     bg: 'bg-red-50',        icon: AlertCircle },
}

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES     = 10 * 1024 * 1024

export default function ExamsPage() {
  const { user } = useUser()
  const router   = useRouter()
  const supabase = useRef(createClient()).current

  const [dragging, setDragging]         = useState(false)
  const [exams, setExams]               = useState<Exam[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [uploading, setUploading]       = useState(false)
  const [uploadError, setUploadError]   = useState<string | null>(null)

  // Per-exam local state: 'running' | { error: string; biomarkers?: number }
  const [analyzing, setAnalyzing]   = useState<Record<string, true>>({})
  const [examErrors, setExamErrors] = useState<Record<string, string>>({})
  const [examSuccess, setExamSuccess] = useState<Record<string, number>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadExams = useCallback(async () => {
    if (!user) return
    setLoadingExams(true)
    const { data, error } = await supabase
      .from('exams').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) console.error('[Sintera] exams fetch:', error.message)
    else setExams((data ?? []) as Exam[])
    setLoadingExams(false)
  }, [user, supabase])

  useEffect(() => { loadExams() }, [loadExams])

  // ── Analisar exame ────────────────────────────────────────────────────────
  const analyzeExam = useCallback(async (exam: Exam) => {
    if (analyzing[exam.id]) return // duplo clique — já processando

    setAnalyzing(prev => ({ ...prev, [exam.id]: true }))
    setExamErrors(prev => { const n = { ...prev }; delete n[exam.id]; return n })
    setExamSuccess(prev => { const n = { ...prev }; delete n[exam.id]; return n })

    try {
      const res  = await fetch(`/api/exams/${exam.id}/analyze`, { method: 'POST' })
      const data = await res.json() as { error?: string; code?: string; biomarkers?: number }

      if (!res.ok) {
        setExamErrors(prev => ({
          ...prev,
          [exam.id]: friendlyError(data.code, data.error),
        }))
      } else {
        setExamSuccess(prev => ({ ...prev, [exam.id]: data.biomarkers ?? 0 }))
      }
    } catch {
      setExamErrors(prev => ({ ...prev, [exam.id]: 'Falha de conexão. Verifique sua internet.' }))
    } finally {
      setAnalyzing(prev => { const n = { ...prev }; delete n[exam.id]; return n })
      await loadExams()
    }
  }, [analyzing, loadExams])

  // ── Upload ─────────────────────────────────────────────────────────────────
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
    let examId: string | null = null

    try {
      const ext         = file.name.split('.').pop() ?? 'bin'
      const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('exams').upload(storagePath, file, { contentType: file.type, upsert: false })
      if (storageErr) throw new Error(`[storage] ${storageErr.message}`)

      const { data: signedData, error: signedErr } = await supabase.storage
        .from('exams').createSignedUrl(storagePath, 60 * 60 * 24 * 365)
      if (signedErr) throw new Error(`[signed-url] ${signedErr.message}`)

      examId = crypto.randomUUID()
      const examName = file.name.replace(/\.[^.]+$/, '')

      const { error: insertErr } = await supabase.from('exams').insert({
        id: examId, user_id: user.id, type: examName,
        file_url: signedData.signedUrl, status: 'pending',
      } as unknown as never)
      if (insertErr) throw new Error(`[insert] ${insertErr.code}: ${insertErr.message}`)

      await loadExams()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setUploadError(msg)
      if (examId) {
        await supabase.from('exams').update({ status: 'error' } as unknown as never).eq('id', examId)
        await loadExams()
      }
    } finally {
      setUploading(false)
    }
  }, [user, supabase, loadExams])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Exames</h1>
        <p className="font-body text-sm text-mauve">
          Faça upload dos seus exames em PDF e inicie a extração de biomarcadores por IA
        </p>
      </motion.div>

      {/* Drop zone */}
      <motion.label
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'block border-2 border-dashed rounded-2xl p-10 text-center',
          'transition-all duration-200 cursor-pointer',
          dragging  ? 'border-petal bg-blush' : 'border-border hover:border-petal/50 hover:bg-blush/30',
          uploading ? 'opacity-60 pointer-events-none select-none' : '',
        ].join(' ')}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only" disabled={uploading} onChange={onInputChange} />
        <div className="w-14 h-14 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-4">
          <Upload size={24} className={`text-petal ${uploading ? 'animate-bounce' : ''}`} />
        </div>
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <p className="font-display text-lg font-semibold text-onyx">Enviando exame…</p>
            <p className="font-body text-xs text-mauve">Não feche esta aba até concluir</p>
          </div>
        ) : (
          <>
            <p className="font-display text-lg font-semibold text-onyx mb-1">Arraste seu exame aqui</p>
            <p className="font-body text-sm text-mauve mb-4">ou clique para selecionar um arquivo</p>
            <p className="text-xs font-body text-mauve/60 mb-5">PDF · Até 10 MB</p>
            <span className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
              <Plus size={15} /> Selecionar arquivo
            </span>
          </>
        )}
      </motion.label>

      {/* Upload error */}
      {uploadError && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-red-700 flex-1">{uploadError}</p>
          <button type="button" onClick={() => setUploadError(null)} className="text-red-300 hover:text-red-500 flex-shrink-0">
            <X size={15} />
          </button>
        </motion.div>
      )}

      {/* Exam list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest">Histórico</h2>
          <span className="text-xs font-body text-mauve">{exams.length} exame{exams.length !== 1 ? 's' : ''}</span>
        </div>

        {loadingExams ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-premium h-[72px] rounded-2xl animate-pulse" style={{ background: '#F2EDE8' }} />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <FileText size={36} className="text-border mx-auto mb-3" />
            <p className="font-body text-sm text-mauve">Nenhum exame ainda</p>
            <p className="font-body text-xs text-mauve/60 mt-1">Faça upload do primeiro exame acima</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {exams.map((exam, i) => {
              const isRunning   = !!analyzing[exam.id]
              const errMsg      = examErrors[exam.id]
              const successCount = examSuccess[exam.id]

              const displayStatus = isRunning ? 'processing' : exam.status
              const cfg  = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.pending
              const Icon = cfg.icon

              // Botão de análise: pending → "Analisar exame" | processed → "Reanalisar" | error → "Tentar novamente"
              const hasFile    = !!(exam as unknown as { file_url: string | null }).file_url
              const canAnalyze = hasFile && !isRunning && exam.status !== 'processing'
              const analyzeLabel =
                exam.status === 'processed' ? 'Reanalisar' :
                exam.status === 'error'     ? 'Tentar novamente' :
                                              'Analisar exame'
              const AnalyzeIcon = exam.status === 'processed' ? RefreshCw : Zap

              return (
                <motion.div key={exam.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="card-premium overflow-hidden"
                >
                  <div
                    className="p-5 flex items-center gap-4 cursor-pointer"
                    onClick={() => router.push('/dashboard/exams/' + exam.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-petal" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-onyx truncate">{exam.type ?? 'Exame'}</p>
                      <p className="font-body text-xs text-mauve">{formatDate(exam.created_at)}</p>
                      {successCount !== undefined && (
                        <p className="font-body text-xs text-sage mt-0.5">
                          {successCount} biomarcador{successCount !== 1 ? 'es' : ''} extraído{successCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                      <Icon size={11} className={isRunning ? 'animate-spin' : ''} />
                      {cfg.label}
                    </span>

                    {/* Botão de análise */}
                    {canAnalyze && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); analyzeExam(exam) }}
                        className="ml-1 flex items-center gap-1.5 text-xs font-body font-medium text-white gradient-sintera px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm"
                      >
                        <AnalyzeIcon size={11} /> {analyzeLabel}
                      </button>
                    )}

                    {/* Spinner durante análise */}
                    {isRunning && (
                      <div className="ml-1 flex items-center gap-1.5 text-xs font-body text-mauve flex-shrink-0">
                        <Loader2 size={13} className="animate-spin" />
                        <span>Analisando…</span>
                      </div>
                    )}
                  </div>

                  {/* Mensagem de erro inline */}
                  {errMsg && (
                    <div className="px-5 pb-4">
                      <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="font-body text-xs text-red-700">{errMsg}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
