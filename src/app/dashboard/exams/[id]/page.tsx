'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, FileText, Loader2, RefreshCw, Zap,
  TrendingUp, TrendingDown, Minus, AlertCircle,
  Download, Printer, ChevronDown, CalendarDays,
  Pencil, Check, X, Flag, Trash2,
  ShieldCheck, Receipt,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { parseDateOnly, formatDateLongBR as formatDate } from '@/lib/agenda'
import { fmtNum, formatRef } from '@/lib/ui/number'
import { useModalA11y } from '@/lib/ui/useModalA11y'
import { useUser } from '@/context/UserContext'
import { compareNames } from '@/lib/exams/nameMatch'
import { loadCatalogLabels, buildCatalogLabels, type CatalogLabels } from '@/lib/biomarkers/catalogLabels'
import { canonicalMaterial, materialRank } from '@/lib/biomarkers/canonicalLabels'
import { normalizeName } from '@/lib/biomarkers/grouping'
import { deriveExamIdentity } from '@/lib/exams/identification'
import { isOrderDocumentType } from '@/lib/exams/classification'
import { careStageFor } from '@/lib/exams/careFlow'
import { eventServicesFor, isFinancial, type HealthEvent } from '@/lib/agenda'
import { expenseDocLabel, EXPENSE_DOC_TYPES } from '@/lib/finance/expense'
import { parseAmountToCents, centsToAmount } from '@/lib/agenda/money'
import { clinicalResultsToUcda, type ClinicalResultRow, type UcdaRepresentation } from '@/lib/capture/ucda'
import CareFlowStepper from '@/components/CareFlowStepper'
import ClinicalResultsCard from '@/components/ClinicalResultsCard'
import Link from 'next/link'
import FeedbackModal from '@/components/FeedbackModal'
import AgendarModal, { type AgendaEventInput } from '@/components/AgendarModal'
import { useEventForm } from '@/components/eventForm'
import MotionCard from '@/components/ui/MotionCard'
import ConfirmDialog from '@/components/ConfirmDialog'
import { DsThemeProvider, LaboratoryTable, Card as DsCard, Text as DsText, Numeric as DsNumeric, Banner as DsBanner, useDs } from '@/lib/ui/ds'
import type { LabRow, LabMaterialGroup } from '@/lib/ui/ds/domain'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Exam {
  id: string
  type: string | null
  status: string
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
  acima_da_referencia:         { label: 'Acima da referência informada no documento',  color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', Icon: TrendingUp   },
  abaixo_da_referencia:        { label: 'Abaixo da referência informada no documento', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     Icon: TrendingDown },
  dentro_da_referencia:        { label: 'Dentro da referência informada no documento', color: 'text-petal',       bg: 'bg-blush border-petal/30',   Icon: Minus        },
  // Resultado presente; o documento apenas não trouxe uma faixa de referência para comparar.
  // Neutro (não é um alerta): nem todo exame tem faixa de referência, e nem todo documento é de laboratório.
  sem_referencia_identificada: { label: 'Sem faixa de referência para comparação neste documento', color: 'text-mauve', bg: 'bg-ivory border-border', Icon: null },
  // Resultado PRESENTE e qualitativo (Negativo, Ausentes, Turvo…) — nunca "ausente".
  qualitative:                 { label: 'Resultado descritivo (em palavras, sem faixa numérica para comparar)', color: 'text-mauve', bg: 'bg-ivory border-border', Icon: null },
  // Resultado realmente não trazido pelo documento.
  missing:                     { label: 'Este resultado não foi informado no documento', color: 'text-mauve', bg: 'bg-ivory border-border', Icon: null },
  extraction_failed:           { label: 'Não foi possível ler este item do documento', color: 'text-red-500', bg: 'bg-red-50 border-red-200', Icon: AlertCircle },
  // Fallback neutro (numérico sem interpretação) — NÃO diz "ausente".
  indisponivel:                { label: 'Sem interpretação numérica disponível', color: 'text-mauve', bg: 'bg-ivory border-border', Icon: null },
}

// Origem dos resultados em linguagem humana (evita expor o código técnico "ai_extracted" ao usuário).
const SOURCE_LABEL: Record<string, string> = {
  ai_extracted: 'estruturados automaticamente a partir do documento',
  laudo:        'informados no documento',
  manual:       'inseridos manualmente',
  catalog:      'estruturados a partir do documento',
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
  const t = useDs()
  const [tip, setTip] = useState(false)
  // Tom factual por faixa (proporção): alto → identidade; médio → atenção; baixo → erro suave.
  const tone = index.pct >= 80 ? t.color.identity.primary : index.pct >= 60 ? t.color.badge.attention.text : t.color.badge.error.text
  return (
    <DsCard>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <DsText role="label" tone="muted" style={{ textTransform: 'uppercase' }}>Proporção dentro da referência</DsText>
          <div style={{ marginTop: 2 }}><DsNumeric level="large" color={tone}>{index.pct}%</DsNumeric></div>
          <DsText role="caption" tone="muted" block style={{ marginTop: 2 }}>{index.numerator} de {index.denominator} biomarcadores dentro da referência</DsText>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setTip(v => !v)} aria-label="O que é este índice?"
            style={{ width: 24, height: 24, borderRadius: 999, border: `1px solid ${t.color.border.default}`, background: t.color.surface.base, color: t.color.text.muted, cursor: 'pointer', fontWeight: 700 }}>?</button>
          {tip && (
            <div style={{ position: 'absolute', right: 0, top: 32, zIndex: 20, width: 288, background: t.color.surface.base, borderRadius: 16, boxShadow: '0 8px 28px rgba(0,0,0,.16)', border: `1px solid ${t.color.border.default}`, padding: 16 }}>
              <DsText role="bodySmall" block style={{ fontWeight: 600, marginBottom: 8 }}>O que é a Proporção dentro da referência?</DsText>
              <DsText role="caption" tone="muted" block style={{ marginBottom: 8 }}>
                É uma contagem simples: de todos os biomarcadores numéricos com referência impressa neste laudo, quantos estão dentro da faixa informada pelo laboratório.
              </DsText>
              <DsText role="caption" tone="muted" block style={{ marginBottom: 8 }}>
                <strong>Importante:</strong> cada laboratório usa referências próprias. Um mesmo valor pode estar “dentro” em um laudo e “fora” em outro.
              </DsText>
              <DsText role="caption" block style={{ color: t.color.badge.attention.text, background: t.color.badge.attention.soft, borderRadius: 12, padding: '8px 12px' }}>
                Esta métrica não representa diagnóstico, risco ou estado geral de saúde. Não substitui avaliação médica.
              </DsText>
              <button onClick={() => setTip(false)} style={{ marginTop: 8, width: '100%', textAlign: 'center', background: 'none', border: 'none', color: t.color.text.muted, cursor: 'pointer', font: 'inherit' }}>Fechar</button>
            </div>
          )}
        </div>
      </div>
      <DsText role="caption" tone="muted" block style={{ marginTop: 12 }}>
        Métrica informativa baseada apenas na proporção de resultados numéricos dentro das referências impressas neste laudo.
        Não representa diagnóstico, risco ou estado geral de saúde. Não substitui avaliação médica.
      </DsText>
    </DsCard>
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


// ── Agrupamento por material (specimen) e painel (categoria) ───────────────────
// Deixa claro de QUAL exame cada biomarcador veio (sangue x urina) e mantém as
// variáveis de um mesmo painel juntas, em vez de uma lista solta. Só apresentação:
// rótulos legíveis para os códigos que já existem em biomarker_catalog.

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

// Mapeamento FIEL biomarcador → linha da LaboratoryTable (DS-002). Preserva a interpretação já calculada
// (não recomputa), os tipos de resultado, a referência do laudo e o link para a Evolução. A copy (rótulo
// descritivo, unidade) continua vindo daqui — o DS só dá o tratamento visual.
const INTERP_TO_STATUS: Record<string, 'within' | 'below' | 'above' | 'unknown'> = {
  acima_da_referencia: 'above', abaixo_da_referencia: 'below', dentro_da_referencia: 'within',
}
function biomarkerKind(b: Biomarker): 'numeric' | 'qualitative' | 'missing' | 'failed' {
  return b.result_type === 'qualitative' ? 'qualitative'
    : b.result_type === 'missing' ? 'missing'
    : b.result_type === 'extraction_failed' ? 'failed' : 'numeric'
}
function toLabGroups(bms: Biomarker[], labels: CatalogLabels): LabMaterialGroup[] {
  return groupByExam(bms, labels).map(mat => ({
    material: mat.label,
    exams: mat.exams.map(ex => ({
      label: ex.label,
      rows: ex.items.map((b): LabRow => {
        const dv = displayValue(b)
        const cfg = getInterpConfig(b)
        const hasRange = b.reference_source !== 'ausente' && (b.reference_min !== null || b.reference_max !== null)
        return {
          name: b.name,
          value: dv.main ?? '',
          unit: dv.unit ?? undefined,
          kind: biomarkerKind(b),
          status: INTERP_TO_STATUS[b.interpretation ?? ''] ?? 'unknown',
          statusText: cfg.label,
          refText: hasRange ? `${formatRef(b.reference_min, b.reference_max)}${b.unit ? ` ${b.unit}` : ''}` : undefined,
          href: b.result_type === 'numeric' ? `/dashboard/saude/${encodeURIComponent(normalizeName(b.name))}` : undefined,
        }
      }),
    })),
  }))
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
  // EXA-C3 (NC-0009): resultados clínicos não-laboratoriais (CPE) na representação canônica UCDA.
  const [clinicalRep, setClinicalRep] = useState<UcdaRepresentation | null>(null)
  const [labels, setLabels]         = useState<CatalogLabels>(() => buildCatalogLabels([], []))
  const [lastLog, setLastLog]     = useState<LastLog | null>(null)
  const [loading, setLoading]     = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [analyzeNotice, setAnalyzeNotice] = useState<string | null>(null)
  const [exportOpen, setExportOpen]     = useState(false)
  const [agendarOpen, setAgendarOpen]   = useState(false)
  // E7/E8 reutilizam o Evento Assistencial (health_events): 'repeat' = agendar/lembrete
  // (recorrência); 'expense' = registrar valor pago + NF/recibo do exame realizado (→ Despesas).
  const [agendarMode, setAgendarMode]   = useState<'repeat' | 'expense'>('repeat')

  // ── Fluxo assistencial (EXA-C2 / NC-0011) — eventos assistenciais vinculados a este exame ──
  const [linkedEvents, setLinkedEvents] = useState<HealthEvent[]>([])
  // Q1 — pedidos disponíveis para vincular como ORIGEM deste resultado + estado da ação.
  type OrderLite = { id: string; type: string | null; document_type: string | null; created_at: string; exam_date: string | null; requesting_physician: string | null; order_status: string | null }
  const [orders, setOrders] = useState<OrderLite[]>([])
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkPickerOpen, setLinkPickerOpen] = useState(false)

  // Etapa atual do fluxo (Pedido→Agendamento→Realização→Resultado), resolvida no domínio.
  const careStage = useMemo(() => {
    if (!exam) return null
    const isOrder = isOrderDocumentType((exam as unknown as { document_type?: string | null }).document_type)
    return careStageFor({ hasResult: biomarkers.length > 0, isOrder, linkedEventStatuses: linkedEvents.map(e => e.status) })
  }, [exam, biomarkers.length, linkedEvents])

  // Q1 — este documento é um PEDIDO? Só RESULTADOS podem apontar para uma origem (pedido).
  const isOrderDoc = isOrderDocumentType((exam as unknown as { document_type?: string | null })?.document_type)
  const fulfillsOrderId = (exam as unknown as { fulfills_order_id?: string | null })?.fulfills_order_id ?? null
  const linkedOrder = useMemo(() => orders.find(o => o.id === fulfillsOrderId) ?? null, [orders, fulfillsOrderId])

  // BETA-3: despesa vinculada ao exame (valor pago + documento fiscal) — fecha o loop no próprio exame.
  const linkedExpense = useMemo(() => linkedEvents.find(isFinancial) ?? null, [linkedEvents])

  // FB-008 (refina FIN-001): o financeiro é ATRIBUTO do próprio exame, não um Evento separado.
  const examExpense = useMemo(() => {
    const e = exam as unknown as { expense_amount_cents?: number | null; expense_doc_type?: string | null; expense_doc_url?: string | null } | null
    if (!e) return null
    return { amountCents: e.expense_amount_cents ?? null, docType: e.expense_doc_type ?? null, docUrl: e.expense_doc_url ?? null }
  }, [exam])
  const [expEditing, setExpEditing] = useState(false)
  const [expAmount, setExpAmount]   = useState('')
  const [expDocType, setExpDocType] = useState('')
  const [expDocFile, setExpDocFile] = useState<File | null>(null)
  const [expSaving, setExpSaving]   = useState(false)

  function startEditExpense() {
    setExpAmount(examExpense?.amountCents ? centsToAmount(examExpense.amountCents) : '')
    setExpDocType(examExpense?.docType ?? '')
    setExpDocFile(null)
    setExpEditing(true)
  }
  async function saveExamExpense() {
    if (!exam || expSaving) return
    setExpSaving(true)
    try {
      let docUrl = examExpense?.docUrl ?? null
      if (expDocFile) {
        const ext = expDocFile.name.split('.').pop() ?? 'bin'
        const path = `${user?.id}/exam-fiscal/${exam.id}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('exams').upload(path, expDocFile, { contentType: expDocFile.type, upsert: false })
        if (!upErr) { const { data } = await supabase.storage.from('exams').createSignedUrl(path, 60 * 60 * 24 * 365); docUrl = data?.signedUrl ?? docUrl }
      }
      const cents = parseAmountToCents(expAmount)
      await supabase.from('exams').update({ expense_amount_cents: cents, expense_doc_type: expDocType || null, expense_doc_url: docUrl } as never).eq('id', exam.id)
      setExam(prev => prev ? ({ ...prev, expense_amount_cents: cents, expense_doc_type: expDocType || null, expense_doc_url: docUrl } as never) : prev)
      setExpEditing(false); setExpDocFile(null)
    } finally { setExpSaving(false) }
  }

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

  // ── Q1 — vínculo do RESULTADO à sua ORIGEM (pedido). O pedido permanece como registro histórico;
  // o vínculo estabelece a rastreabilidade e faz o pedido constar como 'finalizado' (derivado). 1→N.
  async function linkToOrder(orderId: string) {
    if (!exam || linkBusy) return
    setLinkBusy(true)
    try {
      await supabase.from('exams').update({ fulfills_order_id: orderId } as never).eq('id', exam.id)
      setExam(prev => prev ? ({ ...prev, fulfills_order_id: orderId } as never) : prev)
      setLinkPickerOpen(false)
    } finally { setLinkBusy(false) }
  }
  async function unlinkOrder() {
    if (!exam || linkBusy) return
    setLinkBusy(true)
    try {
      await supabase.from('exams').update({ fulfills_order_id: null } as never).eq('id', exam.id)
      setExam(prev => prev ? ({ ...prev, fulfills_order_id: null } as never) : prev)
    } finally { setLinkBusy(false) }
  }

  function cancelEditName() {
    setEditingName(false)
    setNameValue('')
  }

  // ── Excluir exame ───────────────────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)
  function deleteExam() {
    if (!exam || deleting) return
    setDeleteError(null)
    setConfirm({
      message:
        `Excluir "${exam.type ?? 'Exame'}"?\n\nIsto remove o exame, seus resultados e insights, e o arquivo enviado. ` +
        `O seu Histórico será recalculado sem este exame. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      onYes: async () => {
        setDeleting(true)
        try {
          const res = await fetch(`/api/exams/${exam.id}`, { method: 'DELETE' })
          if (res.ok) router.push('/dashboard/exams')
          else { setDeleting(false); setDeleteError('Falha ao excluir o exame. Tente novamente.') }
        } catch {
          setDeleting(false); setDeleteError('Falha ao excluir o exame. Tente novamente.')
        }
      },
    })
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

  // Eventos assistenciais vinculados a este exame → status para o fluxo (agendado ≠ realizado).
  // Contrato público do módulo de Jornada (nunca consulta health_events direto).
  useEffect(() => {
    if (!user?.id) return
    let alive = true
    eventServicesFor(supabase).query.listByExam(user.id, examId)
      .then(evs => { if (alive) setLinkedEvents(evs) })
      .catch(() => { if (alive) setLinkedEvents([]) })
    return () => { alive = false }
  }, [user?.id, examId, supabase])

  async function loadData(silent = false) {
    if (!silent) setLoading(true)
    const [{ data: examData }, { data: bioData }, { data: logData }, { data: catData }, { data: clinData }, { data: ordersData }] = await Promise.all([
      supabase.from('exams').select('id,type,document_type,status,page_count,created_at,exam_date,error_reason,text_truncated,file_url,patient_name,extraction_completeness,issuer,requesting_physician,expense_amount_cents,expense_doc_type,expense_doc_url,fulfills_order_id')
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
      // Resultados clínicos não-laboratoriais (CPE) — lidos SEMPRE como UCDA (contrato), nunca modalidade-específicos.
      supabase.from('clinical_results')
        .select('clinical_model,result_kind,item_type,name,value_text,value_num,unit,code,code_system,value_code,region,anatomy,specimen,method,context,group_label,reference_text,page,raw_text')
        .eq('exam_id', examId),
      // Q1 — pedidos do usuário, para vincular este resultado à sua ORIGEM (RLS já limita ao usuário).
      supabase.from('exams').select('id,type,document_type,created_at,exam_date,requesting_physician,order_status')
        .order('created_at', { ascending: false }),
    ])
    setLabels(await loadCatalogLabels(supabase))
    if (examData) setExam(examData as Exam)
    // Só PEDIDOS (medical_order/insurance_guide), exceto o próprio doc — candidatos a origem deste resultado.
    if (ordersData) setOrders((ordersData as OrderLite[]).filter(o => isOrderDocumentType(o.document_type) && o.id !== examId))
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
    // clinical_results → UCDA (contrato). Só há representação quando o CPE gravou itens (ex.: Pentacam).
    setClinicalRep(clinicalResultsToUcda((clinData ?? []) as ClinicalResultRow[]))
    if (!silent) setLoading(false)
  }

  async function handleAnalyze() {
    if (analyzing) return
    setAnalyzing(true)
    setAnalyzeError(null)
    setAnalyzeNotice(null)
    try {
      const res  = await fetch(`/api/exams/${examId}/analyze`, { method: 'POST' })
      const data = await res.json() as { error?: string; code?: string; certified?: boolean; notice?: string }
      // 409 ALREADY_PROCESSING (ex.: outra aba já iniciou) não é erro — reflete o estado real
      if (res.status === 409) { await loadData(true); return }
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      // Representação já certificada: reextração não altera nada. Aviso neutro; NÃO conta como
      // nova análise (não incrementa contagem nem dispara o evento de sucesso).
      if (data.certified) { setAnalyzeNotice(data.notice ?? 'Este exame já está certificado; os resultados não mudam ao extrair novamente.'); await loadData(true); return }
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
  const hasClinical  = (clinicalRep?.items.length ?? 0) > 0   // resultados clínicos não-laboratoriais (CPE)
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
        A SINTERA organiza e exibe dados de documentos de saúde. Não oferece diagnóstico, interpretação clínica ou recomendações médicas.
        Os dados exibidos são reprodução estruturada do documento original. Sempre consulte seu médico.
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

      {/* Fluxo assistencial (EXA-C2) — Pedido → Agendamento → Realização → Resultado */}
      <div className="print:hidden">
        <CareFlowStepper stage={careStage} />
      </div>

      {/* Q1 — Pedido de ORIGEM (só para RESULTADOS). O pedido permanece como registro histórico; aqui só a
          rastreabilidade origem↔resultado (quem solicitou, quando). Vincular marca o pedido como finalizado. */}
      {!isOrderDoc && (
        <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} padding="relaxed" className="print:hidden">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={15} className="text-gold" />
            <h2 className="font-display text-base font-semibold text-onyx">Pedido de origem</h2>
          </div>
          {linkedOrder ? (
            <div className="flex items-start justify-between gap-3">
              <div className="font-body text-sm text-onyx">
                <p className="font-medium">{linkedOrder.type ?? 'Pedido médico'}</p>
                <p className="text-xs text-mauve mt-0.5">
                  {linkedOrder.requesting_physician ? <>Solicitado por {linkedOrder.requesting_physician} · </> : null}
                  {formatDate(linkedOrder.exam_date ?? linkedOrder.created_at)}
                </p>
              </div>
              <button type="button" onClick={unlinkOrder} disabled={linkBusy}
                className="flex-shrink-0 text-[11px] font-body text-mauve border border-border px-2.5 py-1 rounded-full hover:bg-blush transition-colors disabled:opacity-50">
                Desvincular
              </button>
            </div>
          ) : orders.length === 0 ? (
            <p className="font-body text-xs text-mauve">Nenhum pedido cadastrado. Adicione o pedido em <Link href="/dashboard/exams" className="text-petal hover:underline">Exames › Pedidos de Exames</Link> para registrar a origem deste resultado.</p>
          ) : linkPickerOpen ? (
            <div className="flex flex-wrap items-center gap-2">
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <select autoFocus aria-label="Pedido de origem" onChange={e => { if (e.target.value) linkToOrder(e.target.value) }} disabled={linkBusy}
                className="flex-1 min-w-[220px] px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="">Selecione o pedido de origem…</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {(o.type ?? 'Pedido médico')}{o.requesting_physician ? ` — ${o.requesting_physician}` : ''} · {formatDate(o.exam_date ?? o.created_at)}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => setLinkPickerOpen(false)} className="text-[11px] font-body text-mauve px-2 py-1">Cancelar</button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="font-body text-xs text-mauve">Vincule este resultado ao pedido que o originou — preserva a rastreabilidade (quem solicitou, quando) e marca o pedido como concluído.</p>
              <button type="button" onClick={() => setLinkPickerOpen(true)}
                className="flex-shrink-0 flex items-center gap-1 text-[11px] font-body font-medium text-petal-dark bg-blush border border-petal/30 px-2.5 py-1 rounded-full hover:bg-petal/10 transition-colors">
                Vincular a um pedido
              </button>
            </div>
          )}
        </MotionCard>
      )}

      {/* FB-001: Financeiro do exame — seção proeminente (valor pago · documento fiscal · recorrência) */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} padding="relaxed" className="print:hidden">
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={16} className="text-petal" />
          <h2 className="font-display text-base font-semibold text-onyx">Financeiro e acompanhamento</h2>
        </div>
        {/* FB-008: o financeiro é ATRIBUTO do próprio exame (não cria Evento). Edita as colunas do exame. */}
        {expEditing ? (
          <div className="rounded-xl border border-petal/30 bg-blush/20 px-4 py-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><label htmlFor="exp-valor" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Valor pago — R$</label>
                <input id="exp-valor" type="text" inputMode="decimal" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="250,00"
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx focus:outline-none focus:ring-1 focus:ring-petal/40" /></div>
              <div className="space-y-1"><label htmlFor="exp-tipo" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Tipo de documento</label>
                <select id="exp-tipo" value={expDocType} onChange={e => setExpDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/40">
                  <option value="">—</option>
                  {EXPENSE_DOC_TYPES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select></div>
            </div>
            <div className="space-y-1"><label htmlFor="exp-anexo" className="font-body text-xs font-semibold text-onyx/60 uppercase tracking-wider">Anexo (NF/recibo/comprovante) <span className="font-normal text-mauve normal-case">(PDF, JPG, PNG)</span></label>
              <input id="exp-anexo" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setExpDocFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs font-body text-mauve file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-blush file:text-petal file:font-medium" />
              {examExpense?.docUrl && !expDocFile && <p className="font-body text-[11px] text-mauve">Documento atual mantido. Escolha um arquivo para substituir.</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setExpEditing(false)} disabled={expSaving} className="px-3 py-1.5 rounded-full border border-border text-mauve font-body text-xs hover:bg-blush disabled:opacity-40">Cancelar</button>
              <button onClick={saveExamExpense} disabled={expSaving} className="px-3 py-1.5 rounded-full gradient-sintera text-white font-body text-xs font-medium hover:opacity-90 disabled:opacity-40">{expSaving ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </div>
        ) : (examExpense && (examExpense.amountCents ?? 0) > 0) ? (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-blush/30 border border-petal/30 px-4 py-3">
            <div className="min-w-0">
              <p className="font-body text-[11px] text-mauve uppercase tracking-wide">Valor pago</p>
              <p className="font-body text-xl font-semibold text-onyx leading-tight">
                {((examExpense.amountCents ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="font-body text-[11px] text-mauve mt-0.5">
                Aparece em <button onClick={() => router.push('/dashboard/gastos')} className="text-petal hover:underline">Despesas</button>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {examExpense.docUrl && (
                <a href={examExpense.docUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-body text-[11px] text-petal hover:underline">
                  {expenseDocLabel(examExpense.docType) ?? 'Documento'} →
                </a>
              )}
              <button onClick={startEditExpense} className="font-body text-[11px] text-mauve hover:text-petal transition-colors">Editar</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-3">
            <p className="font-body text-sm text-mauve min-w-0">
              Registre o <strong className="text-onyx/70">valor pago</strong> e anexe a
              <strong className="text-onyx/70"> nota fiscal, recibo ou comprovante</strong> — fica no próprio exame e aparece em Despesas e Relatórios.
            </p>
            <button onClick={startEditExpense}
              className="flex-shrink-0 inline-flex items-center gap-1.5 gradient-sintera text-white font-body text-sm font-medium px-3 py-2 rounded-full hover:opacity-90 transition-opacity">
              <Receipt size={14} /> Registrar valor / NF
            </button>
          </div>
        )}
        {/* Recorrência / repetição do exame */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50">
          <p className="font-body text-xs text-mauve">Precisa repetir este exame periodicamente?</p>
          <button onClick={() => { setAgendarMode('repeat'); setAgendarOpen(true) }}
            className="flex-shrink-0 inline-flex items-center gap-1.5 border border-border text-mauve font-body text-xs font-medium px-3 py-1.5 rounded-full hover:border-petal/40 hover:text-petal transition-colors">
            <CalendarDays size={13} /> Criar lembrete de repetição
          </button>
        </div>
      </MotionCard>

      {/* Cabeçalho do exame */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        padding="none" className="p-6">
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
                    {deriveExamIdentity(exam?.type, (exam as unknown as { issuer?: string | null })?.issuer).name}
                  </h1>
                  <button onClick={startEditName}
                    className="opacity-0 group-hover/name:opacity-100 transition-opacity text-mauve hover:text-petal flex-shrink-0 print:hidden">
                    <Pencil size={13} />
                  </button>
                </div>
              )}
              {/* Identificação padronizada (fundadora): laboratório/clínica + médico solicitante.
                  O assinante do laudo NÃO aparece aqui (está no documento original). */}
              {(() => {
                const { lab } = deriveExamIdentity(exam?.type, (exam as unknown as { issuer?: string | null })?.issuer)
                const req = (exam as unknown as { requesting_physician?: string | null })?.requesting_physician
                if (!lab && !req) return null
                return (
                  <div className="mt-0.5 space-y-0.5">
                    {lab && <p className="font-body text-sm font-medium text-onyx/70">{lab}</p>}
                    {req && <p className="font-body text-xs text-mauve">Solicitante: {req}</p>}
                  </div>
                )
              })()}
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
                    {counts.total} {counts.total === 1 ? 'resultado' : 'resultados'}
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

            {/* Lembrete + valor/NF agora vivem na seção "Financeiro e acompanhamento" (FB-001) — sem duplicar aqui */}

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

        {/* Avisos — Banner (DS-002). Copy preservada; tom semântico. */}
        {exam?.text_truncated && (
          <div className="mt-4">
            <DsBanner tone="attention" icon={<AlertCircle size={14} />} title="Documento parcialmente processado">
              Este documento é muito extenso e foi processado parcialmente. Alguns resultados podem não ter sido extraídos.
              Extraia os dados novamente ou confira o documento original para garantir que todos os dados estão presentes.
            </DsBanner>
          </div>
        )}
        {analyzeError && (
          <div className="mt-4"><DsBanner tone="error" icon={<AlertCircle size={14} />}>{analyzeError}</DsBanner></div>
        )}
        {/* Representação já certificada — aviso NEUTRO (não é erro): reextrair não altera os dados. */}
        {analyzeNotice && (
          <div className="mt-4"><DsBanner tone="neutral" icon={<ShieldCheck size={14} />}>{analyzeNotice}</DsBanner></div>
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
            <h2 className="font-display text-base font-semibold text-onyx">Resultados estruturados</h2>
          </div>

          {/* Resultados — LaboratoryTable (DS-002): leitura densa agrupada por material→exame, com tipos de
              resultado, status descritivo (copy da tela) e nome numérico linkado à Evolução. Fiel ao laudo. */}
          <DsThemeProvider mode="light">
            <div className="px-5 py-4 overflow-x-auto">
              <LaboratoryTable
                descriptive
                groups={toLabGroups(biomarkers, labels)}
                renderLink={({ href, style, children }) => <Link href={href} style={style}>{children}</Link>}
              />
            </div>
          </DsThemeProvider>

          {/* Rodapé com contagem — E5 homologação. "Resultados" engloba qualquer tipo de exame
              (nem todo resultado é biomarcador). A origem é descrita em linguagem humana, não técnica. */}
          <div className="px-5 py-3 bg-ivory border-t border-border/50">
            <p className="font-body text-xs text-mauve">
              {counts.total} {counts.total === 1 ? 'resultado estruturado' : 'resultados estruturados'} · {SOURCE_LABEL[biomarkers[0]?.source ?? ''] ?? 'estruturados a partir do documento'}
            </p>
          </div>

          {/* Nota sobre a fonte da referência (regulatória). Sem pressupor "laboratório": o documento
              pode vir de laboratório, clínica, profissional de saúde ou outra origem; e a referência,
              quando existe, varia por origem/equipamento/método/referência científica. */}
          <div className="px-5 py-3 border-t border-border/50 bg-ivory/60">
            <p className="font-body text-[11px] text-mauve leading-relaxed">
              As faixas de referência, <strong className="text-onyx/70">quando disponíveis</strong>, são as informadas
              no <strong className="text-onyx/70">documento de origem</strong> (laboratório, clínica, profissional de saúde
              ou outra origem) e podem variar conforme a <strong className="text-onyx/70">origem, o equipamento, o método
              e a referência científica</strong> adotados. A referência adequada ao seu caso <strong className="text-onyx/70">também
              depende de avaliação médica</strong> — esta informação organiza seus dados e não substitui a consulta com seu médico.
            </p>
          </div>
        </MotionCard>
      ) : hasClinical ? null : (analyzing || exam?.status === 'processing' || exam?.status === 'pending') ? (
        /* P3 — Estado de processamento (auto-análise em andamento; 'pending' evita flash do estado vazio) */
        <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          padding="none" className="p-10 text-center">
          <Loader2 size={40} className="text-petal mx-auto mb-3 animate-spin" />
          <p className="font-body text-sm font-semibold text-onyx mb-1">Analisando seu exame…</p>
          <p className="font-body text-xs text-mauve">A SINTERA está estruturando os resultados do seu documento. Isso leva alguns segundos.</p>
        </MotionCard>
      ) : (() => {
        // A UI reage à COMPLETUDE (não ao tipo do exame): document_only = nada estruturado
        // com segurança → o documento original é a fonte. (extraction_completeness, do CEF.)
        const completeness = (exam as unknown as { extraction_completeness?: string | null })?.extraction_completeness ?? null
        const fileUrl = (exam as unknown as { file_url?: string | null })?.file_url ?? null
        if (completeness === 'document_only' && exam?.status !== 'error') {
          return (
            <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              padding="none" className="p-10 text-center">
              <FileText size={40} className="text-petal/70 mx-auto mb-3" />
              <p className="font-body text-sm font-semibold text-onyx mb-1">Documento disponível para consulta</p>
              <p className="font-body text-xs text-mauve max-w-md mx-auto">
                O conteúdo deste exame está no documento original. A estruturação por tipo de exame está em evolução.
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
            padding="none" className="p-10 text-center">
            <FileText size={40} className="text-border mx-auto mb-3" />
            <p className="font-body text-sm font-semibold text-onyx mb-1">Nenhum resultado estruturado</p>
            <p className="font-body text-xs text-mauve">
              {exam?.status === 'error'
                ? `Última extração falhou (${exam.error_reason ?? 'erro desconhecido'}). Clique em "Extrair dados" para tentar novamente.`
                : 'Clique em "Extrair dados" para estruturar os resultados deste exame.'}
            </p>
          </MotionCard>
        )
      })()}

      {/* Resultados clínicos não-laboratoriais (CPE) — EXA-C3 / NC-0009. Exibição genérica via UCDA. */}
      {hasClinical && clinicalRep && <ClinicalResultsCard rep={clinicalRep} />}

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

      {/* AgendarModal — Evento Assistencial único (health_events). E8 'repeat' = agendar/lembrete
          (recorrência); E7 'expense' = valor pago + NF/recibo do exame realizado (→ Despesas). */}
      <AgendarModal
        open={agendarOpen}
        onClose={() => setAgendarOpen(false)}
        onSave={async (input: AgendaEventInput) => {
          if (!user) return
          // EVT-C6 (NC-0006): o evento nasce DESTE exame → grava o vínculo de origem (write-side do EventLink).
          // O "Relacionado" do evento e o listByExam passam a reconstruir a relação.
          await saveEvent(user.id, input, null, [{ type: 'exam', id: examId, relationship: 'generated_from' }])
          setAgendarOpen(false)
        }}
        onGoToHistory={() => router.push(agendarMode === 'expense' ? '/dashboard/gastos' : '/dashboard/timeline')}
        defaultTitle={agendarMode === 'expense' ? (exam?.type ?? 'Exame') : (exam?.type ? `Repetir ${exam.type}` : '')}
        defaultNotes={`Referente ao exame: ${exam?.type ?? ''}`}
        initialEvent={agendarMode === 'expense'
          ? { eventType: 'exame', status: 'realizado', date: (exam as unknown as { exam_date?: string | null })?.exam_date ?? undefined }
          : { eventType: 'exame' }}
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
            Remove o exame, seus resultados e insights. O seu Histórico é recalculado.
          </p>
          {deleteError && <p className="font-body text-xs text-red-500 mt-1.5" role="alert">{deleteError}</p>}
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        message={confirm?.message ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirmar'}
        onConfirm={() => { const c = confirm; setConfirm(null); c?.onYes() }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
