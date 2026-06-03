'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, FileText, Loader2, RefreshCw, Zap,
  TrendingUp, TrendingDown, Minus, HelpCircle, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Exam {
  id: string
  type: string | null
  status: string
  pdf_quality: string | null
  page_count: number | null
  created_at: string
  error_reason: string | null
}

interface Biomarker {
  id: string
  name: string
  value: number | null
  unit: string | null
  reference_min: number | null
  reference_max: number | null
  interpretation: string | null
  range_extracted: boolean
  reference_source: string | null
  source: string | null
}

interface LastLog {
  started_at: string
  parse_repaired: boolean
  extraction_path: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const INTERP_ORDER: Record<string, number> = {
  acima_da_referencia:       1,
  abaixo_da_referencia:      2,
  dentro_da_referencia:      3,
  sem_referencia_identificada: 4,
  indisponivel:              5,
}

const INTERP_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ComponentType<{ size: number; className?: string }> }> = {
  acima_da_referencia:         { label: 'Acima da ref.',    color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200', Icon: TrendingUp   },
  abaixo_da_referencia:        { label: 'Abaixo da ref.',   color: 'text-blue-500',   bg: 'bg-blue-50 border-blue-200',     Icon: TrendingDown },
  dentro_da_referencia:        { label: 'Dentro da ref.',   color: 'text-sage',       bg: 'bg-sage-light border-sage/30',   Icon: Minus        },
  sem_referencia_identificada: { label: 'Sem referência',   color: 'text-mauve',      bg: 'bg-ivory border-border',         Icon: HelpCircle   },
  indisponivel:                { label: 'Sem valor',        color: 'text-mauve/60',   bg: 'bg-ivory border-border',         Icon: HelpCircle   },
}

function sortBiomarkers(bms: Biomarker[]): Biomarker[] {
  return [...bms].sort((a, b) => {
    const oa = INTERP_ORDER[a.interpretation ?? ''] ?? 6
    const ob = INTERP_ORDER[b.interpretation ?? ''] ?? 6
    if (oa !== ob) return oa - ob
    return (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR')
  })
}

function formatRef(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${min} – ${max}`
  if (min !== null) return `> ${min}`
  if (max !== null) return `< ${max}`
  return '—'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const examId  = params.id as string
  const supabase = useRef(createClient()).current

  const [exam, setExam]           = useState<Exam | null>(null)
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
  const [lastLog, setLastLog]     = useState<LastLog | null>(null)
  const [loading, setLoading]     = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [examId])

  async function loadData() {
    setLoading(true)
    const [{ data: examData }, { data: bioData }, { data: logData }] = await Promise.all([
      supabase.from('exams').select('id,type,status,pdf_quality,page_count,created_at,error_reason')
        .eq('id', examId).single(),
      supabase.from('biomarkers')
        .select('id,name,value,unit,reference_min,reference_max,interpretation,range_extracted,reference_source,source')
        .eq('exam_id', examId),
      supabase.from('ai_processing_log')
        .select('started_at,parse_repaired,extraction_path')
        .eq('exam_id', examId)
        .eq('status', 'success')
        .order('started_at', { ascending: false })
        .limit(1),
    ])
    if (examData) setExam(examData as Exam)
    if (bioData)  setBiomarkers(sortBiomarkers(bioData as Biomarker[]))
    if (logData?.[0]) setLastLog(logData[0] as LastLog)
    setLoading(false)
  }

  async function handleAnalyze() {
    if (analyzing) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res  = await fetch(`/api/exams/${examId}/analyze`, { method: 'POST' })
      const data = await res.json() as { error?: string; code?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      await loadData()
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : 'Falha de conexão.')
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Contagens para o cabeçalho ──────────────────────────────────────────
  const counts = {
    acima:  biomarkers.filter(b => b.interpretation === 'acima_da_referencia').length,
    abaixo: biomarkers.filter(b => b.interpretation === 'abaixo_da_referencia').length,
    dentro: biomarkers.filter(b => b.interpretation === 'dentro_da_referencia').length,
    total:  biomarkers.length,
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={28} className="animate-spin text-petal" />
    </div>
  )

  const isProcessed  = exam?.status === 'processed'
  const hasResults   = biomarkers.length > 0
  const analyzeLabel = isProcessed ? 'Reanalisar' : 'Analisar exame'
  const AnalyzeIcon  = isProcessed ? RefreshCw : Zap

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Voltar */}
      <button onClick={() => router.push('/dashboard/exams')}
        className="flex items-center gap-2 text-mauve hover:text-petal transition-colors text-sm font-body">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Cabeçalho do exame */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="card-premium p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0">
              <FileText size={22} className="text-petal" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold text-onyx truncate">
                {exam?.type ?? 'Exame'}
              </h1>
              <p className="font-body text-sm text-mauve mt-0.5">
                {exam ? formatDate(exam.created_at) : ''}
                {exam?.page_count ? ` · ${exam.page_count} páginas` : ''}
              </p>

              {/* Resumo de contagens */}
              {hasResults && (
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="font-body text-xs font-medium text-onyx/60">
                    {counts.total} biomarcadores
                  </span>
                  {counts.acima > 0 && (
                    <span className="font-body text-xs font-semibold text-orange-500">
                      ↑ {counts.acima} acima
                    </span>
                  )}
                  {counts.abaixo > 0 && (
                    <span className="font-body text-xs font-semibold text-blue-500">
                      ↓ {counts.abaixo} abaixo
                    </span>
                  )}
                  {counts.dentro > 0 && (
                    <span className="font-body text-xs font-semibold text-sage">
                      ✓ {counts.dentro} normais
                    </span>
                  )}
                </div>
              )}

              {/* Última análise bem-sucedida */}
              {lastLog && (
                <p className="font-body text-xs text-mauve/60 mt-2">
                  Última análise: {formatDate(lastLog.started_at)}
                  {lastLog.parse_repaired && ' · reparado automaticamente'}
                  {lastLog.extraction_path === 'pdf_native' && ' · leitura nativa PDF'}
                </p>
              )}
            </div>
          </div>

          {/* Botão de análise */}
          <button onClick={handleAnalyze} disabled={analyzing}
            className="flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm flex-shrink-0 disabled:opacity-60">
            {analyzing
              ? <><Loader2 size={14} className="animate-spin" /> Analisando…</>
              : <><AnalyzeIcon size={14} /> {analyzeLabel}</>
            }
          </button>
        </div>

        {/* Erro de análise */}
        {analyzeError && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-red-700">{analyzeError}</p>
          </div>
        )}
      </motion.div>

      {/* Tabela de biomarcadores */}
      {hasResults ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card-premium overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h2 className="font-display text-base font-semibold text-onyx">Biomarcadores extraídos</h2>
          </div>

          {/* Header da tabela */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-2 px-5 py-2.5 bg-ivory border-b border-border/50">
            {['Biomarcador', 'Resultado', 'Referência', 'Classificação', 'Fonte'].map(h => (
              <span key={h} className="font-body text-xs font-semibold text-onyx/40 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-border/30">
            {biomarkers.map((b, i) => {
              const cfg = INTERP_CONFIG[b.interpretation ?? ''] ?? INTERP_CONFIG.indisponivel
              const Icon = cfg.Icon
              return (
                <motion.div key={b.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.02 + i * 0.01 }}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-2 items-center px-5 py-3 hover:bg-blush/20 transition-colors">

                  {/* Biomarcador */}
                  <span className="font-body text-sm font-medium text-onyx">{b.name}</span>

                  {/* Resultado */}
                  <span className="font-body text-sm text-onyx">
                    {b.value !== null ? `${b.value}` : '—'}
                    {b.unit ? <span className="text-mauve text-xs ml-1">{b.unit}</span> : null}
                  </span>

                  {/* Referência */}
                  <span className="font-body text-sm text-mauve">
                    {formatRef(b.reference_min, b.reference_max)}
                    {!b.range_extracted && b.reference_min === null && b.reference_max === null && ''}
                  </span>

                  {/* Classificação */}
                  <span className={`inline-flex items-center gap-1 font-body text-xs font-medium px-2.5 py-1 rounded-full border w-fit ${cfg.bg} ${cfg.color}`}>
                    <Icon size={10} />
                    {cfg.label}
                  </span>

                  {/* Fonte */}
                  <span className="font-body text-xs text-mauve/70 capitalize">
                    {b.reference_source ?? '—'}
                  </span>
                </motion.div>
              )
            })}
          </div>

          {/* Rodapé com contagem — E5 homologação */}
          <div className="px-5 py-3 bg-ivory border-t border-border/50">
            <p className="font-body text-xs text-mauve/60">
              {counts.total} biomarcadores exibidos · fonte: {biomarkers[0]?.source ?? 'ai_extracted'}
            </p>
          </div>
        </motion.div>
      ) : (
        /* Estado vazio */
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card-premium p-12 text-center">
          <FileText size={40} className="text-border mx-auto mb-3" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum biomarcador encontrado</p>
          <p className="font-body text-xs text-mauve">
            {exam?.status === 'error'
              ? `Última análise falhou (${exam.error_reason ?? 'erro desconhecido'}). Clique em "Analisar exame" para tentar novamente.`
              : 'Clique em "Analisar exame" para extrair os biomarcadores deste exame.'}
          </p>
        </motion.div>
      )}
    </div>
  )
}
