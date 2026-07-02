'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Clock, CheckCircle, AlertCircle,
  Plus, X, Loader2, Zap, Search, ChevronDown, ChevronUp, Trash2, Pencil, Check, Camera, Dna, ChevronRight, Info,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { parseDateOnly } from '@/lib/agenda'
import { useUser } from '@/context/UserContext'
import { compareNames } from '@/lib/exams/nameMatch'
import type { Database } from '@/lib/supabase/types'

type Exam = Database['public']['Tables']['exams']['Row']

const ERROR_MESSAGES: Record<string, string> = {
  PDF_NO_TEXT_LAYER:       'Este PDF parece ser uma imagem escaneada. PDFs escaneados ainda não são suportados — tente um PDF com texto ou tire uma foto do laudo.',
  PDF_PASSWORD_PROTECTED:  'O PDF está protegido por senha. Remova a proteção e envie novamente.',
  PDF_CORRUPTED:           'O arquivo parece estar corrompido. Tente enviá-lo novamente.',
  PDF_TOO_LARGE:           'O arquivo excede o limite de 50 MB.',
  STORAGE_DOWNLOAD_FAILED: 'Não foi possível acessar o arquivo. Tente novamente em alguns instantes.',
  RATE_LIMIT_EXCEEDED:     'Limite de extrações atingido. Aguarde 1 minuto.',
  PROVIDER_RATE_LIMITED:   'Muitas extrações em andamento no momento. Aguarde alguns instantes e tente novamente.',
  PROVIDER_OVERLOADED:     'O serviço de extração está temporariamente sobrecarregado. Tente novamente em alguns instantes.',
  PROVIDER_TIMEOUT:        'A extração demorou mais que o esperado. Tente novamente.',
  NO_ACTIVE_PROMPT:        'O sistema de extração está em manutenção. Tente mais tarde.',
  ALREADY_PROCESSING:      'Este exame já está sendo processado.',
}

function friendlyError(code?: string, fallback?: string): string {
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
  return fallback ?? 'Ocorreu um erro durante a extração. Tente novamente.'
}

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string
  icon: React.ComponentType<{ size: number; className?: string }>
}> = {
  processed:  { label: 'Dados extraídos', color: 'text-sage',    bg: 'bg-sage-light',     icon: CheckCircle },
  pending:    { label: 'Aguardando',  color: 'text-gold',       bg: 'bg-warm',           icon: Clock       },
  processing: { label: 'Processando', color: 'text-lavender',   bg: 'bg-lavender-light', icon: Loader2     },
  error:      { label: 'Erro',        color: 'text-red-400',    bg: 'bg-red-50',         icon: AlertCircle },
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all',       label: 'Todos os status' },
  { value: 'processed', label: 'Dados extraídos'  },
  { value: 'pending',   label: 'Aguardando'       },
  { value: 'error',     label: 'Com erro'         },
]

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_BYTES     = 50 * 1024 * 1024

function formatDate(iso: string) {
  return parseDateOnly(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getYear(iso: string) {
  return parseDateOnly(iso).getFullYear()
}

// Data de REALIZAÇÃO do exame (o que importa para histórico/dashboard);
// cai para a data de entrada (created_at) só se a realização não existir.
function effDate(e: Exam): string {
  return e.exam_date ?? e.created_at
}

export default function ExamsPage() {
  const { user, profile } = useUser()
  const router   = useRouter()
  const supabase = useRef(createClient()).current

  const [dragging, setDragging]         = useState(false)
  const [exams, setExams]               = useState<Exam[]>([])
  const [loadingExams, setLoadingExams] = useState(true)
  const [uploading, setUploading]       = useState(false)
  const [uploadError, setUploadError]   = useState<string | null>(null)

  const [analyzing, setAnalyzing]     = useState<Record<string, true>>({})
  const [examErrors, setExamErrors]   = useState<Record<string, string>>({})
  const [deletingId, setDeletingId]   = useState<string | null>(null)
  // Edição inline do nome do exame na lista
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [nameDraft, setNameDraft]     = useState('')
  const [savingName, setSavingName]   = useState(false)

  // ── Filtros (Epic Fase 1) ──────────────────────────────────────────────────
  const [searchName, setSearchName]   = useState('')
  const [filterYear, setFilterYear]   = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  // Período por data de REALIZAÇÃO (de / até), formato YYYY-MM-DD.
  const [filterFrom, setFilterFrom]   = useState<string>('')
  const [filterTo, setFilterTo]       = useState<string>('')
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadExams = useCallback(async () => {
    if (!user) return
    setLoadingExams(true)
    const { data, error } = await supabase
      .from('exams').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) console.error('[SINTERA] exams fetch:', error.message)
    else setExams((data ?? []) as Exam[])
    setLoadingExams(false)
  }, [user, supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadExams() }, [loadExams])

  // ── Anos disponíveis para o filtro ────────────────────────────────────────
  const availableYears = useMemo(() => {
    const years = [...new Set(exams.map(e => getYear(effDate(e))))].sort((a, b) => b - a)
    return years
  }, [exams])

  // ── Exames filtrados + agrupados por ano ──────────────────────────────────
  const examsByYear = useMemo(() => {
    let filtered = exams

    if (searchName.trim()) {
      const q = searchName.toLowerCase()
      filtered = filtered.filter(e => (e.type ?? '').toLowerCase().includes(q))
    }
    if (filterYear !== 'all') {
      const yr = parseInt(filterYear)
      filtered = filtered.filter(e => getYear(effDate(e)) === yr)
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus)
    }
    // Período por data de realização (inclusive nas pontas)
    if (filterFrom) filtered = filtered.filter(e => effDate(e).slice(0, 10) >= filterFrom)
    if (filterTo)   filtered = filtered.filter(e => effDate(e).slice(0, 10) <= filterTo)

    // Agrupar por ano
    const groups = new Map<number, Exam[]>()
    for (const exam of filtered) {
      const yr = getYear(effDate(exam))
      if (!groups.has(yr)) groups.set(yr, [])
      groups.get(yr)!.push(exam)
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0])
  }, [exams, searchName, filterYear, filterStatus, filterFrom, filterTo])

  const totalFiltered = useMemo(() => examsByYear.reduce((s, [, g]) => s + g.length, 0), [examsByYear])
  const hasActiveFilters = searchName.trim() !== '' || filterYear !== 'all' || filterStatus !== 'all' || filterFrom !== '' || filterTo !== ''

  function toggleYear(yr: number) {
    setCollapsedYears(prev => {
      const next = new Set(prev)
      next.has(yr) ? next.delete(yr) : next.add(yr)
      return next
    })
  }

  // ── Analisar exame ─────────────────────────────────────────────────────────
  const analyzeExam = useCallback(async (exam: Exam) => {
    if (analyzing[exam.id]) return
    setAnalyzing(prev => ({ ...prev, [exam.id]: true }))
    setExamErrors(prev => { const n = { ...prev }; delete n[exam.id]; return n })
    try {
      const res  = await fetch(`/api/exams/${exam.id}/analyze`, { method: 'POST' })
      const data = await res.json() as { error?: string; code?: string }
      if (!res.ok) {
        setExamErrors(prev => ({ ...prev, [exam.id]: friendlyError(data.code, data.error) }))
        await loadExams()
      } else {
        router.push(`/dashboard/exams/${exam.id}`)
      }
    } catch {
      setExamErrors(prev => ({ ...prev, [exam.id]: 'Falha de conexão. Verifique sua internet.' }))
      await loadExams()
    } finally {
      setAnalyzing(prev => { const n = { ...prev }; delete n[exam.id]; return n })
    }
  }, [analyzing, loadExams, router])

  // ── Upload ─────────────────────────────────────────────────────────────────
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
      // exam_date fica nulo no upload — é preenchido pela extração (data do laudo)
      // e pode ser ajustado manualmente no detalhe. Não assumimos a data de envio.
      const { error: insertErr } = await supabase.from('exams').insert({ id: examId, user_id: user.id, type: examName, exam_date: null, file_url: signedData.signedUrl, status: 'pending' } as unknown as never)
      if (insertErr) throw new Error(`[insert] ${insertErr.code}: ${insertErr.message}`)
      // P3 — vai direto ao exame enviado; a análise inicia sozinha lá (status 'pending')
      router.push(`/dashboard/exams/${examId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setUploadError(msg)
      if (examId) { await supabase.from('exams').update({ status: 'error' } as unknown as never).eq('id', examId); await loadExams() }
    } finally { setUploading(false) }
  }, [user, supabase, loadExams, router])

  // ── Excluir exame ───────────────────────────────────────────────────────────
  // Remove o exame + biomarcadores + insights + arquivo. Histórico, jornada e
  // dashboard são derivados ao vivo dos dados → recalculam no próximo load.
  async function deleteExam(exam: Exam) {
    if (deletingId) return
    const ok = window.confirm(
      `Excluir "${exam.type ?? 'Exame'}"?\n\nIsto remove o exame, seus biomarcadores e insights, e o arquivo enviado. ` +
      `O seu Histórico será recalculado sem este exame. Esta ação não pode ser desfeita.`,
    )
    if (!ok) return
    setDeletingId(exam.id)
    setUploadError(null)
    try {
      const res = await fetch(`/api/exams/${exam.id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadExams()
      } else {
        const j = await res.json().catch(() => ({}))
        setUploadError(j.error ?? 'Falha ao excluir o exame.')
      }
    } catch {
      setUploadError('Falha ao excluir o exame.')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Renomear exame (inline na lista) ────────────────────────────────────────
  async function saveExamName(examId: string) {
    const v = nameDraft.trim()
    if (!v || savingName) { setEditingNameId(null); return }
    setSavingName(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('exams').update({ type: v }).eq('id', examId)
      setExams(prev => prev.map(e => e.id === examId ? ({ ...e, type: v } as Exam) : e))
    } finally {
      setSavingName(false); setEditingNameId(null)
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = '' }
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }
  const onDragLeave = (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false) }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-semibold text-onyx mb-1">Exames</h1>
        <p className="font-body text-sm text-mauve">Envie seus <strong className="font-medium text-onyx/70">exames</strong> (extraímos os dados por IA), <strong className="font-medium text-onyx/70">receitas</strong> e outros arquivos de saúde — por PDF ou foto.</p>
      </motion.div>

      {/* ── Adicionar exame ──────────────────────────────────────────────── */}
      {/* A caixa vem primeiro e concentra TODAS as formas de envio (selecionar
          arquivo, arrastar PDF, foto do laudo). Ômica fica logo abaixo. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={onDragLeave} onDrop={onDrop}
        onClick={() => { if (!uploading) fileInputRef.current?.click() }}
        className={['block border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer',
          dragging ? 'border-petal bg-blush' : 'border-border hover:border-petal/50 hover:bg-blush/30',
          uploading ? 'opacity-60 pointer-events-none select-none' : ''].join(' ')}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={uploading} onChange={onInputChange} />
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
            <p className="font-body text-sm text-mauve mb-1">ou envie de uma destas formas</p>
            <p className="text-xs font-body text-mauve/60 mb-5">PDF ou foto do laudo (JPG/PNG) · Até 50 MB</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {/* Selecionar arquivo — clicar na caixa já abre este seletor */}
              <span className="inline-flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
                <Plus size={15} /> Selecionar arquivo
              </span>
              {/* Tirar foto do laudo — agora DENTRO da caixa; câmera no celular */}
              <label
                onClick={e => e.stopPropagation()}
                className={['inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-petal/40 text-petal font-body text-sm font-medium cursor-pointer hover:bg-blush transition-colors',
                  uploading ? 'opacity-60 pointer-events-none' : ''].join(' ')}>
                <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={uploading} onChange={onInputChange} />
                <Camera size={15} /> Fotografar o laudo
              </label>
            </div>
          </>
        )}
      </motion.div>

      {uploadError && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-xs text-red-700 flex-1">{uploadError}</p>
          <button type="button" onClick={() => setUploadError(null)} className="text-red-300 hover:text-red-500"><X size={15} /></button>
        </motion.div>
      )}

      {/* Explicação convencional × ômica — barra NEUTRA, separada da de Ômica
          (para não parecer que o convencional faz parte da Ômica) */}
      <div className="rounded-2xl border border-border bg-ivory px-4 py-3 flex items-start gap-3">
        <Info size={16} className="text-mauve flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-body text-xs text-onyx leading-relaxed">
            <strong>Exame convencional</strong> — laudos laboratoriais comuns (sangue, urina, hormônios…) que você envia na caixa acima; a IA extrai os dados automaticamente.
          </p>
          <p className="font-body text-xs text-onyx leading-relaxed">
            <strong>Exame ômico</strong> — também é um tipo de exame: metabolômica, proteômica, microbioma, genética. Reúne de centenas a milhares de marcadores e tem fluxo próprio, com catálogo e versionamento. Use a opção abaixo.
          </p>
        </div>
      </div>

      {/* Barra de Ômica — elemento próprio, separado da explicação */}
      <Link href="/dashboard/omics"
        className="card-premium p-4 flex items-center gap-3 hover:shadow-md transition-shadow group">
        <div className="w-10 h-10 rounded-2xl bg-lavender-light flex items-center justify-center flex-shrink-0">
          <Dna size={19} className="text-lavender" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold text-onyx">Ômica</p>
          <p className="font-body text-xs text-mauve mt-0.5">Registre e importe metabolômica, proteômica, microbioma e outros — com catálogo, versionamento e comparação no tempo</p>
        </div>
        <ChevronRight size={16} className="text-mauve/40 group-hover:text-lavender transition-colors flex-shrink-0" />
      </Link>

      {/* Aviso: exame(s) com nome divergente do perfil (acima da lista) */}
      {(() => {
        const divergentes = exams.filter(
          e => compareNames(profile?.name, (e as unknown as { patient_name?: string | null }).patient_name) === 'mismatch',
        )
        if (divergentes.length === 0) return null
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-red-700">
                {divergentes.length} exame{divergentes.length !== 1 ? 's' : ''} com nome divergente do seu perfil
              </p>
              <p className="font-body text-xs text-red-600 mt-1 leading-relaxed">
                O nome do paciente no laudo não corresponde ao do seu perfil
                {profile?.name ? <> (<strong>{profile.name}</strong>)</> : null}. Confira se {divergentes.length !== 1 ? 'são seus' : 'é seu'};
                se não for, exclua{divergentes.length !== 1 ? '-os' : '-o'}.
              </p>
            </div>
          </motion.div>
        )
      })()}

      {/* ── Filtros (Epic Fase 1) ────────────────────────────────────────── */}
      {exams.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="card-premium p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {/* Busca por nome */}
            <div className="relative flex-1 min-w-[160px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve/50" />
              <input
                type="text"
                placeholder="Buscar exame…"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-ivory border border-border rounded-xl font-body text-sm text-onyx placeholder-mauve/40 focus:outline-none focus:ring-1 focus:ring-petal/40"
              />
            </div>

            {/* Filtro por ano */}
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="py-2 px-3 bg-ivory border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40"
            >
              <option value="all">Todos os anos</option>
              {availableYears.map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>

            {/* Filtro por status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="py-2 px-3 bg-ivory border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40"
            >
              {STATUS_FILTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Período por data de realização */}
            <div className="flex items-center gap-1.5">
              <span className="font-body text-xs text-mauve/60">Período:</span>
              <input type="date" value={filterFrom} max={filterTo || undefined}
                onChange={e => setFilterFrom(e.target.value)} aria-label="Data inicial"
                className="py-2 px-2.5 bg-ivory border border-border rounded-xl font-body text-xs text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40" />
              <span className="font-body text-xs text-mauve/50">até</span>
              <input type="date" value={filterTo} min={filterFrom || undefined}
                onChange={e => setFilterTo(e.target.value)} aria-label="Data final"
                className="py-2 px-2.5 bg-ivory border border-border rounded-xl font-body text-xs text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40" />
            </div>

            {/* Limpar filtros */}
            {hasActiveFilters && (
              <button
                onClick={() => { setSearchName(''); setFilterYear('all'); setFilterStatus('all'); setFilterFrom(''); setFilterTo('') }}
                className="py-2 px-3 rounded-xl border border-border text-mauve font-body text-sm hover:border-petal/40 transition-colors flex items-center gap-1.5"
              >
                <X size={12} /> Limpar
              </button>
            )}
          </div>

          {/* Contagem de resultados */}
          <p className="font-body text-xs text-mauve/60">
            {hasActiveFilters
              ? `${totalFiltered} exame${totalFiltered !== 1 ? 's' : ''} encontrado${totalFiltered !== 1 ? 's' : ''} · ${exams.length} no total`
              : `${exams.length} exame${exams.length !== 1 ? 's' : ''}`
            }
          </p>
        </motion.div>
      )}

      {/* ── Lista agrupada por ano ─────────────────────────────────────────── */}
      {loadingExams ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="card-premium h-[72px] rounded-2xl animate-pulse" style={{ background: '#F2EDE8' }} />)}
        </div>
      ) : exams.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <FileText size={36} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm text-mauve">Nenhum exame ainda</p>
          <p className="font-body text-xs text-mauve/60 mt-1">Adicione o primeiro exame acima</p>
        </div>
      ) : examsByYear.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <Search size={32} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum exame encontrado</p>
          <p className="font-body text-xs text-mauve">Tente ajustar os filtros de busca.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {examsByYear.map(([year, yearExams]) => {
            const isCollapsed = collapsedYears.has(year)
            return (
              <motion.div key={year} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                {/* Header do ano */}
                <button
                  onClick={() => toggleYear(year)}
                  className="w-full flex items-center justify-between mb-2 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-semibold text-onyx">{year}</span>
                    <span className="font-body text-xs text-mauve/60 bg-ivory border border-border px-2 py-0.5 rounded-full">
                      {yearExams.length} exame{yearExams.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-mauve/40 group-hover:text-mauve transition-colors">
                    {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </span>
                </button>

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-2">
                        {yearExams.map((exam, i) => {
                          const isRunning   = !!analyzing[exam.id]
                          const errMsg      = examErrors[exam.id]
                          const displayStatus = isRunning ? 'processing' : exam.status
                          const cfg  = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.pending
                          const Icon = cfg.icon
                          const hasFile     = !!(exam as unknown as { file_url: string | null }).file_url
                          const isProcessed = exam.status === 'processed'
                          const canAnalyze  = hasFile && !isRunning && !isProcessed && exam.status !== 'processing'
                          const analyzeLabel = exam.status === 'error' ? 'Tentar novamente' : 'Extrair dados'

                          return (
                            <motion.div key={exam.id}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="card-premium overflow-hidden"
                            >
                              <div className="p-5 flex items-center gap-4 cursor-pointer"
                                onClick={() => router.push('/dashboard/exams/' + exam.id)}>
                                <div className="w-10 h-10 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                                  <FileText size={18} className="text-petal" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {editingNameId === exam.id ? (
                                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                      <input value={nameDraft} autoFocus
                                        onChange={e => setNameDraft(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') saveExamName(exam.id); if (e.key === 'Escape') setEditingNameId(null) }}
                                        className="flex-1 min-w-0 px-2 py-1 border border-border rounded-lg font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/40" />
                                      <button aria-label="Salvar" onClick={() => saveExamName(exam.id)} disabled={savingName}
                                        className="text-sage hover:text-sage/70 transition-colors flex-shrink-0">
                                        {savingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
                                      </button>
                                      <button aria-label="Cancelar" onClick={() => setEditingNameId(null)}
                                        className="text-mauve hover:text-onyx transition-colors flex-shrink-0"><X size={15} /></button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 group/name">
                                      <p className="font-body text-sm font-semibold text-onyx truncate">{exam.type ?? 'Exame'}</p>
                                      <button aria-label="Renomear" title="Renomear"
                                        onClick={e => { e.stopPropagation(); setNameDraft(exam.type ?? ''); setEditingNameId(exam.id) }}
                                        className="opacity-0 group-hover/name:opacity-100 transition-opacity text-mauve/50 hover:text-petal flex-shrink-0">
                                        <Pencil size={12} />
                                      </button>
                                    </div>
                                  )}
                                  <p className="font-body text-xs text-mauve">
                                    Realizado em {formatDate(effDate(exam))}
                                    {exam.exam_date && exam.exam_date.slice(0, 10) !== exam.created_at.slice(0, 10) && (
                                      <span className="text-mauve/40"> · enviado {formatDate(exam.created_at)}</span>
                                    )}
                                  </p>
                                  {isProcessed && !isRunning && (
                                    <p className="font-body text-xs text-sage mt-0.5">Dados disponíveis</p>
                                  )}
                                  {compareNames(profile?.name, (exam as unknown as { patient_name?: string | null }).patient_name) === 'mismatch' && (
                                    <p className="font-body text-xs text-red-500 mt-0.5 flex items-center gap-1">
                                      <AlertCircle size={11} /> Nome no laudo divergente do seu perfil
                                    </p>
                                  )}
                                </div>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-body font-medium px-3 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                                  <Icon size={11} className={isRunning ? 'animate-spin' : ''} />
                                  {cfg.label}
                                </span>
                                {isProcessed && !isRunning && (
                                  <button type="button"
                                    onClick={e => { e.stopPropagation(); router.push('/dashboard/exams/' + exam.id) }}
                                    className="ml-1 flex items-center gap-1.5 text-xs font-body font-medium text-petal-dark bg-blush border border-petal/30 px-3 py-1.5 rounded-full hover:bg-petal/10 transition-colors flex-shrink-0">
                                    Ver dados →
                                  </button>
                                )}
                                {canAnalyze && (
                                  <button type="button"
                                    onClick={e => { e.stopPropagation(); analyzeExam(exam) }}
                                    className="ml-1 flex items-center gap-1.5 text-xs font-body font-medium text-white gradient-sintera px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity flex-shrink-0 shadow-sm">
                                    <Zap size={11} /> {analyzeLabel}
                                  </button>
                                )}
                                {isRunning && (
                                  <div className="ml-1 flex items-center gap-1.5 text-xs font-body text-mauve flex-shrink-0">
                                    <Loader2 size={13} className="animate-spin" /><span>Extraindo…</span>
                                  </div>
                                )}
                                {!isRunning && (
                                  <button type="button" disabled={deletingId === exam.id}
                                    onClick={e => { e.stopPropagation(); deleteExam(exam) }}
                                    aria-label="Excluir exame" title="Excluir exame"
                                    className="ml-1 w-8 h-8 rounded-full flex items-center justify-center text-mauve/50 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-40">
                                    {deletingId === exam.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  </button>
                                )}
                              </div>
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
