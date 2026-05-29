'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import {
  detectExamType,
  buildBiomarkers,
  calcScores,
  buildInsights,
} from '@/lib/exam-processor'
import type { Database } from '@/lib/supabase/types'

type Exam = Database['public']['Tables']['exams']['Row']

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string
  icon: React.ComponentType<{ size: number; className?: string }>
}> = {
  processed:  { label: 'Analisado',   color: 'text-sage',      bg: 'bg-sage-light',      icon: CheckCircle },
  processing: { label: 'Processando', color: 'text-lavender',  bg: 'bg-lavender-light',  icon: Loader2     },
  pending:    { label: 'Aguardando',  color: 'text-gold',      bg: 'bg-warm',            icon: Clock       },
  error:      { label: 'Erro',        color: 'text-red-400',   bg: 'bg-red-50',          icon: AlertCircle },
}

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES = 10 * 1024 * 1024

export default function ExamsPage() {
  const { user } = useUser()
  // Singleton browser client — authenticated with the user's session cookies
  const supabase = useRef(createClient()).current

  const [dragging, setDragging]         = useState(false)
  const [exams, setExams]               = useState<Exam[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [uploading, setUploading]       = useState(false)
  const [uploadError, setUploadError]   = useState<string | null>(null)

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

    // Declared outside try so the catch block can update the exam status
    let examId: string | null = null

    try {
      // ── 1. Upload to Supabase Storage ─────────────────────────────────────
      const ext = file.name.split('.').pop() ?? 'bin'
      const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('exams').upload(storagePath, file, { contentType: file.type, upsert: false })
      if (storageErr) throw new Error(`[Storage] ${storageErr.message}`)

      const { data: signedData, error: signedErr } = await supabase.storage
        .from('exams').createSignedUrl(storagePath, 60 * 60 * 24 * 365)
      if (signedErr) throw new Error(`[URL] ${signedErr.message}`)

      // ── 2. Create exam record (pending) ───────────────────────────────────
      examId = crypto.randomUUID()
      const examName = file.name.replace(/\.[^.]+$/, '')

      const { error: insertErr } = await supabase.from('exams').insert({
        id: examId, user_id: user.id, type: examName,
        file_url: signedData.signedUrl, status: 'pending',
      } as unknown as never)
      if (insertErr) throw new Error(`[Exame] ${insertErr.message}`)

      await loadExams()

      // ── 3. Mark as processing ─────────────────────────────────────────────
      // WHY CLIENT-SIDE: proxy.ts excludes /api from its matcher, so
      // createServerClient() never gets a refreshed session for API routes —
      // getUser() returns null → 401 → exam stays pending silently.
      // The browser client already carries the auth Bearer token.
      const { error: procErr } = await supabase.from('exams')
        .update({ status: 'processing' } as unknown as never)
        .eq('id', examId).eq('user_id', user.id)
      if (procErr) throw new Error(`[Processing] ${procErr.message}`)

      await loadExams()

      // ── 4. Biomarkers ─────────────────────────────────────────────────────
      const examType   = detectExamType(examName)
      const biomarkers = buildBiomarkers(examType, examId)

      const bmRows = biomarkers.map(b => ({
        exam_id: examId, user_id: user.id,
        name: b.name, value: b.value, unit: b.unit,
        reference_min: b.reference_min, reference_max: b.reference_max,
        interpretation: b.interpretation, ai_insight: b.ai_insight,
      }))

      const { error: bmErr } = await supabase.from('biomarkers')
        .insert(bmRows as unknown as never)
      if (bmErr) throw new Error(`[Biomarkers] ${bmErr.message}`)

      // ── 5. Biological score ───────────────────────────────────────────────
      const scores = calcScores(biomarkers)
      const { error: scoreErr } = await supabase.from('biological_scores')
        .insert({ user_id: user.id, ...scores } as unknown as never)
      if (scoreErr) throw new Error(`[Scores] ${scoreErr.message}`)

      // ── 6. AI insights ────────────────────────────────────────────────────
      const insights = buildInsights(biomarkers, user.id)
      const { error: insightErr } = await supabase.from('ai_insights')
        .insert(insights as unknown as never)
      if (insightErr) throw new Error(`[Insights] ${insightErr.message}`)

      // ── 7. Mark as processed ──────────────────────────────────────────────
      const { error: doneErr } = await supabase.from('exams')
        .update({ status: 'processed' } as unknown as never)
        .eq('id', examId).eq('user_id', user.id)
      if (doneErr) throw new Error(`[Done] ${doneErr.message}`)

      await loadExams()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('[Sintera] processFile falhou:', msg)
      setUploadError(msg)

      // Mark the exam as error so it's visible in the list (not silent pending)
      if (examId) {
        await supabase.from('exams')
          .update({ status: 'error' } as unknown as never)
          .eq('id', examId).eq('user_id', user.id)
      }
      await loadExams()
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
    e.preventDefault()
    setDragging(false)
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
          Faça upload dos seus exames e a IA irá interpretar automaticamente
        </p>
      </motion.div>

      {/*
        Drop zone as <motion.label>.
        <input> usa "sr-only" — não display:none. Browsers bloqueiam .click()
        em inputs com display:none mesmo dentro de user-gesture handlers.
        sr-only esconde visualmente sem ocultar do modelo de interação.
      */}
      <motion.label
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'block border-2 border-dashed rounded-2xl p-10 text-center',
          'transition-all duration-200 cursor-pointer',
          dragging  ? 'border-petal bg-blush'
                    : 'border-border hover:border-petal/50 hover:bg-blush/30',
          uploading ? 'opacity-60 pointer-events-none select-none' : '',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          disabled={uploading}
          onChange={onInputChange}
        />

        <div className="w-14 h-14 rounded-2xl gradient-sintera-soft flex items-center justify-center mx-auto mb-4">
          <Upload size={24} className={`text-petal ${uploading ? 'animate-bounce' : ''}`} />
        </div>

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <p className="font-display text-lg font-semibold text-onyx">Enviando e processando…</p>
            <p className="font-body text-xs text-mauve">Extraindo biomarcadores e calculando scores</p>
          </div>
        ) : (
          <>
            <p className="font-display text-lg font-semibold text-onyx mb-1">Arraste seu exame aqui</p>
            <p className="font-body text-sm text-mauve mb-4">ou clique para selecionar um arquivo</p>
            <p className="text-xs font-body text-mauve/60 mb-5">PDF, JPG ou PNG · Até 10 MB</p>
            <span className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
              <Plus size={15} /> Selecionar arquivo
            </span>
          </>
        )}
      </motion.label>

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl"
        >
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="font-body text-sm text-red-600 flex-1">{uploadError}</p>
          <button type="button" onClick={() => setUploadError(null)}
            className="text-red-300 hover:text-red-400 transition-colors" aria-label="Fechar">
            <X size={15} />
          </button>
        </motion.div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body text-sm font-semibold text-onyx/60 uppercase tracking-widest">Histórico</h2>
          <span className="text-xs font-body text-mauve">
            {exams.length} exame{exams.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loadingExams ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-premium h-[72px] rounded-2xl animate-pulse"
                style={{ background: '#F2EDE8' }} />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <FileText size={36} className="text-border mx-auto mb-3" />
            <p className="font-body text-sm text-mauve">Nenhum exame ainda</p>
            <p className="font-body text-xs text-mauve/60 mt-1">Faça upload do primeiro exame acima</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {exams.map((exam, i) => {
              const cfg = STATUS_CONFIG[exam.status] ?? STATUS_CONFIG.pending
              const Icon = cfg.icon
              return (
                <motion.div key={exam.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
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
                  <span className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <Icon size={11} className={exam.status === 'processing' ? 'animate-spin' : ''} />
                    {cfg.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="card-dark p-5 flex items-start gap-4">
        <div className="w-8 h-8 rounded-lg bg-petal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-sm">🧬</span>
        </div>
        <div>
          <p className="font-body text-sm font-semibold text-white mb-1">Extração automática de biomarcadores</p>
          <p className="font-body text-xs text-white/50 leading-relaxed">
            Ao enviar um exame, detectamos o tipo (hemograma, hormonal, tireoide, metabolismo…),
            extraímos biomarcadores, calculamos seu score biológico em 8 dimensões e geramos insights
            personalizados em português.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
