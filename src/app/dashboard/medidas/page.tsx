'use client'

// ============================================================
// Medidas corporais — série temporal autorrelatada
// ============================================================
// Peso, altura, circunferência e composição corporal (bioimpedância). Registro
// factual da própria pessoa para acompanhar no tempo e levar ao profissional.
// Sem juízo clínico. Sinais vitais (pressão, etc.) ficam em aba própria.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Activity, Trash2, Camera, ArrowLeft, Ruler, Target, TrendingDown, TrendingUp, Minus, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/context/UserContext'
import VoiceInput from '@/components/VoiceInput'
import Sparkline, { parseNum } from '@/components/Sparkline'
import { computeWeightJourney, type SeriesPoint } from '@/lib/body/weight-journey'
import { currentSummary, sourceQuality, RELIABILITY_LABEL, lastAssessment, type SummaryPoint } from '@/lib/body/summary'
import { EVOLUTION_PERIODS, filterByPeriod, markerFor, type EvoPoint } from '@/lib/body/evolution'
import EvolutionChart from '@/components/body/EvolutionChart'
import { buildSnapshots, compareSnapshots, type SnapPoint } from '@/lib/body/snapshots'
import { buildMilestones, MILESTONE_CATEGORIES, MILESTONE_COLOR, type MilestoneCategory, type MedInput, type ConsultaInput, type AssessmentInput } from '@/lib/body/milestones'
import { professionalKindLabel } from '@/lib/agenda'
import ListCard from '@/components/ListCard'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/EmptyState'
import { downscaleImageToPayload } from '@/lib/capture/downscaleImage'
import Card from '@/components/ui/Card'
import Section from '@/components/ui/Section'
import Disclaimer from '@/components/ui/Disclaimer'
import ProvenanceLine from '@/components/ui/ProvenanceLine'
import { examProvenance } from '@/lib/provenance'
import CreateRecordMenu from '@/components/ui/CreateRecordMenu'
import ConfirmDialog from '@/components/ConfirmDialog'

type Metric =
  | 'peso' | 'altura' | 'circunferencia_cintura'
  | 'imc' | 'gordura_corporal' | 'massa_muscular' | 'massa_magra' | 'agua_corporal' | 'gordura_visceral' | 'massa_ossea' | 'taxa_metabolica'
  | 'outro'

const METRIC_LABEL: Record<Metric, string> = {
  peso: 'Peso', altura: 'Altura', circunferencia_cintura: 'Circunferência (cintura)',
  imc: 'IMC', gordura_corporal: 'Gordura corporal', massa_muscular: 'Massa muscular', massa_magra: 'Massa magra',
  agua_corporal: 'Água corporal', gordura_visceral: 'Gordura visceral', massa_ossea: 'Massa óssea',
  taxa_metabolica: 'Taxa metabólica basal', outro: 'Outra medida',
}
const DEFAULT_UNIT: Record<Metric, string> = {
  peso: 'kg', altura: 'cm', circunferencia_cintura: 'cm',
  imc: 'kg/m²', gordura_corporal: '%', massa_muscular: 'kg', massa_magra: 'kg', agua_corporal: '%',
  gordura_visceral: 'nível', massa_ossea: 'kg', taxa_metabolica: 'kcal', outro: '',
}
const PLACEHOLDER: Record<Metric, string> = {
  peso: 'Ex.: 72,5', altura: 'Ex.: 165', circunferencia_cintura: 'Ex.: 84',
  imc: 'Ex.: 24,2', gordura_corporal: 'Ex.: 28', massa_muscular: 'Ex.: 24', massa_magra: 'Ex.: 54', agua_corporal: 'Ex.: 55',
  gordura_visceral: 'Ex.: 7', massa_ossea: 'Ex.: 2,8', taxa_metabolica: 'Ex.: 1450', outro: 'Valor',
}

interface Entry {
  id: string
  metric: Metric
  label: string | null
  valueText: string
  unit: string | null
  measuredOn: string
  notes: string | null
  examId: string | null
  source: string | null
}

// FB-003/BOD-001: a Composição Corporal é VISUALIZAÇÃO — cada ponto mostra a ORIGEM de onde nasceu.
const SOURCE_LABEL: Record<string, string> = {
  bioimpedancia: 'Bioimpedância', dexa: 'DEXA', balanca: 'Balança', wearable: 'Dispositivo',
  manual: 'Registro manual', outro: 'Outra origem',
}

// Exame (laudo) que a pessoa já enviou em Exames — usado para vincular a medida ao
// documento original (ex.: laudo de bioimpedância).
interface ExamRef { id: string; type: string; examDate: string | null; fileUrl: string | null }

function fmt(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Métricas extraídas de um laudo de bioimpedância (IMC é calculado à parte).
const BIO_METRICS: Metric[] = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica']

export default function MedidasPage() {
  const { user, profile, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<Entry[]>([])
  const [exams, setExams] = useState<ExamRef[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel: string; onYes: () => void } | null>(null)

  // FB-007 parte 2 — meta de peso (painel de acompanhamento GLP-1). Fato do usuário, salvo em profiles.
  const [goalKg, setGoalKg] = useState<number | null>(null)
  const [goalEditing, setGoalEditing] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [goalSaving, setGoalSaving] = useState(false)

  // BOD-001 área ② — Evolução Longitudinal (seletor de indicador · período · ponto selecionado).
  const [evoMetric, setEvoMetric] = useState<Metric>('peso')
  const [evoDays, setEvoDays] = useState<number | null>(90)
  const [evoPoint, setEvoPoint] = useState<EvoPoint | null>(null)

  // BOD-001 área ③ — Comparação entre Avaliações (snapshots A × B).
  const [snapAKey, setSnapAKey] = useState<string | null>(null)
  const [snapBKey, setSnapBKey] = useState<string | null>(null)

  // BOD-001 área ⑤ — Marcos (projeções de Medicamentos/Suplementos/Consultas; avaliações vêm dos snapshots).
  const [medRows, setMedRows] = useState<MedInput[]>([])
  const [consultaRows, setConsultaRows] = useState<ConsultaInput[]>([])
  const [msCats, setMsCats] = useState<Set<MilestoneCategory>>(new Set(MILESTONE_CATEGORIES.map(c => c.key)))

  const [showForm, setShowForm] = useState(false)
  const [metric, setMetric] = useState<Metric>('peso')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('kg')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [examId, setExamId] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Escanear laudo de bioimpedância
  const [scanning, setScanning] = useState(false)
  const [scanRows, setScanRows] = useState<{ metric: Metric; value: string; unit: string }[] | null>(null)
  const [scanDate, setScanDate] = useState('')
  const [scanExamId, setScanExamId] = useState('')
  const [scanErr, setScanErr] = useState<string | null>(null)
  const [savingScan, setSavingScan] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [{ data }, exRes, profRes, medRes, evRes] = await Promise.all([
      db.from('body_metrics')
        .select('id, metric, label, value_text, unit, measured_on, notes, exam_id, source')
        .eq('user_id', user.id).order('measured_on', { ascending: false }),
      db.from('exams').select('id, type, exam_date, file_url').eq('user_id', user.id).order('created_at', { ascending: false }),
      db.from('profiles').select('weight_goal_kg').eq('id', user.id).maybeSingle(),
      // BOD-001 ⑤ — fontes dos marcos (projeção; sem tabela própria).
      db.from('medications').select('id, name, kind, started_on, until_date, status').eq('user_id', user.id),
      db.from('health_events').select('id, event_type, event_date, professional_kind, title').eq('user_id', user.id).in('event_type', ['consulta', 'retorno']),
    ])
    const g = (profRes.data as { weight_goal_kg: number | null } | null)?.weight_goal_kg ?? null
    setGoalKg(g != null ? Number(g) : null)
    setItems(((data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string, metric: (m.metric as Metric) ?? 'outro', label: (m.label as string) ?? null,
      valueText: (m.value_text as string) ?? '', unit: (m.unit as string) ?? null,
      measuredOn: m.measured_on as string, notes: (m.notes as string) ?? null,
      examId: (m.exam_id as string) ?? null, source: (m.source as string) ?? null,
    })))
    setExams(((exRes.data ?? []) as Array<Record<string, unknown>>).map(e => ({
      id: e.id as string, type: (e.type as string) || 'Exame',
      examDate: (e.exam_date as string) ?? null, fileUrl: (e.file_url as string) ?? null,
    })))
    setMedRows(((medRes.data ?? []) as Array<Record<string, unknown>>).map(m => ({
      id: m.id as string, name: (m.name as string) ?? 'Medicamento', kind: (m.kind as string) ?? 'medicamento',
      startedOn: (m.started_on as string) ?? null, untilOn: (m.until_date as string) ?? null, status: (m.status as string) ?? 'em_uso',
    })))
    setConsultaRows(((evRes.data ?? []) as Array<Record<string, unknown>>).map(e => ({
      id: e.id as string, date: (e.event_date as string) ?? '', professionalKind: (e.professional_kind as string) ?? null,
      professionalLabel: e.professional_kind ? professionalKindLabel(e.professional_kind as string) : null, title: (e.title as string) ?? null,
    })))
    setLoading(false)
  }, [user, supabase])

  // Carrega na montagem (e após mutações); o setLoading(true) síncrono — o spinner —
  // é intencional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!authLoading) load() }, [authLoading, load])

  function chooseMetric(m: Metric) { setMetric(m); setUnit(DEFAULT_UNIT[m]) }
  function reset() { setMetric('peso'); setLabel(''); setValue(''); setUnit('kg'); setDate(''); setNotes(''); setExamId(''); setErr(null) }

  async function save() {
    if (!user || saving || !value.trim() || !date) return
    setSaving(true); setErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('body_metrics').insert({
      user_id: user.id, metric, label: metric === 'outro' ? (label.trim() || 'Medida') : null,
      value_text: value.trim(), unit: unit.trim() || null, measured_on: date, notes: notes.trim() || null,
      exam_id: examId || null,
    })
    setSaving(false)
    if (error) { setErr(error.message); return }
    reset(); setShowForm(false); await load()
  }

  function remove(id: string) {
    if (busyId) return
    setConfirm({ message: 'Remover esta medida?', confirmLabel: 'Remover', onYes: async () => {
      setBusyId(id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('body_metrics').delete().eq('id', id)
      await load(); setBusyId(null)
    } })
  }

  // FB-007 — define/atualiza a meta de peso (profiles.weight_goal_kg). Vazio = remove a meta.
  async function saveGoal() {
    if (!user || goalSaving) return
    setGoalSaving(true)
    const raw = goalInput.trim().replace(',', '.')
    const parsed = raw === '' ? null : Number(raw)
    const value = parsed != null && Number.isFinite(parsed) && parsed > 0 ? parsed : null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('profiles').update({ weight_goal_kg: value }).eq('id', user.id)
    setGoalKg(value); setGoalEditing(false); setGoalSaving(false)
  }

  // Escanear laudo de bioimpedância → pré-preenche várias medidas de uma vez.
  async function onScanFile(file: File) {
    if (!file.type.startsWith('image/')) { setScanErr('Envie uma imagem do laudo.'); return }
    if (file.size > 10 * 1024 * 1024) { setScanErr('Imagem muito grande (máx. 10 MB).'); return }
    setScanning(true); setScanErr(null); setScanRows(null); setShowForm(false)
    try {
      const { base64, mediaType } = await downscaleImageToPayload(file, 1300)
      const resp = await fetch('/api/vision/bioimpedance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const json = await resp.json()
      const r = json?.result as Record<string, string | null> | null
      if (!r) { setScanErr('Não consegui ler o laudo. Tente outra foto ou registre manualmente.'); setScanning(false); return }
      const rows = BIO_METRICS
        .filter(m => r[m])
        .map(m => ({ metric: m, value: String(r[m]), unit: DEFAULT_UNIT[m] }))
      if (rows.length === 0) { setScanErr('Não encontrei medidas no laudo. Tente outra foto ou registre manualmente.'); setScanning(false); return }
      setScanRows(rows)
      setScanDate(r.measured_on || new Date().toISOString().slice(0, 10))
    } catch (e) {
      setScanErr(e instanceof Error ? e.message : 'Falha ao processar a foto. Tente novamente ou registre manualmente.')
    } finally {
      setScanning(false)
    }
  }

  async function saveScan() {
    if (!user || !scanRows || !scanDate || savingScan) return
    const rows = scanRows.filter(r => r.value.trim())
    if (rows.length === 0) { setScanRows(null); return }
    setSavingScan(true); setScanErr(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('body_metrics').insert(
      rows.map(r => ({
        user_id: user.id, metric: r.metric, label: null,
        value_text: r.value.trim(), unit: r.unit || null, measured_on: scanDate,
        notes: 'Importado de laudo de bioimpedância', exam_id: scanExamId || null, source: 'bioimpedancia',
      })),
    )
    setSavingScan(false)
    if (error) { setScanErr(error.message); return }
    setScanRows(null); setScanExamId(''); await load()
  }

  // IMC calculado a partir do peso mais recente e da altura do perfil (factual).
  const alturaCm = (profile?.height_cm as number | null | undefined) ?? null
  const latestPeso = items.find(i => i.metric === 'peso')
  const pesoNum = latestPeso ? parseNum(latestPeso.valueText) : null
  const imcVal = pesoNum && alturaCm ? pesoNum / Math.pow(alturaCm / 100, 2) : null

  // FB-007 parte 2 — jornada de peso (acompanhamento GLP-1): perda acumulada, ritmo, meta, preservação de
  // massa magra. ARITMÉTICA factual sobre os registros da própria pessoa (não interpreta; RDC 657).
  const toSeries = (m: Metric): SeriesPoint[] => items
    .filter(i => i.metric === m)
    .map(i => ({ value: parseNum(i.valueText), date: i.measuredOn }))
    .filter((p): p is SeriesPoint => p.value != null)
  const journey = computeWeightJourney(toSeries('peso'), toSeries('massa_magra'), goalKg)

  // BOD-001 área ① — Resumo atual: último valor de cada indicador + origem + confiabilidade + tendência.
  const summaryPoints: SummaryPoint[] = items
    .map(i => ({ metric: i.metric as string, value: parseNum(i.valueText), date: i.measuredOn, unit: i.unit, source: i.source }))
    .filter(p => p.value != null) as SummaryPoint[]
  const summary = currentSummary(summaryPoints)
  // Ordem de exibição dos indicadores no Resumo atual (só os que têm dado). IMC entra como calculado.
  const SUMMARY_ORDER: Metric[] = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'taxa_metabolica', 'massa_ossea', 'circunferencia_cintura', 'altura']
  const summaryCards = SUMMARY_ORDER.filter(m => summary[m]).map(m => ({ metric: m, s: summary[m] }))

  // BOD-001 área ④ — Jornada de Tratamento (genérica; peso é o objetivo desta 1ª versão).
  const lastAssess = lastAssessment(summaryPoints)   // última avaliação corporal (bioimpedância/DEXA)
  // Tempo de acompanhamento (a partir da 1ª medição de peso). Semanas → meses quando ≥ 8 semanas.
  const followupLabel = journey.spanWeeks == null ? null
    : journey.spanWeeks < 8 ? `${journey.spanWeeks} sem`
    : (() => { const mo = Math.round(journey.spanWeeks / 4.345); return `${mo} ${mo === 1 ? 'mês' : 'meses'}` })()

  // BOD-001 área ② — Evolução Longitudinal. Seletor horizontal de indicadores + gráfico + tabela cronológica.
  const EVO_SHORT: Partial<Record<Metric, string>> = {
    peso: 'Peso', gordura_corporal: 'Gordura', massa_muscular: 'Massa Muscular', massa_magra: 'Massa Magra',
    agua_corporal: 'Água', gordura_visceral: 'Visceral', imc: 'IMC', taxa_metabolica: 'TMB',
    massa_ossea: 'Massa óssea', circunferencia_cintura: 'Cintura',
  }
  const EVO_ORDER: Metric[] = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'imc', 'taxa_metabolica', 'massa_ossea', 'circunferencia_cintura']
  const EVO_GLYPH: Record<string, string> = { circle: '●', square: '■', triangle: '▲', diamond: '◆' }
  const evoIndicators = EVO_ORDER.filter(m => m === 'imc' ? imcVal != null : !!summary[m])
  const evoMetricActive: Metric = evoIndicators.includes(evoMetric) ? evoMetric : (evoIndicators[0] ?? 'peso')
  // Série do indicador ativo (asc). IMC é derivado dos pontos de peso + altura do perfil.
  const evoAll: EvoPoint[] = (() => {
    if (evoMetricActive === 'imc') {
      if (alturaCm == null) return []
      return items.filter(i => i.metric === 'peso').map(i => {
        const w = parseNum(i.valueText)
        return w == null ? null : { key: i.id, date: i.measuredOn, value: Math.round((w / Math.pow(alturaCm / 100, 2)) * 10) / 10, source: i.source, examId: i.examId }
      }).filter((p): p is EvoPoint => p != null).sort((a, b) => (a.date < b.date ? -1 : 1))
    }
    return items.filter(i => i.metric === evoMetricActive).map(i => {
      const v = parseNum(i.valueText)
      return v == null ? null : { key: i.id, date: i.measuredOn, value: v, source: i.source, examId: i.examId }
    }).filter((p): p is EvoPoint => p != null).sort((a, b) => (a.date < b.date ? -1 : 1))
  })()
  const nowISO = new Date().toISOString().slice(0, 10)
  const evoPoints = filterByPeriod(evoAll, evoDays, nowISO)
  const evoUnit = evoMetricActive === 'imc' ? 'kg/m²' : (DEFAULT_UNIT[evoMetricActive] || '')
  const evoSourcesPresent = [...new Set(evoPoints.map(p => p.source).filter(Boolean))] as string[]

  // BOD-001 área ③ — snapshots (retrato por avaliação) e a comparação A × B.
  const snapPoints: SnapPoint[] = items
    .map(i => ({ metric: i.metric as string, value: parseNum(i.valueText), unit: i.unit, date: i.measuredOn, source: i.source, examId: i.examId }))
    .filter(p => p.value != null) as SnapPoint[]
  const snapshots = buildSnapshots(snapPoints)
  const snapA = snapshots.find(s => s.key === snapAKey) ?? snapshots[0] ?? null
  const snapB = snapshots.find(s => s.key === snapBKey) ?? snapshots[1] ?? null
  const COMPARE_ORDER = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'taxa_metabolica', 'massa_ossea', 'circunferencia_cintura']
  const compareRows = compareSnapshots(snapA, snapB, COMPARE_ORDER)
  const compareSummary = compareRows.filter(r => r.available && r.delta != null && r.delta !== 0)
  const snapLabel = (s: typeof snapA) => s ? `${sourceQuality(s.source)?.label ?? s.source ?? 'Registro'} · ${fmt(s.date)}` : ''
  const deltaUnit = (unit: string | null) => unit === '%' ? 'p.p.' : (unit ?? '')

  // BOD-001 área ⑤ — Marcos (projeções de outros domínios; sem tabela própria). Avaliações vêm dos snapshots.
  const assessInput: AssessmentInput[] = snapshots
    .filter(s => !!s.examId || (s.source ? ['bioimpedancia', 'dexa'].includes(s.source) : false))
    .map(s => ({ date: s.date, sourceLabel: sourceQuality(s.source)?.label ?? 'Avaliação', examId: s.examId }))
  const allMilestones = buildMilestones({ meds: medRows, assessments: assessInput, consultas: consultaRows })
  const msCatsPresent = MILESTONE_CATEGORIES.filter(c => allMilestones.some(m => m.category === c.key))
  const evoMilestones = filterByPeriod(allMilestones.filter(m => msCats.has(m.category)), evoDays, nowISO)
  const evoChartMs = evoMilestones.map(m => ({ date: m.date, color: MILESTONE_COLOR[m.category] }))
  const toggleMsCat = (k: MilestoneCategory) => setMsCats(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n })

  // IMC é calculado (não é registrado manualmente).
  const groups: Metric[] = ['peso', 'altura', 'circunferencia_cintura', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'massa_ossea', 'taxa_metabolica', 'outro']


  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-body text-sm text-mauve hover:text-petal transition-colors">
        <ArrowLeft size={15} /> Painel Inicial
      </Link>

      <PageHeader
        icon={<Ruler size={16} />}
        eyebrow="Composição Corporal"
        title="Composição Corporal"
        subtitle={<>Evolução longitudinal do seu corpo — peso, IMC, gordura, massa magra/muscular e mais — a partir de bioimpedância, exames e registros. Cada indicador mostra sua origem.</>}
        action={
          // BETA-2/BETA-5 (captura institucional): um ÚNICO "Adicionar medida" (foto/arquivo/manual).
          // A bioimpedância é DETECTADA no processamento (onScanFile) — sem botão dedicado.
          <CreateRecordMenu
            label="Adicionar medida"
            methods={['file', 'camera', 'manual']}
            fileAccept="image/*"
            cameraAccept="image/*"
            fileLabel="Selecionar foto do laudo"
            busy={scanning}
            busyLabel="Lendo laudo…"
            onSelect={(method, file) => {
              if (method === 'manual') { reset(); setShowForm(true) }
              else if (file) onScanFile(file)   // foto/laudo → detecta bioimpedância automaticamente
            }}
          />
        }
      />

      {/* Onde registrar bioimpedância (ex.: do nutricionista) */}
      <div className="rounded-2xl border border-petal/30 bg-blush/30 px-4 py-3 flex items-start gap-3">
        <Activity size={16} className="text-petal flex-shrink-0 mt-0.5" />
        <p className="font-body text-xs text-onyx leading-relaxed">
          Fez <strong>bioimpedância</strong> (por exemplo, com seu nutricionista)? Em <strong>Adicionar medida</strong>,
          envie uma <strong>foto do laudo</strong> — o sistema reconhece a bioimpedância e pré-preenche as medidas
          (gordura corporal, massa muscular, água, IMC e outros); ou registre manualmente.
          Para guardar o laudo completo, envie o arquivo em{' '}
          <Link href="/dashboard/exams" className="text-petal hover:underline font-medium">Exames</Link>.
        </p>
      </div>

      {/* BOD-001 área ① — Resumo atual: último valor por indicador + origem + confiabilidade + tendência.
          IMC entra como indicador CALCULADO (peso ÷ altura²) — sem card duplicado. */}
      {!loading && (summaryCards.length > 0 || imcVal != null) && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-lavender-light flex items-center justify-center flex-shrink-0">
              <Activity size={16} className="text-lavender" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-onyx leading-none">Resumo atual</p>
              <p className="font-body text-[11px] text-mauve mt-0.5">Último valor de cada indicador — origem, confiabilidade e tendência vs. a medição anterior.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {imcVal != null && (
              <div className="rounded-xl bg-ivory border border-border p-3">
                <p className="font-body text-[11px] text-mauve mb-0.5 truncate">IMC</p>
                <p className="font-display text-lg font-bold text-onyx leading-none">{imcVal.toFixed(1)}<span className="text-[11px] font-normal text-mauve"> kg/m²</span></p>
                <p className="font-body text-[10px] text-mauve mt-1 truncate">Calculado · {fmt(latestPeso!.measuredOn)}</p>
              </div>
            )}
            {summaryCards.map(({ metric, s }) => {
              const q = sourceQuality(s.source)
              const TrendIcon = s.trend === 'up' ? TrendingUp : s.trend === 'down' ? TrendingDown : s.trend === 'flat' ? Minus : null
              return (
                <div key={metric} className="rounded-xl bg-ivory border border-border p-3">
                  <p className="font-body text-[11px] text-mauve mb-0.5 truncate">{METRIC_LABEL[metric]}</p>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <p className="font-display text-lg font-bold text-onyx leading-none">{s.value}<span className="text-[11px] font-normal text-mauve">{s.unit ? ` ${s.unit}` : ''}</span></p>
                    {TrendIcon && s.delta != null && (
                      <span className="inline-flex items-center gap-0.5 font-body text-[10px] text-mauve" title="Variação vs. a medição anterior">
                        <TrendIcon size={11} />{s.delta > 0 ? `+${s.delta}` : s.delta}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-[10px] text-mauve mt-1 truncate">{q?.label ?? s.source ?? '—'} · {fmt(s.date)}</p>
                  {q && (
                    <span className="inline-flex items-center gap-1 mt-1 font-body text-[10px] text-mauve" title={RELIABILITY_LABEL[q.reliability]}>
                      <span className={`w-1.5 h-1.5 rounded-full ${q.reliability === 'alta' ? 'bg-petal' : q.reliability === 'media' ? 'bg-gold' : 'bg-mauve/40'}`} />
                      {q.reliability === 'alta' ? 'Alta' : q.reliability === 'media' ? 'Média' : 'Informado'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {imcVal == null && (
            <p className="font-body text-[11px] text-mauve">
              {alturaCm == null
                ? <>Informe sua <Link href="/dashboard/profile" className="text-petal hover:underline font-medium">altura no perfil</Link> e registre o peso para calcular o IMC.</>
                : <>Registre seu <strong>peso</strong> para calcular o IMC.</>}
            </p>
          )}
        </Card>
      )}

      {/* BOD-001 área ④ — Jornada de Tratamento (painel GENÉRICO, reutilizável p/ GLP-1, acompanhamento
          nutricional, bariátrica, ganho de massa, reabilitação…). Nesta 1ª versão o objetivo é o PESO.
          Aritmética factual sobre os registros da própria pessoa (RDC 657). */}
      {!loading && journey.currentWeight != null && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
                <Target size={16} className="text-petal" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-onyx leading-none">Jornada de Tratamento</p>
                <p className="font-body text-[11px] text-mauve mt-0.5">Acompanhamento de peso e composição corporal ao longo do tempo.</p>
              </div>
            </div>
            {!goalEditing && (
              <button onClick={() => { setGoalInput(goalKg != null ? String(goalKg) : ''); setGoalEditing(true) }}
                className="inline-flex items-center gap-1 font-body text-xs text-petal hover:underline flex-shrink-0">
                <Pencil size={12} /> {goalKg != null ? 'Editar meta' : 'Definir meta'}
              </button>
            )}
          </div>

          {/* Contexto da jornada: início · tempo de acompanhamento · última avaliação corporal */}
          {(journey.startDate || followupLabel || lastAssess) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[11px] text-mauve">
              {journey.startDate && <span>Início: <strong className="text-onyx/70 font-medium">{fmt(journey.startDate)}</strong></span>}
              {followupLabel && <span>· {followupLabel} de acompanhamento</span>}
              {lastAssess && <span>· Última {lastAssess.label}: <strong className="text-onyx/70 font-medium">{fmt(lastAssess.date)}</strong></span>}
            </div>
          )}

          {goalEditing && (
            <div className="flex items-end gap-2 rounded-xl bg-ivory border border-border p-3">
              <div className="flex-1">
                <label htmlFor="peso-meta" className="font-body text-xs text-mauve block mb-1">Meta de peso (kg)</label>
                <input id="peso-meta" type="text" inputMode="decimal" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                  placeholder="Ex.: 72 (deixe vazio para remover)"
                  className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-white focus:outline-none focus:ring-1 focus:ring-petal/30" />
              </div>
              <button onClick={saveGoal} disabled={goalSaving}
                className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
                {goalSaving ? '…' : 'Salvar'}
              </button>
              <button onClick={() => setGoalEditing(false)} disabled={goalSaving}
                className="px-3 py-2 rounded-full border border-border text-mauve font-body text-sm hover:bg-blush transition-colors">
                Cancelar
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-ivory border border-border p-3">
              <p className="font-body text-[11px] text-mauve mb-0.5">Peso atual</p>
              <p className="font-display text-xl font-bold text-onyx leading-none">{journey.currentWeight}<span className="text-xs font-normal text-mauve"> kg</span></p>
              {journey.startWeight != null && <p className="font-body text-[11px] text-mauve mt-1">Inicial: {journey.startWeight} kg</p>}
            </div>
            <div className="rounded-xl bg-ivory border border-border p-3">
              <p className="font-body text-[11px] text-mauve mb-0.5">Perda acumulada</p>
              <p className="font-display text-xl font-bold text-onyx leading-none flex items-center gap-1">
                {journey.lostKg != null && journey.lostKg > 0 && <TrendingDown size={15} className="text-petal" />}
                {journey.lostKg != null ? Math.abs(journey.lostKg) : '—'}<span className="text-xs font-normal text-mauve"> kg</span>
              </p>
              {journey.lostKg != null && journey.lostKg < 0 && <p className="font-body text-[11px] text-mauve mt-1">ganho no período</p>}
            </div>
            <div className="rounded-xl bg-ivory border border-border p-3">
              <p className="font-body text-[11px] text-mauve mb-0.5">Ritmo</p>
              <p className="font-display text-xl font-bold text-onyx leading-none">
                {journey.rateKgPerWeek != null ? journey.rateKgPerWeek : '—'}<span className="text-xs font-normal text-mauve"> kg/sem</span>
              </p>
              {journey.spanWeeks != null && <p className="font-body text-[11px] text-mauve mt-1">em {journey.spanWeeks} sem</p>}
            </div>
            <div className="rounded-xl bg-ivory border border-border p-3">
              <p className="font-body text-[11px] text-mauve mb-0.5">Meta</p>
              {journey.goalKg != null ? (
                <>
                  <p className="font-display text-xl font-bold text-onyx leading-none">{journey.goalKg}<span className="text-xs font-normal text-mauve"> kg</span></p>
                  {journey.remainingKg != null && (
                    <p className="font-body text-[11px] text-mauve mt-1">
                      {journey.remainingKg > 0 ? `faltam ${journey.remainingKg} kg` : journey.remainingKg < 0 ? `${Math.abs(journey.remainingKg)} kg abaixo` : 'meta atingida'}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-body text-xs text-mauve leading-snug mt-1">Defina uma meta para acompanhar o progresso.</p>
              )}
            </div>
          </div>

          {journey.progressPct != null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="font-body text-[11px] text-mauve">Progresso até a meta</p>
                <p className="font-body text-[11px] font-semibold text-onyx">{journey.progressPct}%</p>
              </div>
              <div className="h-2 rounded-full bg-blush overflow-hidden">
                <div className="h-full gradient-sintera rounded-full" style={{ width: `${journey.progressPct}%` }} />
              </div>
            </div>
          )}

          {journey.leanDeltaKg != null && (
            <div className="flex items-center gap-2 rounded-xl bg-blush/40 border border-petal/15 px-3 py-2">
              <Activity size={14} className="text-petal flex-shrink-0" />
              <p className="font-body text-xs text-onyx leading-snug">
                <strong>Massa magra:</strong> {journey.leanStartKg} → {journey.leanCurrentKg} kg
                {' '}({journey.leanDeltaKg >= 0 ? `+${journey.leanDeltaKg}` : journey.leanDeltaKg} kg no período).
                {' '}<span className="text-mauve">Acompanhe se a perda de peso preserva a massa magra.</span>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* BOD-001 área ② — Evolução Longitudinal: seletor horizontal · gráfico com filtro de período ·
          tabela cronológica · pontos CLICÁVEIS (rastreabilidade até o exame/registro). */}
      {!loading && evoIndicators.length > 0 && (
        <Card padding="md" className="space-y-4">
          <div>
            <p className="font-display text-base font-semibold text-onyx leading-none">Evolução</p>
            <p className="font-body text-[11px] text-mauve mt-0.5">Como cada indicador evoluiu — clique num ponto para ver a origem.</p>
          </div>

          {/* Seletor horizontal de indicadores */}
          <div className="flex flex-wrap gap-1.5">
            {evoIndicators.map(m => {
              const active = m === evoMetricActive
              return (
                <button key={m} type="button" onClick={() => { setEvoMetric(m); setEvoPoint(null) }}
                  className={`px-2.5 py-1 rounded-full font-body text-xs font-medium transition-colors ${active ? 'gradient-sintera text-white' : 'bg-ivory border border-border text-mauve hover:border-petal/40'}`}>
                  {EVO_SHORT[m] ?? METRIC_LABEL[m]}
                </button>
              )
            })}
          </div>

          {/* Filtros de período */}
          <div className="flex flex-wrap items-center gap-1">
            {EVOLUTION_PERIODS.map(p => {
              const active = p.days === evoDays
              return (
                <button key={p.key} type="button" onClick={() => { setEvoDays(p.days); setEvoPoint(null) }}
                  className={`px-2 py-0.5 rounded-lg font-body text-[11px] transition-colors ${active ? 'bg-blush text-petal font-semibold' : 'text-mauve hover:text-onyx'}`}>
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Marcos (BOD-001 ⑤): a usuária mostra/oculta categorias sobre o gráfico — sem alterar os dados. */}
          {msCatsPresent.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-body text-[10px] text-mauve mr-0.5">Marcos:</span>
              {msCatsPresent.map(c => {
                const on = msCats.has(c.key)
                return (
                  <button key={c.key} type="button" onClick={() => toggleMsCat(c.key)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-body text-[10px] border transition-colors ${on ? 'text-onyx' : 'text-mauve/50 line-through'} `}
                    style={{ borderColor: on ? c.color : 'var(--border)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: on ? c.color : 'transparent', border: `1px solid ${c.color}` }} /> {c.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Gráfico (com anotações de marcos dentro do período) */}
          <EvolutionChart points={evoPoints} unit={evoUnit} selectedKey={evoPoint?.key ?? null} onSelect={setEvoPoint} milestones={evoChartMs} />

          {/* Legenda de origem (o usuário percebe mudança de fonte) */}
          {evoSourcesPresent.length > 0 && (
            <div className="flex flex-wrap gap-3 font-body text-[10px] text-mauve">
              {evoSourcesPresent.map(s => (
                <span key={s} className="inline-flex items-center gap-1"><span className="text-petal">{EVO_GLYPH[markerFor(s)]}</span> {sourceQuality(s)?.label ?? s}</span>
              ))}
            </div>
          )}

          {/* Lista de marcos no período — narrativa da jornada, rastreável ao registro de origem */}
          {evoMilestones.length > 0 && (
            <div className="space-y-1">
              <p className="font-body text-[11px] font-semibold text-onyx/70">Marcos no período</p>
              <ul className="space-y-0.5">
                {[...evoMilestones].reverse().map(m => (
                  <li key={m.key} className="flex items-center gap-2 font-body text-[11px] text-onyx">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: MILESTONE_COLOR[m.category] }} />
                    <span className="text-mauve whitespace-nowrap">{fmt(m.date)}</span>
                    {m.href ? <Link href={m.href} className="hover:text-petal hover:underline truncate">{m.title}</Link> : <span className="truncate">{m.title}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detalhe do ponto selecionado — rastreabilidade */}
          {evoPoint && (
            <div className="rounded-xl bg-blush/30 border border-petal/20 p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-onyx leading-none">{evoPoint.value}<span className="text-xs font-normal text-mauve">{evoUnit ? ` ${evoUnit}` : ''}</span></p>
                <p className="font-body text-[11px] text-mauve mt-1">
                  <span className="text-petal mr-0.5">{EVO_GLYPH[markerFor(evoPoint.source)]}</span>
                  {sourceQuality(evoPoint.source)?.label ?? evoPoint.source ?? 'Origem não informada'} · {fmt(evoPoint.date)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {evoPoint.examId ? (
                  <Link href={`/dashboard/exams/${evoPoint.examId}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-petal/30 font-body text-xs text-petal hover:bg-blush transition-colors">Abrir exame</Link>
                ) : (
                  <span className="font-body text-[11px] text-mauve">Registro manual</span>
                )}
                <button onClick={() => setEvoPoint(null)} className="text-mauve hover:text-onyx font-body text-lg leading-none" aria-label="Fechar detalhe">×</button>
              </div>
            </div>
          )}

          {/* Tabela cronológica — de onde veio cada ponto */}
          {evoPoints.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-xs">
                <thead>
                  <tr className="text-mauve">
                    <th className="py-1 pr-2 font-medium">Data</th>
                    <th className="py-1 pr-2 font-medium">Valor</th>
                    <th className="py-1 pr-2 font-medium">Origem</th>
                    <th className="py-1 font-medium">Avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  {[...evoPoints].reverse().map(p => {
                    const ex = p.examId ? exams.find(e => e.id === p.examId) : null
                    const sel = p.key === evoPoint?.key
                    return (
                      <tr key={p.key} onClick={() => setEvoPoint(p)}
                        className={`border-t border-border/50 cursor-pointer transition-colors ${sel ? 'bg-blush/30' : 'hover:bg-blush/15'}`}>
                        <td className="py-1.5 pr-2 text-mauve whitespace-nowrap">{fmt(p.date)}</td>
                        <td className="py-1.5 pr-2 text-onyx font-medium whitespace-nowrap">{p.value}{evoUnit ? ` ${evoUnit}` : ''}</td>
                        <td className="py-1.5 pr-2 text-mauve whitespace-nowrap"><span className="text-petal mr-1">{EVO_GLYPH[markerFor(p.source)]}</span>{sourceQuality(p.source)?.label ?? p.source ?? '—'}</td>
                        <td className="py-1.5 text-mauve">{ex ? <Link href={`/dashboard/exams/${ex.id}`} onClick={e => e.stopPropagation()} className="text-petal hover:underline">{ex.type}</Link> : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* BOD-001 área ③ — Comparação entre Avaliações (snapshots A × B). Confronta retratos independentes,
          preserva a origem, evidencia indisponibilidades e NÃO normaliza entre tecnologias. */}
      {!loading && snapshots.length >= 2 && (
        <Card padding="md" className="space-y-4">
          <div>
            <p className="font-display text-base font-semibold text-onyx leading-none">Comparar avaliações</p>
            <p className="font-body text-[11px] text-mauve mt-0.5">Confronte dois retratos — cada valor mantém sua origem; sem ajuste entre tecnologias (ex.: DEXA × Bioimpedância).</p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="snap-a" className="font-body text-[11px] text-mauve block mb-1">Avaliação A</label>
              <select id="snap-a" value={snapA?.key ?? ''} onChange={e => setSnapAKey(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                {snapshots.map(s => <option key={s.key} value={s.key}>{snapLabel(s)}</option>)}
              </select>
            </div>
            <span className="font-body text-xs text-mauve pb-2.5">com</span>
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="snap-b" className="font-body text-[11px] text-mauve block mb-1">Avaliação B</label>
              <select id="snap-b" value={snapB?.key ?? ''} onChange={e => setSnapBKey(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                {snapshots.map(s => <option key={s.key} value={s.key}>{snapLabel(s)}</option>)}
              </select>
            </div>
          </div>

          {snapA && snapB && snapA.key === snapB.key ? (
            <p className="font-body text-xs text-mauve">Selecione duas avaliações diferentes para comparar.</p>
          ) : snapA && snapB ? (
            <>
              {compareSummary.length > 0 && (
                <div className="rounded-xl bg-blush/30 border border-petal/15 p-3">
                  <p className="font-body text-[11px] font-semibold text-onyx mb-1">Entre essas duas avaliações houve:</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {compareSummary.map(r => (
                      <span key={r.metric} className="font-body text-xs text-onyx">
                        {METRIC_LABEL[r.metric as Metric] ?? r.metric}: <strong>{r.delta! > 0 ? `+${r.delta}` : r.delta} {deltaUnit(r.unit)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-xs">
                  <thead>
                    <tr className="text-mauve align-bottom">
                      <th className="py-1 pr-2 font-medium">Indicador</th>
                      <th className="py-1 pr-2 font-medium">
                        <span className="block text-onyx font-semibold">Avaliação A</span>
                        <span className="block text-[10px] text-mauve font-normal">{sourceQuality(snapA.source)?.label ?? snapA.source ?? 'Registro'} · {fmt(snapA.date)}</span>
                        {snapA.examId && <Link href={`/dashboard/exams/${snapA.examId}`} className="block text-[10px] text-petal hover:underline font-normal">Abrir exame</Link>}
                      </th>
                      <th className="py-1 pr-2 font-medium">
                        <span className="block text-onyx font-semibold">Avaliação B</span>
                        <span className="block text-[10px] text-mauve font-normal">{sourceQuality(snapB.source)?.label ?? snapB.source ?? 'Registro'} · {fmt(snapB.date)}</span>
                        {snapB.examId && <Link href={`/dashboard/exams/${snapB.examId}`} className="block text-[10px] text-petal hover:underline font-normal">Abrir exame</Link>}
                      </th>
                      <th className="py-1 pr-2 font-medium">Δ</th>
                      <th className="py-1 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map(r => (
                      <tr key={r.metric} className="border-t border-border/50">
                        <td className="py-1.5 pr-2 text-mauve whitespace-nowrap">{METRIC_LABEL[r.metric as Metric] ?? r.metric}</td>
                        <td className="py-1.5 pr-2 text-onyx whitespace-nowrap">
                          {r.a != null ? (snapA.examId ? <Link href={`/dashboard/exams/${snapA.examId}`} className="hover:text-petal hover:underline">{r.a}{r.unit ? ` ${r.unit}` : ''}</Link> : <span title="Registro manual">{r.a}{r.unit ? ` ${r.unit}` : ''}</span>) : '—'}
                        </td>
                        <td className="py-1.5 pr-2 text-onyx whitespace-nowrap">
                          {r.b != null ? (snapB.examId ? <Link href={`/dashboard/exams/${snapB.examId}`} className="hover:text-petal hover:underline">{r.b}{r.unit ? ` ${r.unit}` : ''}</Link> : <span title="Registro manual">{r.b}{r.unit ? ` ${r.unit}` : ''}</span>) : '—'}
                        </td>
                        <td className="py-1.5 pr-2 whitespace-nowrap font-medium text-onyx">{r.delta != null ? `${r.delta > 0 ? `+${r.delta}` : r.delta} ${deltaUnit(r.unit)}` : '—'}</td>
                        <td className="py-1.5 whitespace-nowrap">{r.available ? <span className="text-petal">✓</span> : <span className="text-mauve">Não disponível</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="font-body text-[10px] text-mauve">Valores como medidos por cada método — sem ajuste entre tecnologias. Δ = Avaliação A − Avaliação B.</p>
            </>
          ) : null}
        </Card>
      )}

      {/* Revisão do laudo de bioimpedância escaneado */}
      {scanRows && (
        <Section padding="md" bodyClassName="space-y-3" icon={<Camera size={16} className="text-petal" />} title="Revise os dados lidos do laudo">
          <div>
            <label htmlFor="medida-scan-date" className="font-body text-xs text-mauve block mb-1">Data do exame</label>
            <input id="medida-scan-date" type="date" value={scanDate} onChange={e => setScanDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
          </div>
          {exams.length > 0 && (
            <div>
              <label htmlFor="medida-scan-exam" className="font-body text-xs text-mauve block mb-1">Vincular ao laudo em Exames (opcional)</label>
              <select id="medida-scan-exam" value={scanExamId} onChange={e => setScanExamId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="">Nenhum</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.type}{ex.examDate ? ` · ${fmt(ex.examDate)}` : ''}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            {scanRows.map((row, i) => (
              <div key={row.metric} className="flex items-center gap-2">
                <span className="font-body text-xs text-onyx w-40 flex-shrink-0">{METRIC_LABEL[row.metric]}</span>
                <input value={row.value} aria-label={METRIC_LABEL[row.metric]}
                  onChange={e => setScanRows(rows => rows!.map((r, j) => j === i ? { ...r, value: e.target.value } : r))}
                  className="flex-1 px-2 py-1.5 border border-border rounded-lg font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
                <span className="font-body text-xs text-mauve w-12 flex-shrink-0">{row.unit}</span>
                <button onClick={() => setScanRows(rows => rows!.filter((_, j) => j !== i))} title="Descartar"
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-mauve hover:text-red-500 flex-shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          {scanErr && <p className="font-body text-xs text-red-500">{scanErr}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setScanRows(null); setScanErr(null) }}
              className="px-4 py-2 rounded-full border border-border text-mauve font-body text-sm hover:bg-ivory transition-colors">
              Cancelar
            </button>
            <button onClick={saveScan} disabled={savingScan || !scanDate}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {savingScan ? 'Salvando…' : 'Salvar tudo'}
            </button>
          </div>
        </Section>
      )}

      {scanErr && !scanRows && <p className="font-body text-xs text-red-500">{scanErr}</p>}

      {showForm && (
        <Card padding="md" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="medida-metric" className="font-body text-xs text-mauve block mb-1">Medida</label>
              <select id="medida-metric" value={metric} onChange={e => chooseMetric(e.target.value as Metric)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <optgroup label="Corpo">
                  <option value="peso">Peso</option>
                  <option value="altura">Altura</option>
                  <option value="circunferencia_cintura">Circunferência (cintura)</option>
                </optgroup>
                <optgroup label="Bioimpedância">
                  <option value="gordura_corporal">Gordura corporal</option>
                  <option value="massa_muscular">Massa muscular</option>
                  <option value="massa_magra">Massa magra</option>
                  <option value="agua_corporal">Água corporal</option>
                  <option value="gordura_visceral">Gordura visceral</option>
                  <option value="massa_ossea">Massa óssea</option>
                  <option value="taxa_metabolica">Taxa metabólica basal</option>
                </optgroup>
                <option value="outro">Outra medida</option>
              </select>
            </div>
            <div>
              <label htmlFor="medida-date" className="font-body text-xs text-mauve block mb-1">Data</label>
              <input id="medida-date" type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          {metric === 'outro' && (
            <div>
              <label htmlFor="medida-label" className="font-body text-xs text-mauve block mb-1">Nome da medida</label>
              <input id="medida-label" type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex.: Glicemia capilar"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="medida-value" className="font-body text-xs text-mauve block mb-1">Valor</label>
              <input id="medida-value" type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={PLACEHOLDER[metric]}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
            <div>
              <label htmlFor="medida-unit" className="font-body text-xs text-mauve block mb-1">Unidade</label>
              <input id="medida-unit" type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="kg, mmHg, cm…"
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
            </div>
          </div>
          <div>
            <label htmlFor="medida-notes" className="font-body text-xs text-mauve block mb-1">Observações (opcional)</label>
            <div className="flex items-start gap-2">
              <textarea id="medida-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="flex-1 px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30" />
              <VoiceInput onResult={t => setNotes(v => (v ? v + ' ' : '') + t)} />
            </div>
          </div>
          {exams.length > 0 && (
            <div>
              <label htmlFor="medida-exam" className="font-body text-xs text-mauve block mb-1">Vincular a um laudo (opcional)</label>
              <select id="medida-exam" value={examId} onChange={e => setExamId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-xl font-body text-sm text-onyx bg-ivory focus:outline-none focus:ring-1 focus:ring-petal/30">
                <option value="">Nenhum</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.type}{ex.examDate ? ` · ${fmt(ex.examDate)}` : ''}</option>
                ))}
              </select>
              <p className="font-body text-[11px] text-mauve mt-1">
                Veio de um exame/laudo já enviado em <Link href="/dashboard/exams" className="text-petal hover:underline">Exames</Link>? Vincule para abrir o documento original aqui e no relatório.
              </p>
            </div>
          )}
          {err && <p className="font-body text-xs text-red-500">{err}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { reset(); setShowForm(false) }} disabled={saving}
              className="px-4 py-2 rounded-full border border-border text-mauve font-body text-sm font-medium hover:bg-blush transition-colors disabled:opacity-40">
              Cancelar
            </button>
            <button onClick={save} disabled={saving || !value.trim() || !date}
              className="px-4 py-2 rounded-full gradient-sintera text-white font-body text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card padding="2xl" className="text-center"><Loader2 size={24} className="animate-spin text-petal mx-auto" /></Card>
      ) : items.length === 0 ? (
        <EmptyState icon={<Ruler size={28} className="text-petal" />} title="Nenhuma medida ainda"
          message={<>Registre uma avaliação. Use <strong>Adicionar</strong>.</>} />
      ) : (
        <div className="space-y-6">
          {groups.map(g => {
            const list = items.filter(i => i.metric === g)
            if (list.length === 0) return null
            // Série cronológica (lista vem do mais recente; invertemos para o gráfico).
            const serie = [...list].reverse().map(it => parseNum(it.valueText)).filter((v): v is number => v !== null)
            return (
              <div key={g}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-display text-base font-semibold text-onyx">{METRIC_LABEL[g]}</p>
                  {serie.length >= 2 && (
                    <div className="flex items-center gap-2">
                      <span className="font-body text-[11px] text-mauve">{list.length} registros</span>
                      <Sparkline values={serie} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {list.map(it => {
                    const prefix = it.metric === 'outro' && it.label ? `${it.label}: ` : ''
                    const ex = it.examId ? exams.find(e => e.id === it.examId) : null
                    // Origem do indicador (BOD-001): rótulo derivado de `source`; se veio de exame, o laudo
                    // aparece abaixo (rastreável ao documento). 'manual' sem laudo não precisa de rótulo redundante.
                    const originLabel = it.source && it.source !== 'manual' ? SOURCE_LABEL[it.source] ?? SOURCE_LABEL.outro : null
                    return (
                      <ListCard
                        key={it.id}
                        title={`${prefix}${it.valueText}${it.unit ? ` ${it.unit}` : ''}`}
                        meta={
                          <>
                            {fmt(it.measuredOn)}{originLabel ? ` · ${originLabel}` : ''}{it.notes ? ` · ${it.notes}` : ''}
                            {ex && (
                              <span className="block mt-0.5">
                                Laudo: {ex.type}{ex.examDate ? ` · ${fmt(ex.examDate)}` : ''}{' '}
                                {ex.fileUrl ? <ProvenanceLine provenance={examProvenance({ fileUrl: ex.fileUrl })} showOrigin={false} className="ml-1" /> : null}
                              </span>
                            )}
                          </>
                        }
                        actions={
                          <button onClick={() => remove(it.id)} disabled={busyId === it.id} title="Remover"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-mauve/40 hover:text-red-400 hover:bg-red-50 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        }
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Disclaimer variant="geral" className="text-center" />

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
