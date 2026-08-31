// Composição Corporal (paridade Web /dashboard/medidas · BOD-001) — série temporal autorrelatada. 5 áreas:
// ① medidas (CRUD) · ② resumo atual + jornada de peso (GLP-1) + evolução longitudinal · ③ comparação entre
// avaliações (A×B) · ⑤ marcos (projeção de Medicamentos/Consultas/Avaliações). Toda a lógica (jornada/sumário/
// evolução/snapshots/marcos) vem do @sintera/core (fonte única). FACTUAL (RDC 657/2022): registra e organiza os
// valores da própria pessoa; não interpreta. O scan de laudo (OCR) é captura de device — trilha própria (câmera).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, View, ActivityIndicator, RefreshControl, Pressable, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { text } from '@sintera/design-system'
import type { BodyMetricDTO, ExamDTO } from '@sintera/api-client'
import type { HealthEvent } from '@sintera/core'
import { BODY_COMPARE_ORDER } from '@sintera/core'
import {
  BODY_METRICS, bodyMetricLabel, bodyMetricUnit, isVital, type BodyMetric,
  currentSummary, computeWeightJourney, variacaoDePeso, ritmoDePeso, pesoLabel, lastAssessment, sourceQuality, RELIABILITY_LABEL,
  EVOLUTION_PERIODS, filterByPeriod, type SummaryPoint, type SeriesPoint,
  buildSnapshots, compareSnapshots, type SnapPoint, type Snapshot,
  buildMilestones, MILESTONE_CATEGORIES, MILESTONE_COLOR, type MilestoneCategory,
  type MedInput, type AssessmentInput, type ConsultaInput, professionalKindLabel,
} from '@sintera/core'
import { Text, Button, Input, MetricRow, Disclaimer, DatePicker } from '../../primitives'
import { useTheme } from '../../theme'
import { apiClient } from '../../../infrastructure/apiClient'
import { useAssistedCapture } from '../capture/useAssistedCapture'
import { AssistedBatchReview, type ReviewItem } from '../capture/AssistedBatchReview'

function parseNum(v: string): number { return Number(String(v).replace(',', '.').replace(/[^\d.-]/g, '')) }
function fmt(d: string): string { const [y, m, dd] = (d || '').slice(0, 10).split('-'); return y ? `${dd}/${m}/${y}` : '—' }
function today(): string { return new Date().toISOString().slice(0, 10) }
const SUMMARY_ORDER: BodyMetric[] = ['peso', 'gordura_corporal', 'massa_muscular', 'massa_magra', 'agua_corporal', 'gordura_visceral', 'taxa_metabolica', 'massa_ossea', 'circunferencia_cintura', 'altura']

export function ComposicaoScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  // Composição e Exames vivem no mesmo stack (Minha Saúde) — abre o detalhe no próprio stack.
  const openExam = (id: string | null | undefined) => { if (id) (navigation as { navigate: (n: string, p: unknown) => void }).navigate('ExamDetail', { id }) }
  const [items, setItems] = useState<BodyMetricDTO[]>([])
  const [meds, setMeds] = useState<MedInput[]>([])
  const [consultas, setConsultas] = useState<ConsultaInput[]>([])
  const [exams, setExams] = useState<ExamDTO[]>([])
  const [goal, setGoal] = useState<number | null>(null)
  const [heightCm, setHeightCm] = useState<number | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const alive = useRef(true)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BodyMetricDTO | null>(null)
  const [metric, setMetric] = useState<BodyMetric>('peso')
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('kg')
  const [date, setDate] = useState('')
  const [examId, setExamId] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const [goalEditing, setGoalEditing] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [evoMetric, setEvoMetric] = useState<BodyMetric>('peso')
  const [evoDays, setEvoDays] = useState<number | null>(90)
  const [snapAKey, setSnapAKey] = useState<string | null>(null)
  const [snapBKey, setSnapBKey] = useState<string | null>(null)
  const [msCats, setMsCats] = useState<Set<MilestoneCategory>>(new Set(MILESTONE_CATEGORIES.map(c => c.key)))

  const load = useCallback((silent: boolean) => {
    if (silent) setRefreshing(true); else setPhase('loading')
    Promise.all([
      apiClient.body.listBodyMetrics(),
      apiClient.body.getWeightGoal(),
      apiClient.body.getHeightCm(),
      apiClient.medications.listMedications(),
      apiClient.agenda.listEvents(),
      apiClient.exams.listExams(),
    ])
      .then(([ms, g, h, medRows, events, exRows]) => {
        if (!alive.current) return
        setItems(ms); setGoal(g); setHeightCm(h); setExams(exRows)
        setMeds(medRows.map(m => ({ id: m.id, name: m.name, kind: m.kind, startedOn: m.started_on, untilOn: m.until_date, status: m.status })))
        setConsultas(events.filter((e: HealthEvent) => e.type === 'consulta' || e.type === 'retorno')
          .map((e: HealthEvent) => ({ id: e.id, date: e.date, professionalKind: e.professionalKind ?? null, professionalLabel: e.professionalKind ? professionalKindLabel(e.professionalKind) : null, title: e.title ?? null })))
        setPhase('ready'); setError(null)
      })
      .catch((e) => { if (alive.current && !silent) { setError(e instanceof Error ? e.message : 'Não foi possível carregar.'); setPhase('error') } })
      .finally(() => { if (alive.current) setRefreshing(false) })
  }, [])
  useEffect(() => { alive.current = true; load(false); return () => { alive.current = false } }, [load])

  // Composição Corporal = só medidas corporais; sinais vitais (mesma tabela) vivem no Monitoramento (isVital).
  const bodyItems = useMemo(() => items.filter(m => !isVital(m.metric)), [items])
  const summaryPoints: SummaryPoint[] = useMemo(() => bodyItems.map(m => ({ metric: m.metric, value: parseNum(m.value_text), unit: m.unit, date: m.measured_on, source: m.source })).filter(p => Number.isFinite(p.value)), [bodyItems])
  const summary = useMemo(() => currentSummary(summaryPoints), [summaryPoints])
  const series = useCallback((met: string): SeriesPoint[] => summaryPoints.filter(p => p.metric === met).map(p => ({ value: p.value, date: p.date })), [summaryPoints])
  const journey = useMemo(() => computeWeightJourney(series('peso'), series('massa_magra'), goal), [series, goal])
  const followupLabel = journey.spanWeeks == null ? null
    : journey.spanWeeks < 8 ? `${journey.spanWeeks} sem`
    : (() => { const mo = Math.round(journey.spanWeeks / 4.345); return `${mo} ${mo === 1 ? 'mês' : 'meses'}` })()
  const lastAval = useMemo(() => lastAssessment(summaryPoints), [summaryPoints])

  // IMC = peso ÷ altura² (calculado, factual — não é registrado). Usa o peso mais recente e a altura do perfil.
  const imc = (kg: number) => heightCm ? Math.round((kg / Math.pow(heightCm / 100, 2)) * 10) / 10 : null
  const latestPeso = summary['peso']?.value ?? null
  const imcVal = latestPeso != null ? imc(latestPeso) : null

  // Indicadores da evolução: os que têm série + IMC (derivado do peso) quando há altura.
  const evoIndicators: { value: BodyMetric; label: string }[] = [
    ...BODY_METRICS.filter(m => m.value !== 'imc' && series(m.value).length > 0).map(m => ({ value: m.value, label: m.label })),
    ...(heightCm && series('peso').length > 0 ? [{ value: 'imc' as BodyMetric, label: 'IMC' }] : []),
  ]
  const evoActive: BodyMetric = evoIndicators.some(m => m.value === evoMetric) ? evoMetric : (evoIndicators[0]?.value ?? 'peso')
  const evoSeries: SeriesPoint[] = evoActive === 'imc'
    ? series('peso').map(p => ({ date: p.date, value: imc(p.value) ?? 0 })).filter(p => p.value > 0)
    : series(evoActive)
  const evoPoints = filterByPeriod(evoSeries.map(p => ({ date: p.date, value: p.value })), evoDays, today())
  // Série DETALHADA (data · valor · origem · exame) p/ a tabela cronológica clicável — rastreabilidade BOD-001.
  const evoDetail = filterByPeriod(
    bodyItems.filter(m => evoActive === 'imc' ? m.metric === 'peso' : m.metric === evoActive)
      .map(m => { const v = parseNum(m.value_text); return { date: m.measured_on, value: evoActive === 'imc' ? (imc(v) ?? 0) : v, unit: evoActive === 'imc' ? 'kg/m²' : (m.unit ?? ''), source: m.source, examId: m.exam_id } })
      .filter(p => Number.isFinite(p.value) && p.value > 0),
    evoDays, today(),
  ).slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  const evoSources = [...new Set(evoDetail.map(p => p.source).filter(Boolean))] as string[]

  const snapshots: Snapshot[] = useMemo(() => buildSnapshots(bodyItems.map((m): SnapPoint => ({ metric: m.metric, value: parseNum(m.value_text), unit: m.unit, date: m.measured_on, source: m.source, examId: m.exam_id })).filter(p => Number.isFinite(p.value))), [bodyItems])
  const snapA = snapshots.find(s => s.key === snapAKey) ?? snapshots[0] ?? null
  const snapB = snapshots.find(s => s.key === snapBKey) ?? snapshots[1] ?? null
  // Mostra TODAS as métricas (as ausentes marcadas "Não disponível") — evidencia indisponibilidades sem
  // normalizar entre tecnologias (BOD-001 ③). Não filtra por r.available.
  const compareRows = useMemo(() => compareSnapshots(snapA, snapB, BODY_COMPARE_ORDER), [snapA, snapB])
  const compareRelevant = compareRows.filter(r => r.available && r.delta != null && r.delta !== 0)
  const sameSnap = !!snapA && !!snapB && snapA.key === snapB.key
  const snapLabel = (s: Snapshot | null) => s ? `${sourceQuality(s.source)?.label ?? s.source ?? 'Registro'} · ${fmt(s.date)}` : '—'

  const assessments: AssessmentInput[] = useMemo(() => snapshots
    .filter(s => !!s.examId || (s.source ? ['bioimpedancia', 'dexa'].includes(s.source) : false))
    .map(s => ({ date: s.date, sourceLabel: sourceQuality(s.source)?.label ?? 'Avaliação', examId: s.examId ?? null })), [snapshots])
  const allMilestones = useMemo(() => buildMilestones({ meds, assessments, consultas }), [meds, assessments, consultas])
  const catsPresent = MILESTONE_CATEGORIES.filter(c => allMilestones.some(m => m.category === c.key))
  // Marcos respeitam o período selecionado (como a evolução) e as categorias marcadas.
  const milestones = filterByPeriod(allMilestones.filter(m => msCats.has(m.category)), evoDays, today())
  const openMilestone = (href: string | null) => { const m = href?.match(/\/exams?\/([\w-]+)/); if (m) openExam(m[1]) }

  // T1 — captura assistida da BIOIMPEDÂNCIA: um laudo gera MÚLTIPLAS medidas → revisão em lote (proposta → salvar).
  const capture = useAssistedCapture()
  const [batch, setBatch] = useState<ReviewItem[]>([])
  const [batchDate, setBatchDate] = useState(today())
  const [batchSaving, setBatchSaving] = useState(false)
  async function scanBioimpedance() {
    const cap = await capture.run((input) => apiClient.vision.readBioimpedance(input))
    if (!cap) return
    const r = cap.data
    const fields: [BodyMetric, string | null][] = [
      ['peso', r.peso], ['gordura_corporal', r.gordura_corporal], ['massa_muscular', r.massa_muscular],
      ['agua_corporal', r.agua_corporal], ['gordura_visceral', r.gordura_visceral], ['massa_ossea', r.massa_ossea],
      ['taxa_metabolica', r.taxa_metabolica],
    ]
    const items: ReviewItem[] = fields.filter(([, v]) => v != null && String(v).trim())
      .map(([k, v]) => ({ key: k, label: bodyMetricLabel(k), value: String(v).trim(), unit: bodyMetricUnit(k) }))
    if (items.length === 0) { Alert.alert('Nada reconhecido', 'Não consegui ler medidas neste laudo.'); return }
    setBatchDate(r.measured_on && /^\d{4}-\d{2}-\d{2}$/.test(r.measured_on) ? r.measured_on : today())
    setBatch(items)
  }
  async function saveBatch() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(batchDate)) { Alert.alert('Data obrigatória', 'Informe a data da avaliação.'); return }
    setBatchSaving(true)
    try {
      for (const it of batch) {
        await apiClient.body.saveBodyMetric({ metric: it.key as BodyMetric, value_text: it.value, unit: it.unit ?? null, measured_on: batchDate, source: 'bioimpedancia' })
      }
      setBatch([]); load(true)
    } finally { setBatchSaving(false) }
  }

  const examLabel = (e: ExamDTO) => `${e.display_title || e.type || 'Exame'}${e.exam_date ? ` · ${fmt(e.exam_date)}` : ''}`
  function startNew() { setEditing(null); setMetric('peso'); setLabel(''); setValue(''); setUnit('kg'); setDate(today()); setExamId(''); setNotes(''); setOpen(true) }
  function startEdit(m: BodyMetricDTO) { setEditing(m); setMetric(m.metric); setLabel(m.metric === 'outro' ? (m.label ?? '') : ''); setValue(m.value_text); setUnit(m.unit ?? bodyMetricUnit(m.metric)); setDate(m.measured_on); setExamId(m.exam_id ?? ''); setNotes(m.notes ?? ''); setOpen(true) }
  function chooseMetric(v: BodyMetric) { setMetric(v); setUnit(bodyMetricUnit(v)) }
  async function save() {
    if (!value.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { Alert.alert('Campos obrigatórios', 'Informe valor e data (AAAA-MM-DD).'); return }
    setSaving(true)
    try {
      const { error: err } = await apiClient.body.saveBodyMetric({
        id: editing?.id, metric, label: metric === 'outro' ? (label.trim() || 'Medida') : null,
        value_text: value, unit, measured_on: date, exam_id: examId || null, notes,
      })
      if (err) { Alert.alert('Não foi possível salvar', err.message || 'Tente novamente.'); return }
      setOpen(false); load(true)
    } finally { setSaving(false) }
  }
  function remove(m: BodyMetricDTO) {
    Alert.alert('Excluir medida', `Excluir ${bodyMetricLabel(m.metric)} de ${fmt(m.measured_on)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { const { error: err } = await apiClient.body.deleteBodyMetric(m.id); if (err) { Alert.alert('Erro', 'Tente novamente.'); return } load(true) } },
    ])
  }
  async function saveGoal() {
    const kg = goalInput.trim() ? parseNum(goalInput) : null
    const { error: err } = await apiClient.body.setWeightGoal(kg != null && Number.isFinite(kg) ? kg : null)
    if (!err) { setGoalEditing(false); load(true) }
  }
  function toggleCat(k: MilestoneCategory) { setMsCats(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n }) }

  if (phase === 'loading') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><ActivityIndicator color={t.color.identity.primary} /></View>
  }
  if (phase === 'error') {
    return <View style={[styles.center, { backgroundColor: t.color.surface.app, paddingTop: insets.top }]}><Text spec={text(t, { role: 'body' })} style={{ color: t.color.badge.error.text, textAlign: 'center' }}>{error}</Text><Button label="Tentar novamente" variant="secondary" onPress={() => load(false)} /></View>
  }

  const card = { backgroundColor: t.color.surface.base, borderColor: t.color.border.default }
  const evoVals = evoPoints.map(p => p.value); const evoMin = Math.min(...evoVals), evoMax = Math.max(...evoVals)
  const trendColor = (tr: string | null) => tr === 'up' ? t.color.badge.attention.text : tr === 'down' ? t.color.badge.info.text : t.color.text.muted

  return (
    <ScrollView style={{ backgroundColor: t.color.surface.app }}
      contentContainerStyle={[styles.content, { paddingTop: styles.content.padding + insets.top, paddingBottom: styles.content.padding + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={t.color.identity.primary} />}>
      <View style={styles.headerRow}>
        <Text spec={text(t, { role: 'bodyStrong' })} style={{ fontSize: 22, flex: 1 }} numberOfLines={1}>Composição Corporal</Text>
        {!open ? <Button label="Nova medida" onPress={startNew} /> : null}
      </View>
      {!open ? <Button label="Escanear laudo de bioimpedância" variant="secondary" loading={capture.busy} loadingLabel="Lendo…" onPress={scanBioimpedance} /> : null}
      <AssistedBatchReview
        visible={batch.length > 0} title="Medidas lidas do laudo" items={batch} date={batchDate}
        onDateChange={setBatchDate} onConfirm={saveBatch} onCancel={() => setBatch([])} busy={batchSaving}
        confirmLabel={`Salvar ${batch.length} ${batch.length === 1 ? 'medida' : 'medidas'}`}
      />

      {/* ② Jornada de peso (GLP-1) */}
      <View style={[styles.card, card, { gap: 6 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Jornada de peso</Text>
          <Pressable onPress={() => { setGoalInput(goal != null ? String(goal) : ''); setGoalEditing(v => !v) }}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Meta{goal != null ? `: ${goal} kg` : ''}</Text></Pressable>
        </View>
        {goalEditing ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Input value={goalInput} onChangeText={setGoalInput} placeholder="Meta (kg) — vazio remove" keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Button label="Salvar" onPress={saveGoal} />
            <Button label="Cancelar" variant="secondary" onPress={() => setGoalEditing(false)} />
          </View>
        ) : null}
        {journey.currentWeight != null ? (
          <>
            <Text spec={text(t, { role: 'body' })}>Atual: {pesoLabel(journey.currentWeight)}{journey.startWeight != null ? ` · início ${pesoLabel(journey.startWeight)}` : ''}{journey.startDate ? ` (${fmt(journey.startDate)})` : ''}</Text>
            {/* O SINAL VEM DO NUCLEO. Escrito aqui a mao, os dois ramos imprimiam menos: um ganho de 2,8 kg saia
                 "−2,8", identico a uma perda de 2,8 — num registro que vai ao medico. A Web acertava, e a regra
                 divergiu por estar escrita duas vezes. */}
            {variacaoDePeso(journey.lostKg) ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{variacaoDePeso(journey.lostKg)!.texto}{ritmoDePeso(journey.rateKgPerWeek) ? ` · ${ritmoDePeso(journey.rateKgPerWeek)!.texto}` : ''}{followupLabel ? ` · ${followupLabel} de acompanhamento` : ''}</Text> : null}
            {journey.remainingKg != null ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Faltam {journey.remainingKg} kg{journey.progressPct != null ? ` · ${journey.progressPct}% do caminho` : ''}</Text> : goal == null ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Defina uma meta para acompanhar o progresso.</Text> : null}
            {journey.leanDeltaKg != null ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Massa magra: {journey.leanStartKg != null ? `${journey.leanStartKg} → ${journey.leanCurrentKg} kg (` : ''}{journey.leanDeltaKg > 0 ? '+' : ''}{journey.leanDeltaKg} kg{journey.leanStartKg != null ? ')' : ''} — acompanhe se a perda preserva a massa magra</Text> : null}
          </>
        ) : <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Registre seu peso para acompanhar a jornada.</Text>}
        {lastAval ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Última avaliação: {lastAval.label} · {fmt(lastAval.date)}</Text> : null}
      </View>

      {/* ① Formulário de medida */}
      {open ? (
        <View style={[styles.card, card, { gap: 12 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>{editing ? 'Editar medida' : 'Nova medida'}</Text>
          <Chips options={BODY_METRICS.map(m => ({ id: m.value, label: m.label }))} value={metric} onChange={(v) => chooseMetric(v as BodyMetric)} />
          {metric === 'outro' ? <Input value={label} onChangeText={setLabel} placeholder="Nome da medida" /> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Input value={value} onChangeText={setValue} placeholder={BODY_METRICS.find(m => m.value === metric)?.placeholder} keyboardType="decimal-pad" style={{ flex: 2 }} />
            <Input value={unit} onChangeText={setUnit} placeholder="unidade" style={{ flex: 1 }} />
          </View>
          <DatePicker value={date} onChange={setDate} placeholder="Data" />
          <Input value={notes} onChangeText={setNotes} placeholder="Observações…" multiline style={{ minHeight: 50, textAlignVertical: 'top' }} />
          {exams.length > 0 ? (
            <View style={{ gap: 6 }}>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Vincular a um exame (opcional)</Text>
              <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Veio de um exame/laudo já enviado em Exames? Vincule para abrir o documento original a partir daqui.</Text>
              <Chips options={[{ id: '', label: 'Nenhum' }, ...exams.map(e => ({ id: e.id, label: examLabel(e) }))]} value={examId} onChange={setExamId} />
            </View>
          ) : null}
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={() => setOpen(false)} />
            <Button label={editing ? 'Atualizar' : 'Salvar'} onPress={save} loading={saving} loadingLabel="Salvando…" />
          </View>
        </View>
      ) : null}

      {/* ① Estado atual por indicador — valor + origem + confiabilidade; IMC entra como CALCULADO (peso÷altura²). */}
      {Object.keys(summary).length > 0 || imcVal != null ? (
        <View style={[styles.card, card, { gap: 10 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Estado atual</Text>
          {/* Hierarquia A6 via MetricRow (DS): valor em destaque, metadados subordinados — mesma leitura em toda a plataforma. */}
          {imcVal != null ? <MetricRow label="IMC" value={`${imcVal} kg/m²`} meta="Calculado (peso ÷ altura²)" /> : null}
          {SUMMARY_ORDER.filter(m => summary[m]).map(m => {
            const s = summary[m]
            const q = sourceQuality(s.source)
            const value = `${s.value}${s.unit ? ` ${s.unit}` : ''}${s.delta != null && s.delta !== 0 ? ` (${s.delta > 0 ? '+' : ''}${s.delta})` : ''}`
            const meta = `${q?.label ?? s.source ?? '—'} · ${fmt(s.date)}${q ? ` · ${RELIABILITY_LABEL[q.reliability]}` : ''}`
            return <MetricRow key={m} label={bodyMetricLabel(m)} value={value} valueColor={trendColor(s.trend)} meta={meta} />
          })}
          {imcVal == null && summary['peso'] ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Informe sua altura no perfil (na Web) para calcular o IMC.</Text> : null}
        </View>
      ) : null}

      {/* ② Evolução longitudinal */}
      {evoIndicators.length > 0 ? (
        <View style={[styles.card, card, { gap: 10 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Evolução</Text>
          <Chips options={evoIndicators.map(m => ({ id: m.value, label: m.label }))} value={evoActive} onChange={(v) => setEvoMetric(v as BodyMetric)} />
          <Chips options={EVOLUTION_PERIODS.map(p => ({ id: p.key, label: p.label }))} value={EVOLUTION_PERIODS.find(p => p.days === evoDays)?.key ?? 'all'} onChange={(k) => setEvoDays(EVOLUTION_PERIODS.find(p => p.key === k)?.days ?? null)} />
          {evoPoints.length > 1 && evoMax > evoMin ? (
            <View style={styles.spark}>
              {evoPoints.map((p, i) => <View key={i} style={{ flex: 1, height: 44, justifyContent: 'flex-end' }}><View style={{ height: Math.max(3, ((p.value - evoMin) / (evoMax - evoMin)) * 44), backgroundColor: t.color.identity.primary, borderRadius: 2 }} /></View>)}
            </View>
          ) : <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Poucos pontos no período para desenhar a evolução.</Text>}
          {evoPoints.length > 0 ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{evoActive === 'imc' ? 'IMC' : bodyMetricLabel(evoActive)} · {evoPoints[0].value} → {evoPoints[evoPoints.length - 1].value} · {evoPoints.length} {evoPoints.length === 1 ? 'ponto' : 'pontos'} no período.</Text> : <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Sem pontos no período selecionado.</Text>}
          {evoSources.length > 0 ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Origem: {evoSources.map(s => sourceQuality(s)?.label ?? s).join(' · ')}</Text> : null}
          {/* Tabela cronológica (mais recente primeiro): data · valor · origem — toque abre o exame de origem. */}
          {evoDetail.map((p, i) => (
            <Pressable key={i} onPress={() => openExam(p.examId)} disabled={!p.examId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmt(p.date)}</Text>
              <Text spec={text(t, { role: 'caption' })} style={{ color: p.examId ? t.color.identity.primary : t.color.text.default }}>{p.value}{p.unit ? ` ${p.unit}` : ''}{p.source ? ` · ${sourceQuality(p.source)?.label ?? p.source}` : ''}{p.examId ? ' ›' : ''}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* ③ Comparação entre avaliações (A × B) */}
      {snapshots.length >= 2 ? (
        <View style={[styles.card, card, { gap: 10 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Comparar avaliações</Text>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>A: {snapLabel(snapA)}</Text>
              {snapA?.examId ? <Pressable onPress={() => openExam(snapA.examId)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Abrir exame</Text></Pressable> : null}
            </View>
            <Chips options={snapshots.map(s => ({ id: s.key, label: snapLabel(s) }))} value={snapA?.key ?? ''} onChange={setSnapAKey} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text spec={text(t, { role: 'caption', tone: 'muted' })}>B: {snapLabel(snapB)}</Text>
              {snapB?.examId ? <Pressable onPress={() => openExam(snapB.examId)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Abrir exame</Text></Pressable> : null}
            </View>
            <Chips options={snapshots.map(s => ({ id: s.key, label: snapLabel(s) }))} value={snapB?.key ?? ''} onChange={setSnapBKey} />
          </View>
          {sameSnap ? <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Selecione duas avaliações diferentes para comparar.</Text> : (
            <>
              {compareRelevant.length > 0 ? (
                <View style={{ gap: 2 }}>
                  <Text spec={text(t, { role: 'caption', tone: 'muted' })}>Entre essas duas avaliações houve:</Text>
                  {compareRelevant.map(r => <Text key={r.metric} spec={text(t, { role: 'caption' })}>• {bodyMetricLabel(r.metric)}: {r.delta! > 0 ? '+' : ''}{r.delta}{r.unit === '%' ? ' p.p.' : r.unit ? ` ${r.unit}` : ''}</Text>)}
                </View>
              ) : null}
              {compareRows.map(r => (
                <View key={r.metric} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text spec={text(t, { role: 'body' })}>{bodyMetricLabel(r.metric)}</Text>
                  {r.available ? (
                    <Text spec={text(t, { role: 'caption' })}>{r.a ?? '—'} → {r.b ?? '—'}{r.delta != null && r.delta !== 0 ? `  (${r.delta > 0 ? '+' : ''}${r.delta}${r.unit === '%' ? ' p.p.' : r.unit ? ` ${r.unit}` : ''})` : ''}</Text>
                  ) : <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Não disponível</Text>}
                </View>
              ))}
              <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Valores como medidos por cada método — sem ajuste entre tecnologias. Δ = A − B.</Text>
            </>
          )}
        </View>
      ) : null}

      {/* ⑤ Marcos (projeção de outros domínios) */}
      {catsPresent.length > 0 ? (
        <View style={[styles.card, card, { gap: 10 }]}>
          <Text spec={text(t, { role: 'bodyStrong' })}>Marcos</Text>
          <View style={styles.chips}>
            {catsPresent.map(c => {
              const on = msCats.has(c.key)
              return <Pressable key={c.key} onPress={() => toggleCat(c.key)} style={[styles.chip, { borderColor: on ? MILESTONE_COLOR[c.key] : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{c.label}</Text></Pressable>
            })}
          </View>
          {milestones.length > 0 ? milestones.map(m => {
            const linkable = /\/exams?\//.test(m.href ?? '')
            return (
              <Pressable key={m.key} onPress={() => openMilestone(m.href)} disabled={!linkable} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: MILESTONE_COLOR[m.category] }} />
                <Text spec={text(t, { role: 'caption', tone: 'muted' })} style={{ width: 72 }}>{fmt(m.date)}</Text>
                <Text spec={text(t, { role: 'body' })} style={{ flex: 1, color: linkable ? t.color.identity.primary : t.color.text.default }}>{m.title}{linkable ? ' ›' : ''}</Text>
              </Pressable>
            )
          }) : <Text spec={text(t, { role: 'caption', tone: 'faint' })}>Nenhum marco nas categorias selecionadas no período.</Text>}
        </View>
      ) : null}

      {/* ① Histórico de medidas */}
      {bodyItems.length > 0 ? <Text spec={text(t, { role: 'label', tone: 'muted' })}>REGISTROS</Text> : null}
      {bodyItems.length === 0 ? (
        <View style={[styles.card, card]}><Text spec={text(t, { role: 'body', tone: 'muted' })} style={{ textAlign: 'center' }}>Nenhuma medida ainda. Registre uma avaliação em “Nova medida”.</Text></View>
      ) : null}
      {bodyItems.map(m => {
        const laudo = m.exam_id ? exams.find(e => e.id === m.exam_id) : null
        return (
          <View key={m.id} style={[styles.card, card, { gap: 2 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text spec={text(t, { role: 'body' })}>{m.metric === 'outro' ? (m.label ?? 'Medida') : bodyMetricLabel(m.metric)}: {m.value_text}{m.unit ? ` ${m.unit}` : ''}</Text>
              <Pressable onPress={() => startEdit(m)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Editar</Text></Pressable>
            </View>
            <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{fmt(m.measured_on)}{sourceQuality(m.source) ? ` · ${sourceQuality(m.source)!.label}` : ''}</Text>
            {m.notes ? <Text spec={text(t, { role: 'caption', tone: 'muted' })}>{m.notes}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 2 }}>
              {m.exam_id ? <Pressable onPress={() => openExam(m.exam_id)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.identity.primary }}>Laudo{laudo ? `: ${laudo.display_title || laudo.type}` : ''} ›</Text></Pressable> : null}
              <Pressable onPress={() => remove(m)}><Text spec={text(t, { role: 'caption' })} style={{ color: t.color.badge.error.text }}>Excluir</Text></Pressable>
            </View>
          </View>
        )
      })}

      <Disclaimer variant="geral" />
    </ScrollView>
  )
}

function Chips({ options, value, onChange }: { options: readonly { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  const t = useTheme()
  return (
    <View style={styles.chips}>
      {options.map(o => {
        const on = value === o.id
        return <Pressable key={o.id} onPress={() => onChange(o.id)} style={[styles.chip, { borderColor: on ? t.color.identity.primary : t.color.border.default, backgroundColor: on ? t.color.badge.info.soft : 'transparent' }]}><Text spec={text(t, { role: 'caption', tone: on ? 'default' : 'muted' })}>{o.label}</Text></Pressable>
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 44 },
})
