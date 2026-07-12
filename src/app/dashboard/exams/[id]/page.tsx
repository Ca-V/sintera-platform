'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, FileText, Loader2, RefreshCw, Zap,
  TrendingUp, TrendingDown, Minus, HelpCircle, AlertCircle,
  Download, Printer, ChevronDown, CalendarDays,
  Pencil, Check, X, Flag, Trash2,
  Droplet, FlaskConical, TestTube,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { parseDateOnly } from '@/lib/agenda'
import { useModalA11y } from '@/lib/ui/useModalA11y'
import { useUser } from '@/context/UserContext'
import { compareNames } from '@/lib/exams/nameMatch'
import { loadCatalogLabels, buildCatalogLabels, type CatalogLabels } from '@/lib/biomarkers/catalogLabels'
import { canonicalMaterial, materialRank } from '@/lib/biomarkers/canonicalLabels'
import FeedbackModal from '@/components/FeedbackModal'
import AgendarModal, { type AgendaEventInput } from '@/components/AgendarModal'
import { useEventForm } from '@/components/eventForm'
import MotionCard from '@/components/ui/MotionCard'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Exam {
  id: string
  type: string | null
  status: string
  pdf_quality: string | null
  page_count: number | null
  created_at: string
  error_reason: string | null
  text_truncated: boolean | null
}

interface Biomarker {
  id: string
  name: string
  value: number | null
  value_text: string | null
  unit: string | null
  reference_min: number | null
  reference_max: number | null
  interpretation: string | null
  result_type: string | null
  range_extracted: boolean
  reference_source: string | null
  source: string | null
  catalog_id: string | null
  // Contexto do laudo (Fidelidade da Ingestão) — texto original ou null (legado):
  source_material: string | null
  source_exam_name: string | null
  // Enriquecidos em loadData a partir do biomarker_catalog (fallback do material):
  specimen?: string | null   // 'sangue' | 'urina' | 'urina_24h'
  category?: string | null   // painel científico (NÃO segmenta a tela — dimensão do KG)
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

const INTERP_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ComponentType<{ size: number; className?: string }> | null }> = {
  acima_da_referencia:         { label: 'Acima da referência informada pelo laboratório',  color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', Icon: TrendingUp   },
  abaixo_da_referencia:        { label: 'Abaixo da referência informada pelo laboratório', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     Icon: TrendingDown },
  dentro_da_referencia:        { label: 'Dentro da referência informada pelo laboratório', color: 'text-petal',       bg: 'bg-blush border-petal/30',   Icon: Minus        },
  // Resultado presente; o laudo só não trouxe a faixa de referência para comparar.
  sem_referencia_identificada: { label: 'O laboratório não informou uma faixa de referência', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', Icon: HelpCircle },
  // Resultado PRESENTE e qualitativo (Negativo, Ausentes, Turvo…) — nunca "ausente".
  qualitative:                 { label: 'Resultado descritivo (em palavras, sem faixa numérica para comparar)', color: 'text-mauve', bg: 'bg-ivory border-border', Icon: null },
  // Resultado realmente não trazido pelo laudo.
  missing:                     { label: 'Este resultado não foi informado no laudo', color: 'text-mauve', bg: 'bg-ivory border-border', Icon: null },
  extraction_failed:           { label: 'Não foi possível ler este item do laudo', color: 'text-red-500', bg: 'bg-red-50 border-red-200', Icon: AlertCircle },
  // Fallback neutro (numérico sem interpretação) — NÃO diz "ausente".
  indisponivel:                { label: 'Sem interpretação numérica disponível', color: 'text-mauve', bg: 'bg-ivory border-border', Icon: null },
}

// ── Índice Experimental ───────────────────────────────────────────────────────

const MIN_DENOMINATOR = 5

function calcExperimentalIndex(bms: Biomarker[]): { numerator: number; denominator: number; pct: number } | null {
  const eligible = bms.filter(
    b => b.reference_source === 'laudo' && b.result_type === 'numeric' && b.interpretation !== null
  )
  const denominator = eligible.length
  if (denominator < MIN_DENOMINATOR) return null
  const numerator = eligible.filter(b => b.interpretation === 'dentro_da_referencia').length
  return { numerator, denominator, pct: Math.round((numerator / denominator) * 100) }
}

function IndexCard({ index }: { index: { numerator: number; denominator: number; pct: number } }) {
  const color    = index.pct >= 80 ? 'text-petal' : index.pct >= 60 ? 'text-amber-600' : 'text-orange-500'
  const bg       = index.pct >= 80 ? 'bg-blush border-petal/30' : index.pct >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-orange-50 border-orange-200'
  const [tip, setTip] = useState(false)
  return (
    <div className={`rounded-2xl border px-5 py-4 ${bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Proporção dentro da referência</span>
          </div>
          <p className={`font-display text-3xl font-bold ${color}`}>{index.pct}%</p>
          <p className="font-body text-xs text-mauve mt-0.5">{index.numerator} de {index.denominator} biomarcadores dentro da referência</p>
        </div>
        {/* Tooltip — O que é isso? */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setTip(t => !t)}
            className="w-6 h-6 rounded-full bg-white/70 border border-current/20 flex items-center justify-center text-mauve hover:text-onyx transition-colors"
            aria-label="O que é este índice?">
            <HelpCircle size={14} />
          </button>
          {tip && (
            <div className="absolute right-0 top-8 z-20 w-72 bg-white rounded-2xl shadow-xl border border-border p-4">
              <p className="font-body text-xs font-semibold text-onyx mb-2">O que é a Proporção dentro da referência?</p>
              <p className="font-body text-xs text-mauve leading-relaxed mb-2">
                É uma contagem simples: de todos os biomarcadores numéricos com referência impressa neste laudo, quantos estão dentro da faixa informada pelo laboratório.
              </p>
              <p className="font-body text-xs text-mauve leading-relaxed mb-2">
                <strong className="text-onyx">Importante:</strong> cada laboratório usa referências próprias. Um mesmo valor pode estar “dentro” em um laudo e “fora” em outro.
              </p>
              <p className="font-body text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 leading-relaxed">
                Esta métrica não representa diagnóstico, risco ou estado geral de saúde. Não substitui avaliação médica.
              </p>
              <button onClick={() => setTip(false)} className="mt-2 w-full text-center font-body text-xs text-mauve hover:text-petal transition-colors">
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="font-body text-[11px] text-mauve mt-3 leading-relaxed">
        Métrica informativa baseada apenas na proporção de resultados numéricos dentro das referências impressas neste laudo.
        Não representa diagnóstico, risco ou estado geral de saúde. Não substitui avaliação médica.
      </p>
    </div>
  )
}

function getInterpConfig(b: Biomarker) {
  // Prioriza o TIPO do resultado: um resultado PRESENTE (qualitativo) nunca é "ausente".
  if (b.result_type === 'extraction_failed') return INTERP_CONFIG.extraction_failed
  if (b.result_type === 'missing')           return INTERP_CONFIG.missing
  if (b.result_type === 'qualitative')       return INTERP_CONFIG.qualitative
  return INTERP_CONFIG[b.interpretation ?? ''] ?? INTERP_CONFIG.sem_referencia_identificada
}

function sortBiomarkers(bms: Biomarker[]): Biomarker[] {
  return [...bms].sort((a, b) => {
    const oa = INTERP_ORDER[a.interpretation ?? ''] ?? 6
    const ob = INTERP_ORDER[b.interpretation ?? ''] ?? 6
    if (oa !== ob) return oa - ob
    return (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR')
  })
}

/** Número em pt-BR: vírgula decimal + agrupamento de milhar, sem arredondar. */
function fmtNum(n: number): string {
  const [int, dec] = String(n).split('.')
  const grouped = Number(int).toLocaleString('pt-BR')
  return dec ? `${grouped},${dec}` : grouped
}

function formatRef(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${fmtNum(min)} – ${fmtNum(max)}`
  if (min !== null) return `> ${fmtNum(min)}`
  if (max !== null) return `< ${fmtNum(max)}`
  return '—'
}

function formatDate(iso: string) {
  return parseDateOnly(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Agrupamento por material (specimen) e painel (categoria) ───────────────────
// Deixa claro de QUAL exame cada biomarcador veio (sangue x urina) e mantém as
// variáveis de um mesmo painel juntas, em vez de uma lista solta. Só apresentação:
// rótulos legíveis para os códigos que já existem em biomarker_catalog.

// Ícone por material. Fallback cobre qualquer tipo futuro (fezes, saliva, líquor…).
// (rótulo/ordem do material vêm do catálogo via CatalogLabels — ícone é presentação.)
const SPECIMEN_META: Record<string, { Icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
  sangue:    { Icon: Droplet,      color: 'text-red-400' },
  urina:     { Icon: FlaskConical, color: 'text-amber-500' },
  urina_24h: { Icon: FlaskConical, color: 'text-amber-500' },
}
const SPECIMEN_FALLBACK = { Icon: TestTube, color: 'text-mauve' }

/** Suaviza valores descritivos em CAIXA ALTA (comuns em laudos) para caixa de frase. */
function prettyValueText(s: string): string {
  const t = s.trim()
  if (t.length > 1 && t === t.toUpperCase() && t !== t.toLowerCase()) {
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  }
  return t
}

/** Parte principal + unidade do resultado, para NÚMERO e TEXTO terem o MESMO
 *  tratamento (valor grande, unidade pequena e discreta). Quando o laudo embute
 *  a unidade no texto (ex.: "SUPERIOR A 90 mL/min/1,73 m2"), ela é extraída para
 *  não inflar o resultado. Vale para qualquer exame incorporado à plataforma. */
function displayValue(b: Biomarker): { main: string | null; unit: string | null } {
  if (b.result_type === 'qualitative' && b.value_text) {
    const raw = b.value_text.trim()
    const u = b.unit?.trim()
    if (u && raw.length > u.length && raw.toLowerCase().endsWith(u.toLowerCase())) {
      return { main: prettyValueText(raw.slice(0, raw.length - u.length).trim()), unit: u }
    }
    return { main: prettyValueText(raw), unit: null }
  }
  if (b.value !== null) return { main: fmtNum(b.value), unit: b.unit?.trim() || null }
  return { main: null, unit: null }
}

// Agrupamento da página de Exames — FIEL AO LAUDO (Fidelidade da Ingestão):
// Material → Nome do exame → Resultados. O material e o nome do exame vêm do LAUDO
// (source_material / source_exam_name); no legado (null) o material cai no fallback do
// catálogo (specimen) e não há nível de exame. O painel científico (category) NÃO
// segmenta a tela — é dimensão do Knowledge Graph. Ordem = primeira aparição (fiel ao laudo).
interface ExamGroup {
  key: string
  label: string
  iconKey: string
  exams: { key: string; label: string | null; items: Biomarker[] }[]
}

function groupByExam(bms: Biomarker[], labels: CatalogLabels): ExamGroup[] {
  const materialLabelOf = (b: Biomarker) => b.source_material?.trim() || labels.materialLabel(b.specimen)
  const examLabelOf = (b: Biomarker) => b.source_exam_name?.trim() || null

  // Rótulos permanecem FIÉIS ao laudo (Fidelidade da Ingestão); só a ORDEM passa a ser
  // estável por material (Sangue → Urina → Urina 24h → …) em vez de 1ª aparição.
  const mats = new Map<string, ExamGroup & { rank: number }>()
  for (const b of bms) {
    const mLabel = materialLabelOf(b)
    if (!mats.has(mLabel)) {
      const canonKey = b.specimen ?? canonicalMaterial(b.source_material).key
      mats.set(mLabel, { key: mLabel, label: mLabel, iconKey: b.specimen ?? 'outros', exams: [], rank: materialRank(canonKey, labels.specimenOrder) })
    }
    const mat = mats.get(mLabel)!
    const eLabel = examLabelOf(b)
    const eKey = eLabel ?? '__sem_exame__'
    let ex = mat.exams.find(e => e.key === eKey)
    if (!ex) { ex = { key: eKey, label: eLabel, items: [] }; mat.exams.push(ex) }
    ex.items.push(b)
  }
  return [...mats.values()]
    .sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label, 'pt-BR'))
    .map(g => ({ key: g.key, label: g.label, iconKey: g.iconKey, exams: g.exams }))
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const { user, profile } = useUser()
  const { saveEvent } = useEventForm()
  const examId  = params.id as string
  const supabase = useRef(createClient()).current
  // P1 — guarda de disparo único da auto-análise (cobre Strict Mode / re-render)
  const autoStartedRef = useRef(false)

  const [exam, setExam]           = useState<Exam | null>(null)
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
  const [labels, setLabels]         = useState<CatalogLabels>(() => buildCatalogLabels([], []))
  const [lastLog, setLastLog]     = useState<LastLog | null>(null)
  const [loading, setLoading]     = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [exportOpen, setExportOpen]     = useState(false)
  const [agendarOpen, setAgendarOpen]   = useState(false)

  // ── Renomear exame ───────────────────────────────────────────────────────
  const [editingName, setEditingName]   = useState(false)
  const [nameValue, setNameValue]       = useState('')
  const [savingName, setSavingName]     = useState(false)

  // ── Editar data do exame ──────────────────────────────────────────────────
  const [editingDate, setEditingDate]   = useState(false)
  const [dateValue, setDateValue]       = useState('')
  const [savingDate, setSavingDate]     = useState(false)

  function startEditDate() {
    const current = (exam as unknown as { exam_date?: string | null })?.exam_date
    setDateValue(current ?? new Date().toISOString().split('T')[0])
    setEditingDate(true)
  }

  async function saveDate() {
    if (!exam || !dateValue) return
    setSavingDate(true)
    await supabase.from('exams').update({ exam_date: dateValue } as never).eq('id', exam.id)
    setExam(prev => prev ? { ...prev, exam_date: dateValue } as never : prev)
    setEditingDate(false)
    setSavingDate(false)
  }

  function startEditName() {
    setNameValue(exam?.type ?? '')
    setEditingName(true)
  }

  async function saveName() {
    if (!exam || !nameValue.trim()) return
    setSavingName(true)
    await supabase.from('exams').update({ type: nameValue.trim() } as never).eq('id', exam.id)
    setExam(prev => prev ? { ...prev, type: nameValue.trim() } : prev)
    setEditingName(false)
    setSavingName(false)
  }

  function cancelEditName() {
    setEditingName(false)
    setNameValue('')
  }

  // ── Excluir exame ───────────────────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false)
  async function deleteExam() {
    if (!exam || deleting) return
    const ok = window.confirm(
      `Excluir "${exam.type ?? 'Exame'}"?\n\nIsto remove o exame, seus biomarcadores e insights, e o arquivo enviado. ` +
      `O seu Histórico será recalculado sem este exame. Esta ação não pode ser desfeita.`,
    )
    if (!ok) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/exams/${exam.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/dashboard/exams')
      else { setDeleting(false); alert('Falha ao excluir o exame. Tente novamente.') }
    } catch {
      setDeleting(false); alert('Falha ao excluir o exame. Tente novamente.')
    }
  }

  // ── Reportar problema ────────────────────────────────────────────────────
  const [reportOpen, setReportOpen]     = useState(false)
  const [reportText, setReportText]     = useState('')
  const [reportSent, setReportSent]     = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  useModalA11y(reportRef, () => { setReportOpen(false); setReportSent(false) }, reportOpen)
  const [reportLoading, setReportLoading] = useState(false)

  async function submitReport() {
    if (!reportText.trim()) return
    setReportLoading(true)
    try {
      await fetch('/api/events', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'problema_reportado',
          metadata: {
            exam_id:     examId,
            exam_type:   exam?.type ?? '',
            descricao:   reportText.trim(),
            categoria:   'erro_extracao',
          },
        }),
      })
      setReportSent(true)
      setReportText('')
      setTimeout(() => { setReportOpen(false); setReportSent(false) }, 2500)
    } catch {
      setReportLoading(false)
    } finally {
      setReportLoading(false)
    }
  }

  // ── Export CSV ───────────────────────────────────────────────────────────
  function exportCSV() {
    if (!exam || biomarkers.length === 0) return
    const header = ['Biomarcador', 'Resultado', 'Unidade', 'Tipo', 'Ref. Mínima', 'Ref. Máxima', 'Situação', 'Fonte da Referência']
    const rows = biomarkers.map(b => {
      const resultado = b.result_type === 'qualitative' ? (b.value_text ?? '') : (b.value !== null ? String(b.value) : '')
      const situacao  = b.interpretation?.replace(/_/g, ' ') ?? ''
      return [
        `"${b.name}"`,
        `"${resultado}"`,
        `"${b.unit ?? ''}"`,
        `"${b.result_type ?? ''}"`,
        b.reference_min !== null ? String(b.reference_min) : '',
        b.reference_max !== null ? String(b.reference_max) : '',
        `"${situacao}"`,
        `"${b.reference_source ?? ''}"`,
      ].join(',')
    })
    const csv  = [header.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `sintera_${(exam.type ?? 'exame').replace(/\s+/g, '_')}_${formatDate(exam.created_at).replace(/\s/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExportOpen(false)
  }

  // ── Export PDF (impressão) ────────────────────────────────────────────────
  function exportPDF() {
    setExportOpen(false)
    setTimeout(() => window.print(), 150)
  }

  useEffect(() => {
    loadData()
    // Tracking P2 — exam_detail_viewed
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'exam_detail_viewed', metadata: { exam_id: examId } }),
    }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registra a visualização uma vez por examId
  }, [examId])

  async function loadData(silent = false) {
    if (!silent) setLoading(true)
    const [{ data: examData }, { data: bioData }, { data: logData }, { data: catData }] = await Promise.all([
      supabase.from('exams').select('id,type,status,pdf_quality,page_count,created_at,exam_date,error_reason,text_truncated,file_url,patient_name,document_type,display_title')
        .eq('id', examId).single(),
      supabase.from('current_biomarkers')
        .select('id,name,value,value_text,unit,reference_min,reference_max,interpretation,result_type,range_extracted,reference_source,source,catalog_id,source_material,source_exam_name')
        .eq('exam_id', examId),
      supabase.from('ai_processing_log')
        .select('started_at,parse_repaired,extraction_path')
        .eq('exam_id', examId)
        .eq('status', 'success')
        .order('started_at', { ascending: false })
        .limit(1),
      supabase.from('biomarker_catalog').select('id,specimen,category,display_name'),
    ])
    setLabels(await loadCatalogLabels(supabase))
    if (examData) setExam(examData as Exam)
    if (bioData) {
      // Enriquece cada biomarcador com material/painel do catálogo (só apresentação).
      const cats   = (catData ?? []) as { id: string; specimen: string; category: string; display_name: string }[]
      const catMap = new Map(cats.map(c => [c.id, c]))
      const enriched = (bioData as Biomarker[]).map(b => {
        const c = b.catalog_id ? catMap.get(b.catalog_id) : undefined
        return { ...b, name: c?.display_name ?? b.name, specimen: c?.specimen ?? null, category: c?.category ?? null }
      })
      setBiomarkers(sortBiomarkers(enriched))
    }
    if (logData?.[0]) setLastLog(logData[0] as LastLog)
    if (!silent) setLoading(false)
  }

  async function handleAnalyze() {
    if (analyzing) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res  = await fetch(`/api/exams/${examId}/analyze`, { method: 'POST' })
      const data = await res.json() as { error?: string; code?: string }
      // 409 ALREADY_PROCESSING (ex.: outra aba já iniciou) não é erro — reflete o estado real
      if (res.status === 409) { await loadData(true); return }
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      await loadData()
      // Tracking P2 — exam_analyzed_success + incrementa contagem para FeedbackModal
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name: 'exam_analyzed_success', metadata: { exam_id: examId } }),
      }).catch(() => {})
      const prev = parseInt(localStorage.getItem('sintera_analyses_count') ?? '0')
      localStorage.setItem('sintera_analyses_count', String(prev + 1))
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : 'Falha de conexão.')
      // sincroniza o status real do servidor (ex.: 'error') para não ficar preso em "Analisando…"
      await loadData(true)
    } finally {
      setAnalyzing(false)
    }
  }

  // P1 — auto-análise baseada em ESTADO (sem flag de URL): um exame recém-enviado
  // entra como 'pending' e a análise inicia sozinha. Só dispara para 'pending'
  // (nunca 'error', evitando loop de retry). O ref garante disparo único; o
  // 409 ALREADY_PROCESSING do servidor é a rede de segurança. O setTimeout(0)
  // tira o setState do corpo síncrono do efeito.
  useEffect(() => {
    if (exam?.status !== 'pending' || autoStartedRef.current) return
    autoStartedRef.current = true
    const t = setTimeout(() => { handleAnalyze() }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.status])

  // P3 — polling silencioso enquanto o servidor processa: a análise roda no
  // servidor independentemente do cliente, então após refresh / retorno posterior
  // / outra aba, isto reflete a conclusão sozinho. Para ao sair de 'processing'.
  useEffect(() => {
    if (exam?.status !== 'processing') return
    const iv = setInterval(() => { loadData(true) }, 3000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.status])

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
  const analyzeLabel = isProcessed ? 'Extrair novamente' : 'Extrair dados'
  const AnalyzeIcon  = isProcessed ? RefreshCw : Zap

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Cabeçalho de impressão — visível apenas no print */}
      <div className="print-header hidden">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'serif', fontSize: '18px', fontWeight: '600', letterSpacing: '0.15em' }}>SINTERA</span>
          <span style={{ fontSize: '11px', color: '#888' }}>Relatório de Exame</span>
        </div>
        <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>
          {exam?.type ?? 'Exame'} · {exam ? formatDate((exam as unknown as { exam_date?: string | null }).exam_date ?? exam.created_at) : ''}
          {exam?.page_count ? ` · ${exam.page_count} páginas` : ''}
        </p>
      </div>

      {/* Rodapé de impressão — visível apenas no print */}
      <div className="print-footer hidden">
        A SINTERA organiza e exibe dados de laudos laboratoriais. Não oferece diagnóstico, interpretação clínica ou recomendações médicas.
        Os dados exibidos são reprodução estruturada do laudo original. Sempre consulte seu médico.
        Impresso em {new Date().toLocaleDateString('pt-BR')}.
      </div>

      {/* Voltar para Exames */}
      <button onClick={() => router.push('/dashboard/exams')}
        className="flex items-center gap-2 text-mauve hover:text-petal transition-colors text-sm font-body print:hidden">
        <ArrowLeft size={16} /> Exames
      </button>

      {/* Conferência de identidade — nome do paciente vs perfil */}
      {(() => {
        const examName = (exam as unknown as { patient_name?: string | null })?.patient_name
        if (!examName) return null
        const status = compareNames(profile?.name, examName)
        if (status === 'mismatch') {
          return (
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3 print:hidden">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-body text-sm font-semibold text-red-700">Confira: este exame parece ser de outra pessoa</p>
                <p className="font-body text-xs text-red-600 mt-1 leading-relaxed">
                  Nome no laudo: <strong>{examName}</strong>
                  {profile?.name ? <> · seu perfil: <strong>{profile.name}</strong></> : null}.
                  Se este exame não for seu, exclua-o.
                </p>
              </div>
            </div>
          )
        }
        return (
          <p className="font-body text-xs text-mauve print:hidden">
            Paciente no laudo: <strong className="text-onyx">{examName}</strong>
          </p>
        )
      })()}

      {/* Cabeçalho do exame */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        padding="lg">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blush flex items-center justify-center flex-shrink-0">
              <FileText size={22} className="text-petal" />
            </div>
            <div className="min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    aria-label="Nome do exame"
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEditName() }}
                    className="font-display text-xl font-semibold text-onyx bg-ivory border border-petal/40 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-petal/40 min-w-0 w-full"
                  />
                  <button onClick={saveName} disabled={savingName}
                    className="text-petal hover:text-petal/70 transition-colors flex-shrink-0">
                    {savingName ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  </button>
                  <button onClick={cancelEditName} className="text-mauve hover:text-onyx transition-colors flex-shrink-0">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/name">
                  <h1 className="font-display text-xl font-semibold text-onyx break-words min-w-0">
                    {exam?.type ?? 'Exame'}
                  </h1>
                  <button onClick={startEditName}
                    className="opacity-0 group-hover/name:opacity-100 transition-opacity text-mauve hover:text-petal flex-shrink-0 print:hidden">
                    <Pencil size={13} />
                  </button>
                </div>
              )}
              {/* Data editável */}
              {editingDate ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    type="date"
                    aria-label="Data do exame"
                    value={dateValue}
                    onChange={e => setDateValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveDate(); if (e.key === 'Escape') setEditingDate(false) }}
                    className="font-body text-sm text-onyx bg-ivory border border-petal/40 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-petal/40"
                  />
                  <button onClick={saveDate} disabled={savingDate} className="text-petal hover:text-petal/70 transition-colors flex-shrink-0">
                    {savingDate ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  </button>
                  <button onClick={() => setEditingDate(false)} className="text-mauve hover:text-onyx transition-colors flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group/date mt-0.5">
                  <p className="font-body text-sm text-mauve">
                    Realizado em {exam ? formatDate((exam as unknown as { exam_date?: string | null }).exam_date ?? exam.created_at) : ''}
                    {exam?.page_count ? ` · ${exam.page_count} páginas` : ''}
                  </p>
                  <button onClick={startEditDate}
                    className="opacity-0 group-hover/date:opacity-100 transition-opacity text-mauve hover:text-petal flex-shrink-0 print:hidden">
                    <Pencil size={11} />
                  </button>
                </div>
              )}

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
                    <span className="font-body text-xs font-semibold text-blue-600">
                      ↓ {counts.abaixo} abaixo
                    </span>
                  )}
                  {counts.dentro > 0 && (
                    <span className="font-body text-xs font-semibold text-petal">
                      ✓ {counts.dentro} normais
                    </span>
                  )}
                </div>
              )}

              {/* Última extração bem-sucedida */}
              {lastLog && (
                <p className="font-body text-xs text-mauve mt-2">
                  Última extração: {formatDate(lastLog.started_at)}
                  {lastLog.parse_repaired && ' · reparado automaticamente'}
                  {lastLog.extraction_path === 'pdf_native' && ' · leitura nativa PDF'}
                </p>
              )}
            </div>
          </div>

          {/* Botões de ação — sempre abaixo do título, em largura total, quebrando
              em linhas conforme a largura. Nunca competem com o título (que colapsava
              o nome letra a letra em telas médias). */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">

            {/* Reportar problema */}
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 border border-border text-mauve font-body text-sm font-medium px-3 py-2.5 rounded-full hover:border-red-300 hover:text-red-500 transition-colors">
              <Flag size={14} /> Reportar
            </button>

            {/* Agendar */}
            <button
              onClick={() => setAgendarOpen(true)}
              className="flex items-center gap-1.5 border border-border text-mauve font-body text-sm font-medium px-3 py-2.5 rounded-full hover:border-petal/40 hover:text-petal transition-colors">
              <CalendarDays size={14} /> Criar lembrete
            </button>

            {/* Baixar/ver PDF original — disponível sempre que houver arquivo */}
            {(exam as unknown as { file_url?: string | null })?.file_url && (
              <a href={(exam as unknown as { file_url: string }).file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 border border-border text-mauve font-body text-sm font-medium px-3 py-2.5 rounded-full hover:border-petal/40 hover:text-petal transition-colors">
                <Download size={14} /> Baixar PDF
              </a>
            )}

            {/* Export */}
            {isProcessed && biomarkers.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setExportOpen(o => !o)}
                  className="flex items-center gap-1.5 border border-border text-mauve font-body text-sm font-medium px-3 py-2.5 rounded-full hover:border-petal/40 hover:text-petal transition-colors">
                  <Download size={14} /> Exportar <ChevronDown size={12} />
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-2xl shadow-xl border border-border overflow-hidden w-44">
                      <button onClick={exportCSV}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-onyx hover:bg-blush transition-colors text-left">
                        <Download size={14} className="text-petal flex-shrink-0" />
                        Baixar CSV
                      </button>
                      <button onClick={exportPDF}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-onyx hover:bg-blush transition-colors text-left border-t border-border/50">
                        <Printer size={14} className="text-petal flex-shrink-0" />
                        Imprimir / PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Analisar */}
            <button onClick={handleAnalyze} disabled={analyzing}
              className="flex items-center gap-2 gradient-sintera text-white font-body text-sm font-medium px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60">
              {analyzing
                ? <><Loader2 size={14} className="animate-spin" /> Extraindo…</>
                : <><AnalyzeIcon size={14} /> {analyzeLabel}</>
              }
            </button>
          </div>
        </div>

        {/* Banner de truncagem — text_truncated */}
        {exam?.text_truncated && (
          <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-xs font-semibold text-amber-800">Laudo parcialmente processado</p>
              <p className="font-body text-xs text-amber-700 mt-0.5 leading-relaxed">
                Este laudo é muito extenso e foi processado parcialmente. Alguns biomarcadores podem não ter sido extraídos.
                Extraia os dados novamente ou confira o laudo original para garantir que todos os dados estão presentes.
              </p>
            </div>
          </div>
        )}

        {/* Erro de análise */}
        {analyzeError && (
          <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-red-700">{analyzeError}</p>
          </div>
        )}
      </MotionCard>

      {/* Índice Experimental */}
      {hasResults && (() => {
        const idx = calcExperimentalIndex(biomarkers)
        return idx ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <IndexCard index={idx} />
          </motion.div>
        ) : null
      })()}

      {/* Tabela de biomarcadores */}
      {hasResults ? (
        <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          padding="none" className="overflow-hidden">
          <div className="p-5 border-b border-border/50">
            <h2 className="font-display text-base font-semibold text-onyx">Biomarcadores extraídos</h2>
          </div>

          {/* Agrupado por material (sangue/urina) e painel — deixa claro de qual exame
              cada biomarcador veio e mantém as variáveis do mesmo painel juntas */}
          {groupByExam(biomarkers, labels).map(mat => {
            const sm = SPECIMEN_META[mat.iconKey] ?? SPECIMEN_FALLBACK
            const SpecIcon = sm.Icon
            return (
            <div key={mat.key}>
              {/* Cabeçalho do MATERIAL (do laudo; fallback ao catálogo no legado) */}
              <div className="px-5 py-2.5 bg-ivory border-b border-border/50 flex items-center gap-2">
                <SpecIcon size={15} className={`${sm.color} flex-shrink-0`} />
                <h3 className="font-body text-xs font-semibold text-onyx/70 uppercase tracking-wider">{mat.label}</h3>
              </div>

              {mat.exams.map(ex => (
                <div key={ex.key}>
                  {/* Nome do EXAME informado no laudo (ausente no legado) */}
                  {ex.label && (
                    <p className="px-5 pt-3 pb-1 font-body text-[11px] font-semibold text-mauve uppercase tracking-wide">
                      {ex.label}
                    </p>
                  )}

                  <div className="divide-y divide-border/30">
                    {ex.items.map((b, i) => {
                      const cfg  = getInterpConfig(b)
                      const Icon = cfg.Icon
                      const dv   = displayValue(b)
                      // A faixa só é mostrada quando o laudo realmente a trouxe.
                      const hasRange = b.reference_source !== 'ausente' &&
                        (b.reference_min !== null || b.reference_max !== null)

                      return (
                        <motion.div key={b.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.01 + i * 0.008 }}
                          className="px-5 py-3 hover:bg-blush/20 transition-colors">

                          {/* Nome do biomarcador */}
                          <p className="font-body text-sm font-medium text-onyx">{b.name}</p>

                          {/* Resultado — protagonista; número e texto com o MESMO
                              tratamento (valor grande, unidade sempre pequena) */}
                          <p className="font-body text-xl font-semibold text-onyx mt-0.5 leading-tight">
                            {dv.main !== null
                              ? <>{dv.main}{dv.unit ? <span className="text-mauve text-sm font-normal ml-1">{dv.unit}</span> : null}</>
                              : <span className="text-mauve/40 font-normal">—</span>
                            }
                          </p>

                          {/* Referência + status numa linha discreta (não rouba atenção do valor) */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                            {hasRange && (
                              <span className="font-body text-[11px] text-mauve">
                                Referência do laboratório: {formatRef(b.reference_min, b.reference_max)}{b.unit ? ` ${b.unit}` : ''}
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 font-body text-[11px] ${cfg.color}`}>
                              {Icon && <Icon size={11} className="flex-shrink-0" />}
                              {cfg.label}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )})}

          {/* Rodapé com contagem — E5 homologação */}
          <div className="px-5 py-3 bg-ivory border-t border-border/50">
            <p className="font-body text-xs text-mauve">
              {counts.total} biomarcadores exibidos · fonte: {biomarkers[0]?.source ?? 'ai_extracted'}
            </p>
          </div>

          {/* Nota sobre a fonte da referência (regulatória) */}
          <div className="px-5 py-3 border-t border-border/50 bg-amber-50/40">
            <p className="font-body text-[11px] text-mauve leading-relaxed">
              As faixas de referência exibidas são as <strong className="text-onyx/70">impressas no laudo do seu laboratório</strong> e
              podem variar conforme o laboratório e o método. A referência adequada ao seu caso <strong className="text-onyx/70">também
              depende de avaliação médica</strong> — esta informação organiza seus dados e não substitui a consulta com seu médico.
            </p>
          </div>
        </MotionCard>
      ) : (analyzing || exam?.status === 'processing' || exam?.status === 'pending') ? (
        /* P3 — Estado de processamento (auto-análise em andamento; 'pending' evita flash do estado vazio) */
        <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          padding="2xl" className="text-center">
          <Loader2 size={40} className="text-petal mx-auto mb-3 animate-spin" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Analisando seu exame…</p>
          <p className="font-body text-xs text-mauve">A SINTERA está extraindo os biomarcadores do seu laudo. Isso leva alguns segundos.</p>
        </MotionCard>
      ) : (() => {
        // Nomenclatura por TIPO: biomarcadores são de exames de sangue/urina. Exames de
        // imagem, neuro, oftalmo etc. têm o resultado NO LAUDO — não se força "biomarcador".
        const dt = (exam as unknown as { document_type?: string | null })?.document_type ?? null
        const NON_LAB: Record<string, string> = {
          imaging: 'exame de imagem', neurophysiology: 'exame neurofisiológico',
          ophthalmology: 'exame oftalmológico', cardiology: 'exame cardiológico',
          endoscopy: 'exame endoscópico', anatomopathology: 'laudo anatomopatológico',
          medical_report: 'relatório médico',
        }
        const nonLabLabel = dt ? NON_LAB[dt] : undefined
        const fileUrl = (exam as unknown as { file_url?: string | null })?.file_url ?? null
        if (nonLabLabel && exam?.status !== 'error') {
          return (
            <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              padding="2xl" className="text-center">
              <FileText size={40} className="text-petal/70 mx-auto mb-3" />
              <p className="font-body text-sm font-semibold text-onyx mb-1">Este é um {nonLabLabel}</p>
              <p className="font-body text-xs text-mauve max-w-md mx-auto">
                O resultado deste tipo de exame está no próprio laudo (não são biomarcadores de sangue/urina).
                Consulte o documento original — a leitura estruturada por tipo de exame está em evolução.
              </p>
              {fileUrl && (
                <button type="button" onClick={() => window.open(fileUrl, '_blank', 'noopener')}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-body font-medium text-petal-dark bg-blush border border-petal/30 px-3 py-1.5 rounded-full hover:bg-petal/10 transition-colors">
                  Ver documento original →
                </button>
              )}
            </MotionCard>
          )
        }
        return (
          <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            padding="2xl" className="text-center">
            <FileText size={40} className="text-border mx-auto mb-3" />
            <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum biomarcador encontrado</p>
            <p className="font-body text-xs text-mauve">
              {exam?.status === 'error'
                ? `Última extração falhou (${exam.error_reason ?? 'erro desconhecido'}). Clique em "Extrair dados" para tentar novamente.`
                : 'Clique em "Extrair dados" para extrair os biomarcadores deste exame.'}
            </p>
          </MotionCard>
        )
      })()}

      {/* Modal — Reportar problema */}
      {reportOpen && (
        <div ref={reportRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Reportar problema"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 outline-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setReportOpen(false); setReportSent(false) }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            className="relative z-10 bg-white rounded-3xl shadow-2xl border border-border w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                  <Flag size={15} className="text-red-400" />
                </div>
                <p className="font-body text-sm font-semibold text-onyx">Reportar problema</p>
              </div>
              <button onClick={() => { setReportOpen(false); setReportSent(false) }} className="text-mauve hover:text-onyx transition-colors">
                <X size={16} />
              </button>
            </div>
            {reportSent ? (
              <div className="px-6 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center mx-auto mb-3">
                  <Check size={20} className="text-petal" />
                </div>
                <p className="font-body text-sm font-semibold text-onyx mb-1">Obrigada pelo relato!</p>
                <p className="font-body text-xs text-mauve">Vamos investigar e usar isso para melhorar a extração.</p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <p className="font-body text-xs text-mauve leading-relaxed">
                  Encontrou um valor incorreto, biomarcador ausente ou outro problema neste exame?
                  Descreva abaixo — isso nos ajuda a melhorar a qualidade da IA.
                </p>
                <textarea
                  autoFocus
                  aria-label="Descrição do problema"
                  value={reportText}
                  onChange={e => setReportText(e.target.value)}
                  rows={4}
                  placeholder="Ex: O valor da glicose está diferente do laudo. No laudo aparece 92 mg/dL, aqui apareceu 29 mg/dL."
                  className="w-full px-3 py-2.5 border border-border rounded-xl font-body text-sm text-onyx placeholder:text-mauve/40 resize-none focus:outline-none focus:ring-1 focus:ring-petal/40 transition-colors"
                />
                <div className="flex gap-2">
                  <button onClick={() => setReportOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-mauve text-sm font-body hover:border-petal/40 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={submitReport} disabled={!reportText.trim() || reportLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-body font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {reportLoading ? 'Enviando…' : 'Enviar relato'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* FeedbackModal P2 — aparece após 1ª análise no Beta */}
      <FeedbackModal />

      {/* AgendarModal — salva na Agenda (caminho único); "Repetir exame" cria evento de exame */}
      <AgendarModal
        open={agendarOpen}
        onClose={() => setAgendarOpen(false)}
        onSave={async (input: AgendaEventInput) => {
          if (!user) return
          await saveEvent(user.id, input, null)
          setAgendarOpen(false)
        }}
        onGoToHistory={() => router.push('/dashboard/timeline')}
        defaultTitle={exam?.type ? `Repetir ${exam.type}` : ''}
        defaultNotes={`Referente ao exame: ${exam?.type ?? ''}`}
        initialEvent={{ eventType: 'exame' }}
      />

      {/* Excluir exame — ação destrutiva */}
      {exam && (
        <div className="pt-2 print:hidden">
          <button onClick={deleteExam} disabled={deleting}
            className="inline-flex items-center gap-2 text-sm font-body text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? 'Excluindo…' : 'Excluir exame'}
          </button>
          <p className="font-body text-[11px] text-mauve mt-1">
            Remove o exame, seus biomarcadores e insights. O seu Histórico é recalculado.
          </p>
        </div>
      )}
    </div>
  )
}
